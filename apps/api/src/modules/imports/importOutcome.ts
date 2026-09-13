import type { ImportStatus } from "@ecommerce/contracts/imports";

export type ImportCounts = { total: number; imported: number; rejected: number };

export function importOutcome(counts: ImportCounts): ImportStatus {
  if (counts.imported === 0) return "FAILED";
  return counts.rejected > 0 ? "PARTIAL" : "DONE";
}
