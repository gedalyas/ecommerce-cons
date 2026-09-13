import { index, rootRoute, route } from "@tanstack/virtual-file-routes";

/**
 * Route files are named in English (project language rule) while the URLs the
 * user sees stay in Portuguese. This map is the only place the two meet.
 */
export const routes = rootRoute("__root.tsx", [
  index("dashboard.tsx"),
  route("/dinheiro", "money.tsx"),
  route("/marketing", "marketing.tsx"),
  route("/logistica", "logistics.tsx"),
  route("/gestao", "management.tsx"),
  route("/conexoes", "connections.tsx"),
  route("/assistente", "assistant.tsx"),
]);
