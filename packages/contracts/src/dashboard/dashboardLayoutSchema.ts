import { z } from "zod";
import { dashboardWidgetKinds } from "./dashboardWidgets";

export const dashboardWidgetSchema = z.object({
  kind: z.enum(dashboardWidgetKinds),
});

export const dashboardLayoutSchema = z.object({
  widgets: z.array(dashboardWidgetSchema).max(dashboardWidgetKinds.length),
});

export type DashboardLayoutInput = z.infer<typeof dashboardLayoutSchema>;
