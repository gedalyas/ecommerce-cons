import type { DataSourceStatus } from "@/generated/prisma/enums";

/** A data source as other modules see it, to decide how much to trust a number. */
export type DataSourceState = {
  name: string;
  kind: string;
  status: DataSourceStatus;
  /** Display label of the last sync, e.g. "hoje às 03:12" or "há 6 dias". */
  syncLabel: string;
};
