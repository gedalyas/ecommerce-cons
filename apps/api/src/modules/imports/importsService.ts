import {
  IMPORT_MAX_ROWS,
  type ImportJob,
  type ImportKind,
  type ImportPreview,
  type ImportRowError,
  type ImportsScreen,
} from "@ecommerce/contracts/imports";
import type { ConnectorKey } from "@ecommerce/contracts/connectors";
import { prismaClient } from "@ecommerce/database/client";
import type { ImportStatus } from "@ecommerce/database/enums";
import { refreshCustomers } from "@/modules/customers/contract";
import { HttpError, notFound } from "@/shared/http/httpError";
import { CsvLimitError, decodeCsvBuffer, hasBinaryContent, parseCsv } from "./csvParse";
import { importOutcome, type ImportCounts } from "./importOutcome";
import type { AdSpendRow, OrderInput, TrafficRow } from "./importRows.types";
import { sourcesStampedBy } from "./importSources";
import { saveUndoEntries, undoImport, undoableJobIds } from "./importsUndoService";
import { persistAdSpend, persistOrders, persistTraffic } from "./importsWriteService";
import { mapAdSpend, mapOrders, mapTraffic } from "./mapRows";
import { adSpendPreview, ordersPreview, trafficPreview, type PreviewBody } from "./previewRows";
import { missingRequiredHeaders } from "./rowReader";
import { undoRecorder, type UndoRecorder } from "./undoRecorder";

export type UploadedFile = { name: string; size: number; buffer: Buffer };

const PARSE_BUDGET_MS = 20_000;
const ERRORS_KEPT = 50;
const HISTORY_SIZE = 20;

type Mapped =
  | { kind: "ORDERS"; orders: OrderInput[]; errors: ImportRowError[] }
  | { kind: "AD_SPEND"; rows: AdSpendRow[]; errors: ImportRowError[] }
  | { kind: "TRAFFIC"; rows: TrafficRow[]; errors: ImportRowError[] };

type Processed = { counts: ImportCounts; errors: ImportRowError[]; sources: ConnectorKey[] };
type ProcessInput = { clientId: string; kind: ImportKind; file: UploadedFile; undo: UndoRecorder };

function tableOf(kind: ImportKind, file: UploadedFile) {
  if (hasBinaryContent(file.buffer)) {
    throw new HttpError(415, "O arquivo não é um CSV de texto.");
  }
  let table;
  try {
    table = parseCsv(decodeCsvBuffer(file.buffer), {
      maxRows: IMPORT_MAX_ROWS + 1,
      budgetMs: PARSE_BUDGET_MS,
    });
  } catch (error) {
    if (error instanceof CsvLimitError) throw new HttpError(422, error.message);
    throw error;
  }
  const missing = missingRequiredHeaders(kind, table.header);
  if (missing.length > 0) {
    throw new HttpError(400, `Faltam colunas obrigatórias no cabeçalho: ${missing.join(", ")}.`);
  }
  if (table.rows.length === 0) throw new HttpError(422, "O arquivo não tem linhas de dados.");
  return table;
}

function mapTable(kind: ImportKind, file: UploadedFile): { total: number; mapped: Mapped } {
  const table = tableOf(kind, file);
  const total = table.rows.length;
  switch (kind) {
    case "ORDERS":
      return { total, mapped: { kind, ...mapOrders(table.header, table.rows) } };
    case "AD_SPEND":
      return { total, mapped: { kind, ...mapAdSpend(table.header, table.rows) } };
    case "TRAFFIC":
      return { total, mapped: { kind, ...mapTraffic(table.header, table.rows) } };
  }
}

async function process({ clientId, kind, file, undo }: ProcessInput): Promise<Processed> {
  const { total, mapped } = mapTable(kind, file);
  const rejected = mapped.errors.length;
  switch (mapped.kind) {
    case "ORDERS": {
      const written = await persistOrders(clientId, mapped.orders, undo);
      const imported = mapped.orders
        .filter((_, i) => i < written)
        .reduce((s, o) => s + o.rows.length, 0);
      return {
        counts: { total, imported, rejected },
        errors: mapped.errors,
        sources: sourcesStampedBy(kind, []),
      };
    }
    case "AD_SPEND": {
      const imported = await persistAdSpend(clientId, mapped.rows, undo);
      return {
        counts: { total, imported, rejected },
        errors: mapped.errors,
        sources: sourcesStampedBy(
          kind,
          mapped.rows.map((r) => r.platform),
        ),
      };
    }
    case "TRAFFIC": {
      const imported = await persistTraffic(clientId, mapped.rows, undo);
      return {
        counts: { total, imported, rejected },
        errors: mapped.errors,
        sources: sourcesStampedBy(kind, []),
      };
    }
  }
}

