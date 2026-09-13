import {
  IMPORT_MAX_ROWS,
  type ImportJob,
  type ImportKind,
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
import { persistAdSpend, persistOrders, persistTraffic } from "./importsWriteService";
import { mapAdSpend, mapOrders, mapTraffic } from "./mapRows";
import { missingRequiredHeaders } from "./rowReader";

export type UploadedFile = { name: string; size: number; buffer: Buffer };

const PARSE_BUDGET_MS = 20_000;
const ERRORS_KEPT = 50;
const HISTORY_SIZE = 20;

const manualConnector: ConnectorKey = "manual_csv";

const dataSourceOf: Record<ImportKind, (rows: { platform?: string }[]) => ConnectorKey[]> = {
  ORDERS: () => [manualConnector],
  AD_SPEND: (rows) => [
    manualConnector,
    ...new Set(
      rows.map((r): ConnectorKey =>
        r.platform === "META" ? "meta_ads" : r.platform === "GOOGLE" ? "google_ads" : "tiktok_ads",
      ),
    ),
  ],
  TRAFFIC: () => [manualConnector, "ga4"],
};

type Processed = { counts: ImportCounts; errors: ImportRowError[]; sources: ConnectorKey[] };

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

async function process(clientId: string, kind: ImportKind, file: UploadedFile): Promise<Processed> {
  const table = tableOf(kind, file);
  switch (kind) {
    case "ORDERS": {
      const { orders, errors } = mapOrders(table.header, table.rows);
      const written = await persistOrders(clientId, orders);
      const importedRows = orders
        .filter((_, i) => i < written)
        .reduce((s, o) => s + o.rows.length, 0);
      return {
        counts: { total: table.rows.length, imported: importedRows, rejected: errors.length },
        errors,
        sources: dataSourceOf.ORDERS([]),
      };
    }
    case "AD_SPEND": {
      const { rows, errors } = mapAdSpend(table.header, table.rows);
      const written = await persistAdSpend(clientId, rows);
      return {
        counts: { total: table.rows.length, imported: written, rejected: errors.length },
        errors,
        sources: dataSourceOf.AD_SPEND(rows),
      };
    }
    case "TRAFFIC": {
      const { rows, errors } = mapTraffic(table.header, table.rows);
      const written = await persistTraffic(clientId, rows);
      return {
        counts: { total: table.rows.length, imported: written, rejected: errors.length },
        errors,
        sources: dataSourceOf.TRAFFIC([]),
      };
    }
  }
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

const toJob = (row: {
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
}): ImportJob => ({
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
});

export async function runImport(
  clientId: string,
  userId: string,
  kind: ImportKind,
  file: UploadedFile,
  now: Date,
): Promise<ImportJob> {
  const { counts, errors, sources } = await process(clientId, kind, file);
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
  return toJob(job);
}

export async function importsScreen(clientId: string): Promise<ImportsScreen> {
  const rows = await prismaClient.importJob.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_SIZE,
  });
  return { jobs: rows.map(toJob) };
}

export async function importJobOf(clientId: string, id: string): Promise<ImportJob> {
  const row = await prismaClient.importJob.findFirst({ where: { clientId, id } });
  if (!row) throw notFound("Importação não encontrada");
  return toJob(row);
}
