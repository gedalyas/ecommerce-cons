import type { ConnectorKey } from "@ecommerce/contracts/connectors";
import type { Env } from "@/shared/config/env";
import type { ConnectorProvider, ProviderRegistry } from "./connectorProvider.types";

export function providersOf(_env: Env): ProviderRegistry {
  const providers: ConnectorProvider[] = [];
  return new Map<ConnectorKey, ConnectorProvider>(providers.map((p) => [p.key, p]));
}
