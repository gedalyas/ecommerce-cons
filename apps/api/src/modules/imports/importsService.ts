import {
  IMPORT_MAX_ROWS,
  areaOfImportKind,
  dataKindOfImport,
  editableImportKinds,
  headerProblem,
  importKindLabel,
  isTemplateLayout,
  mappingProblems,
  mappingSampleOf,
  remapTable,
  suggestMapping,
  type ColumnMapping,
  type ImportJob,
  type ImportKind,
  type ImportPreviewResult,
  type ImportRowError,
  type ImportsScreen,
} from "@ecommerce/contracts/imports";
import {
  conflictingOwner,
  daysSince,
  ordersSince,
  ownerConflictMessage,
  type ConnectorKey,
} from "@ecommerce/contracts/connectors";
import { prismaClient } from "@ecommerce/database/client";
import type { ImportStatus } from "@ecommerce/database/enums";
import { recordActivity } from "@/modules/audit/contract";
import { assertAreaEdit } from "@/modules/auth/contract";
import { claimDataKinds, releaseDataKinds, sinceOf } from "@/modules/connections/contract";
import { refreshCustomers } from "@/modules/customers/contract";
import type { AuthContext } from "@/shared/http/auth.types";
import { HttpError, notFound } from "@/shared/http/httpError";
import { CsvLimitError, decodeCsvBuffer, hasBinaryContent, parseCsv } from "./csvParse";
import { rememberLayout, rememberedMapping } from "./importLayoutService";
import { importOutcome, type ImportCounts } from "./importOutcome";
import type { AdSpendRow, OrderInput, TrafficRow } from "./importRows.types";
import { sourcesStampedBy } from "./importSources";
import { saveUndoEntries, undoImport, undoableJobIds } from "./importsUndoService";
import { persistAdSpend, persistOrders, persistTraffic } from "./importsWriteService";
import { mapAdSpend, mapOrders, mapTraffic } from "./mapRows";
import { adSpendPreview, ordersPreview, trafficPreview, type PreviewBody } from "./previewRows";
import { undoRecorder, type UndoRecorder } from "./undoRecorder";
import { extensionOf } from "./uploadRules";
import { readXlsxTable } from "./xlsxReader";

export type UploadedFile = { name: string; size: number; buffer: Buffer };

const PARSE_BUDGET_MS = 20_000;
const ERRORS_KEPT = 50;
const HISTORY_SIZE = 20;

type Mapped =
  | { kind: "ORDERS"; orders: OrderInput[]; errors: ImportRowError[] }
  | { kind: "AD_SPEND"; rows: AdSpendRow[]; errors: ImportRowError[] }
  | { kind: "TRAFFIC"; rows: TrafficRow[]; errors: ImportRowError[] };

type Processed = { counts: ImportCounts; errors: ImportRowError[]; sources: ConnectorKey[] };
type Table = { header: string[]; rows: string[][] };
type ProcessInput = { clientId: string; kind: ImportKind; table: Table; undo: UndoRecorder };

export async function readTable(file: UploadedFile): Promise<Table> {
  const table =
    extensionOf(file.name) === ".xlsx"
      ? await readXlsxTable(file.buffer, { maxRows: IMPORT_MAX_ROWS, budgetMs: PARSE_BUDGET_MS })
      : readCsvTable(file);
  const problem = headerProblem(table.header);
  if (problem) throw new HttpError(422, problem);
  if (table.rows.length === 0) throw new HttpError(422, "O arquivo não tem linhas de dados.");
  return table;
}

function readCsvTable(file: UploadedFile): Table {
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
  return table;
}

function templateTableOf(kind: ImportKind, table: Table, mapping: ColumnMapping | null): Table {
  if (mapping) {
    const problems = mappingProblems(kind, table.header, mapping);
    if (problems.length > 0) throw new HttpError(422, problems.join(" "));
    return remapTable(kind, table.header, table.rows, mapping);
  }
  if (!isTemplateLayout(kind, table.header)) {
    throw new HttpError(400, "As colunas da planilha não seguem o modelo. Confira as colunas.");
  }
  return table;
}

function mapTable(kind: ImportKind, table: Table): { total: number; mapped: Mapped } {
  const total = table.rows.length;
  switch (kind) {
    case "ORDERS":
      return { total, mapped: { kind, ...mapOrders(table.header, table.rows) } };
    case "AD_SPEND":
      return { total, mapped: { kind, ...mapAdSpend(table.header, table.rows) } };
    case "TRAFFIC":
      return { total, mapped: { kind, ...mapTraffic(table.header, table.rows) } };
    case "PRODUCTS":
      throw new HttpError(422, "A importação de produtos ainda não está disponível.");
  }
}

