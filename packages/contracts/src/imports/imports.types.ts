export const importKinds = ["ORDERS", "AD_SPEND", "TRAFFIC"] as const;
export type ImportKind = (typeof importKinds)[number];

export const importKindLabel: Record<ImportKind, string> = {
  ORDERS: "Pedidos",
  AD_SPEND: "Mídia paga",
  TRAFFIC: "Tráfego do site",
};

export const importStatuses = ["DONE", "PARTIAL", "FAILED", "UNDONE"] as const;
export type ImportStatus = (typeof importStatuses)[number];

export const importStatusLabel: Record<ImportStatus, string> = {
  DONE: "Concluída",
  PARTIAL: "Parcial",
  FAILED: "Falhou",
  UNDONE: "Desfeita",
};

export const IMPORT_MAX_BYTES = 10 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 50_000;
export const IMPORT_ACCEPTED_EXTENSIONS = [".csv"] as const;

export type ImportRowError = { row: number; message: string };

export type ImportJob = {
  id: string;
  kind: ImportKind;
  status: ImportStatus;
  fileName: string;
  fileSize: number;
  rowsTotal: number;
  rowsImported: number;
  rowsRejected: number;
  errors: ImportRowError[];
  createdAt: string;
  finishedAt: string | null;
  undoneAt: string | null;
  canUndo: boolean;
};

export type ImportsScreen = { jobs: ImportJob[] };

export const IMPORT_PREVIEW_ROWS = 10;

export const importPreviewColumnTypes = ["text", "date", "integer", "currency"] as const;
export type ImportPreviewColumnType = (typeof importPreviewColumnTypes)[number];

export type ImportPreviewColumn = { key: string; header: string; type: ImportPreviewColumnType };

export type ImportPreviewCell = string | number | null;

export type ImportPreviewSummary = {
  count: number;
  label: string;
  from: string | null;
  to: string | null;
};

export type ImportPreview = {
  kind: ImportKind;
  counts: { total: number; valid: number; rejected: number };
  errors: ImportRowError[];
  summary: ImportPreviewSummary;
  columns: ImportPreviewColumn[];
  sample: Record<string, ImportPreviewCell>[];
};
