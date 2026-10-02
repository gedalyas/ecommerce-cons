import { connectorOf, type ConnectorKey } from "@ecommerce/contracts/connectors";

export function integrationLabel(key: ConnectorKey, name: string): string {
  const label = connectorOf(key).label;
  return name.trim() === "" || name === label ? label : `${label} (${name})`;
}