async function process({ clientId, kind, table, undo }: ProcessInput): Promise<Processed> {
  const { total, mapped } = mapTable(kind, table);
  const rejected = mapped.errors.length;
  switch (mapped.kind) {
    case "ORDERS": {
      const orders = ordersSince(mapped.orders, await sinceOf(clientId, "sales"));
      const written = await persistOrders(clientId, orders, undo, {
        source: "manual_csv",
        connectionId: null,
      });
      const imported = orders.filter((_, i) => i < written).reduce((s, o) => s + o.rows.length, 0);
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
      const rows = daysSince(mapped.rows, await sinceOf(clientId, "traffic"));
      const imported = await persistTraffic(clientId, rows, undo);
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

export type ImportRequest = {
  kind: ImportKind;
  file: UploadedFile;
  mapping: ColumnMapping | null;
};

export async function previewImport(
  clientId: string,
  { kind, file, mapping }: ImportRequest,
  aiAvailable: boolean,
): Promise<ImportPreviewResult> {
  const table = await readTable(file);
  if (!mapping && !isTemplateLayout(kind, table.header)) {
    const remembered = await rememberedMapping({ clientId, kind, header: table.header });
    return {
      step: "mapping",
      kind,
      header: table.header,
      sample: mappingSampleOf(table.rows),
      mapping: remembered ?? suggestMapping(kind, table.header),
      remembered: remembered !== null,
      aiAvailable,
    };
  }
  const { total, mapped } = mapTable(kind, templateTableOf(kind, table, mapping));
  const rejected = mapped.errors.length;
  const valid = mapped.kind === "ORDERS" ? total - rejected : mapped.rows.length;
  return {
    step: "preview",
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

async function claimForSpreadsheet(clientId: string, kind: ImportKind): Promise<void> {
  const dataKind = dataKindOfImport[kind];
  const owners = await claimDataKinds(clientId, "manual_csv", [dataKind]);
  const owner = conflictingOwner(dataKind, "manual_csv", owners);
  if (owner) throw new HttpError(409, ownerConflictMessage(dataKind, owner));
}

async function releaseIfNoImportLeft(clientId: string, kind: ImportKind): Promise<void> {
  const active = await prismaClient.importJob.count({
    where: { clientId, kind, undoneAt: null, rowsImported: { gt: 0 } },
  });
  if (active === 0) await releaseDataKinds(clientId, "manual_csv", [dataKindOfImport[kind]]);
}

export async function runImport(
  auth: AuthContext,
  { kind, file, mapping }: ImportRequest,
  now: Date,
): Promise<ImportJob> {
  const { clientId, userId } = auth;
  const source = await readTable(file);
  const table = templateTableOf(kind, source, mapping);
  await claimForSpreadsheet(clientId, kind);
  const undo = undoRecorder();
  const { counts, errors, sources } = await process({ clientId, kind, table, undo });
  const status = importOutcome(counts);
  if (counts.imported === 0) await releaseIfNoImportLeft(clientId, kind);
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
  await recordActivity(auth, clientId, {
    action: "IMPORT_RUN",
    kind: importKindLabel[kind],
    fileName: file.name,
    imported: counts.imported,
    total: counts.total,
  });
  if (mapping && counts.imported > 0) {
    await rememberLayout({ clientId, kind, header: source.header }, mapping);
  }
  return toJob(job, entries.length > 0);
}

export async function importsScreen(auth: AuthContext): Promise<ImportsScreen> {
  const rows = await prismaClient.importJob.findMany({
    where: { clientId: auth.clientId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_SIZE,
  });
  const undoable = await undoableJobIds(auth.clientId);
  const editableKinds = editableImportKinds(auth.access);
  return {
    jobs: rows.map((row) => toJob(row, undoable.has(row.id) && editableKinds.includes(row.kind))),
    editableKinds,
  };
}

export async function importJobOf(clientId: string, id: string): Promise<ImportJob> {
  const row = await prismaClient.importJob.findFirst({ where: { clientId, id } });
  if (!row) throw notFound("Importação não encontrada");
  return toJob(row, (await undoableJobIds(clientId)).has(row.id));
}

export async function undoImportJob(auth: AuthContext, id: string, now: Date): Promise<ImportJob> {
  const existing = await importJobOf(auth.clientId, id);
  assertAreaEdit(auth, areaOfImportKind[existing.kind]);
  await undoImport(auth.clientId, id, now);
  await releaseIfNoImportLeft(auth.clientId, existing.kind);
  const job = await importJobOf(auth.clientId, id);
  await recordActivity(auth, auth.clientId, {
    action: "IMPORT_UNDONE",
    kind: importKindLabel[job.kind],
    fileName: job.fileName,
  });
  return job;
}
