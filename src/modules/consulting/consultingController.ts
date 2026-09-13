import { createServerFn } from "@tanstack/react-start";
import { PROTOTYPE_CLIENT_SLUG } from "@/shared/config/prototype";
import { milestoneSummary } from "./consultingService";

export const getMilestoneSummary = createServerFn({ method: "GET" }).handler(async () =>
  milestoneSummary(PROTOTYPE_CLIENT_SLUG),
);
