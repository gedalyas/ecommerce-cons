import { createServerFn } from "@tanstack/react-start";
import { PROTOTYPE_CLIENT_SLUG } from "@/shared/config/prototype";
import { connectionsHealth, connectionsScreen } from "./connectionsService";

export const getConnectionsScreen = createServerFn({ method: "GET" }).handler(async () =>
  connectionsScreen(PROTOTYPE_CLIENT_SLUG),
);

export const getConnectionsHealth = createServerFn({ method: "GET" }).handler(async () =>
  connectionsHealth(PROTOTYPE_CLIENT_SLUG),
);
