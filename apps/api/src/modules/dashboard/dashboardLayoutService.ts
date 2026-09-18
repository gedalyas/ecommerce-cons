import { prismaClient } from "@ecommerce/database/client";
import {
  normalizeDashboardLayout,
  type DashboardLayout,
  type DashboardLayoutInput,
} from "@ecommerce/contracts/dashboard";
import type { AuthContext } from "@/shared/http/auth.types";

export async function dashboardLayoutFor(
  userId: string,
  clientId: string,
): Promise<DashboardLayout> {
  const row = await prismaClient.dashboardLayout.findUnique({
    where: { userId_clientId: { userId, clientId } },
    select: { widgets: true },
  });
  return normalizeDashboardLayout(row ? { widgets: row.widgets } : null);
}

export async function saveDashboardLayout(
  auth: AuthContext,
  input: DashboardLayoutInput,
): Promise<DashboardLayout> {
  const layout = normalizeDashboardLayout(input);
  await prismaClient.dashboardLayout.upsert({
    where: { userId_clientId: { userId: auth.userId, clientId: auth.clientId } },
    create: { userId: auth.userId, clientId: auth.clientId, widgets: layout.widgets },
    update: { widgets: layout.widgets },
  });
  return layout;
}
