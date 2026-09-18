import type { AccessArea } from "../auth/accessAreas";
import { canEditEveryArea, type AreaAccess } from "../auth/accessRules";
import type { Connector, ConnectorFeed } from "./connectorCatalog";

export const areaOfFeed: Record<ConnectorFeed, AccessArea> = {
  orders: "DATA",
  ad_spend: "MARKETING",
  traffic: "MARKETING",
  social: "MARKETING",
};

export function areasOfConnector(connector: Pick<Connector, "feeds">): AccessArea[] {
  return [...new Set(connector.feeds.map((feed) => areaOfFeed[feed]))];
}

export function canManageConnector(
  access: AreaAccess,
  connector: Pick<Connector, "feeds">,
): boolean {
  return canEditEveryArea(access, areasOfConnector(connector));
}
