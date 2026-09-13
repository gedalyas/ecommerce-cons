import { createServerFn } from "@tanstack/react-start";
import { PROTOTYPE_CLIENT_SLUG } from "@/shared/config/prototype";
import { logisticsScreen } from "./logisticsService";

export const getLogisticsScreen = createServerFn({ method: "GET" }).handler(async () =>
  logisticsScreen(PROTOTYPE_CLIENT_SLUG),
);
