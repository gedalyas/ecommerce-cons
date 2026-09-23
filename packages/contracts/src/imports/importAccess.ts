import type { AccessArea } from "../auth/accessAreas";
import { canEditArea, type AreaAccess } from "../auth/accessRules";
import type { DataKind } from "../connectors/contract";
import { importKinds, type ImportKind } from "./imports.types";

export const areaOfImportKind: Record<ImportKind, AccessArea> = {
  ORDERS: "DATA",
  AD_SPEND: "MARKETING",
  TRAFFIC: "MARKETING",
};

export const dataKindOfImport: Record<ImportKind, DataKind> = {
  ORDERS: "sales",
  AD_SPEND: "ad_spend",
  TRAFFIC: "traffic",
};

export function editableImportKinds(access: AreaAccess): ImportKind[] {
  return importKinds.filter((kind) => canEditArea(access, areaOfImportKind[kind]));
}
