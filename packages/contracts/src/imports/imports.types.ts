export const importKinds = ["ORDERS", "AD_SPEND", "TRAFFIC"] as const;
export type ImportKind = (typeof importKinds)[number];

export const importKindLabel: Record<ImportKind, string> = {
  ORDERS: "Pedidos",
  AD_SPEND: "Mídia paga",
  TRAFFIC: "Tráfego do site",
};

export const importStatuses = ["DONE", "PARTIAL", "FAILED"] as const;
export type ImportStatus = (typeof importStatuses)[number];

export const importStatusLabel: Record<ImportStatus, string> = {
  DONE: "Concluída",
  PARTIAL: "Parcial",
  FAILED: "Falhou",
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
};

export type ImportsScreen = { jobs: ImportJob[] };