function previewBodyOf(mapped: Mapped): PreviewBody {
  switch (mapped.kind) {
    case "ORDERS":
      return ordersPreview(mapped.orders);
    case "AD_SPEND":
      return adSpendPreview(mapped.rows);
    case "TRAFFIC":
      return trafficPreview(mapped.rows);
  }
}

export function previewImport(kind: ImportKind, file: UploadedFile): ImportPreview {
  const { total, mapped } = mapTable(kind, file);
  const rejected = mapped.errors.length;
  const valid = mapped.kind === "ORDERS" ? total - rejected : mapped.rows.length;
  return {
    kind,
    counts: { total, valid, rejected },
    errors: mapped.errors.slice(0, ERRORS_KEPT),
    ...previewBodyOf(mapped),
  };
}

async function stampDataSources(clientId: string, keys: ConnectorKey[], now: Date) {
  await prismaClient.dataSource.updateMany({
    where: { clientId, connectorKey: { in: keys }, status: { in: ["NOT_CONNECTED", "ERROR"] } },
    data: { status: "MANUAL" },
  });
  await prismaClient.dataSource.updateMany({
    where: { clientId, connectorKey: { in: keys } },
    data: { lastSyncedAt: now },
  });
}

type JobRow = {
  id: string;
  kind: ImportKind;
  status: ImportStatus;
  fileName: string;
  fileSize: number;
  rowsTotal: number;
  rowsImported: number;
  rowsRejected: number;
  errors: unknown;
  createdAt: Date;
  finishedAt: Date | null;
  undoneAt: Date | null;
};

const toJob = (row: JobRow, canUndo: boolean): ImportJob => ({
  id: row.id,
  kind: row.kind,
  status: row.status,
  fileName: row.fileName,
  fileSize: row.fileSize,
  rowsTotal: row.rowsTotal,
  rowsImported: row.rowsImported,
  rowsRejected: row.rowsRejected,
  errors: Array.isArray(row.errors) ? (row.errors as ImportRowError[]) : [],
  createdAt: row.createdAt.toISOString(),
  finishedAt: row.finishedAt?.toISOString() ?? null,
  undoneAt: row.undoneAt?.toISOString() ?? null,
  canUndo,
});

export async function runImport(
  clientId: string,
  userId: string,
  kind: ImportKind,
  file: UploadedFile,
  now: Date,
): Promise<ImportJob> {
  const undo = undoRecorder();
  const { counts, errors, sources } = await process({ clientId, kind, file, undo });
  const status = importOutcome(counts);
  if (counts.imported > 0) {
    await stampDataSources(clientId, sources, now);
    if (kind === "ORDERS") await refreshCustomers(clientId);
  }
  const job = await prismaClient.importJob.create({
    data: {
      clientId,
      userId,
      kind,
      status,
      fileName: file.name,
      fileSize: file.size,
      rowsTotal: counts.total,
      rowsImported: counts.imported,
      rowsRejected: counts.rejected,
      errors: errors.slice(0, ERRORS_KEPT),
      finishedAt: now,
    },
  });
  const entries = counts.imported > 0 ? undo.entries() : [];
  await saveUndoEntries(clientId, kind, job.id, entries);
  return toJob(job, entries.length > 0);
}

export async function importsScreen(clientId: string): Promise<ImportsScreen> {
  const rows = await prismaClient.importJob.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_SIZE,
  });
  const undoable = await undoableJobIds(clientId);
  return { jobs: rows.map((row) => toJob(row, undoable.has(row.id))) };
}

export async function importJobOf(clientId: string, id: string): Promise<ImportJob> {
  const row = await prismaClient.importJob.findFirst({ where: { clientId, id } });
  if (!row) throw notFound("Importação não encontrada");
  return toJob(row, (await undoableJobIds(clientId)).has(row.id));
}

export async function undoImportJob(clientId: string, id: string, now: Date): Promise<ImportJob> {
  await undoImport(clientId, id, now);
  return importJobOf(clientId, id);
}
