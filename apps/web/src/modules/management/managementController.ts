import { createServerFn } from "@tanstack/react-start";
import { PROTOTYPE_CLIENT_SLUG } from "@/shared/config/prototype";
import { managementScreen } from "./managementService";

export const getManagementScreen = createServerFn({ method: "GET" }).handler(async () =>
  managementScreen(PROTOTYPE_CLIENT_SLUG),
);
