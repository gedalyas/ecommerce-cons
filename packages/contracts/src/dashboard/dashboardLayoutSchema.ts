import { z } from "zod";
import { dashboardWidgetKinds, dashboardWidgetSizes } from "./dashboardWidgets";

export const dashboardWidgetSchema = z.object({
  kind: z.enum(dashboardWidgetKinds),
  size: z.enum(dashboardWidgetSizes),
});

export const dashboardLayoutSchema = z.object({
  widgets: z.array(dashboardWidgetSchema).max(dashboardWidgetKinds.length),
});

export type DashboardLayoutInput = z.infer<typeof dashboardLayoutSchema>;
