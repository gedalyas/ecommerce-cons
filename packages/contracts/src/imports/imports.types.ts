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
export const IMPORT_MAX_COLUMNS = 200;
export const IMPORT_MAX_HEADER_LENGTH = 200;
export const IMPORT_ACCEPTED_EXTENSIONS = [".csv", ".xlsx"] as const;
export type ImportExtension = (typeof IMPORT_ACCEPTED_EXTENSIONS)[number];

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

export type ImportsScreen = { jobs: ImportJob[]; editableKinds: ImportKind[] };

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
  step: "preview";
  kind: ImportKind;
  counts: { total: number; valid: number; rejected: number };
  errors: ImportRowError[];
  summary: ImportPreviewSummary;
  columns: ImportPreviewColumn[];
  sample: Record<string, ImportPreviewCell>[];
};

export const IMPORT_MAPPING_SAMPLE_ROWS = 5;

export type ColumnMapping = Record<string, string>;

export type ImportMappingPreview = {
  step: "mapping";
  kind: ImportKind;
  header: string[];
  sample: string[][];
  mapping: ColumnMapping;
  remembered: boolean;
  aiAvailable: boolean;
};

export type ImportMappingSuggestion = { mapping: ColumnMapping };

export type ImportPreviewResult = ImportPreview | ImportMappingPreview;
