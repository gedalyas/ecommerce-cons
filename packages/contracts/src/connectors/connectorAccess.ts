import type { AccessArea } from "../auth/accessAreas";
import { canEditEveryArea, type AreaAccess } from "../auth/accessRules";
import type { Connector } from "./connectorCatalog";
import type { DataKind } from "./dataKinds";

export const areaOfDataKind: Record<DataKind, AccessArea> = {
  sales: "DATA",
  products: "DATA",
  stock: "DATA",
  customers: "DATA",
  ad_spend: "MARKETING",
  traffic: "MARKETING",
  social: "MARKETING",
};

export function areasOfConnector(connector: Pick<Connector, "provides">): AccessArea[] {
  return [...new Set(connector.provides.map((kind) => areaOfDataKind[kind]))];
}

export function canManageConnector(
  access: AreaAccess,
  connector: Pick<Connector, "provides">,
): boolean {
  return canEditEveryArea(access, areasOfConnector(connector));
}
