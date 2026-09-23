import { Prisma, prismaClient } from "@ecommerce/database/client";
import type { SalesPlatform } from "@ecommerce/database/enums";
import type { Window } from "@ecommerce/contracts/shared/periodWindow";
import type { UtmSalesRow, UtmDimension } from "@ecommerce/contracts/marketing";
import { channelOf } from "@ecommerce/contracts/marketing";

export const platformFilter = (platform: SalesPlatform | null) =>
  platform ? Prisma.sql`and o.sales_platform = ${platform}::sales_platform` : Prisma.empty;

type AttributionRow = {
  marketplace: boolean;
  channel: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  orders: number;
  revenue: number;
};

async function attributionRows(clientId: string, w: Window, platform: SalesPlatform | null) {
  return prismaClient.$queryRaw<AttributionRow[]>`
    select (o.sales_platform = 'MARKETPLACE') as marketplace, o.channel,
      o.utm_source as source, o.utm_medium as medium, o.utm_campaign as campaign,
      count(*)::int as orders, coalesce(sum(o.total_price), 0)::float8 as revenue
    from sales_order o
    where o.client_id = ${clientId} and o.financial_status = 'PAID'
      and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
      ${platformFilter(platform)}
    group by 1, 2, 3, 4, 5
  `;
}

const labelFor = (r: AttributionRow, dimension: UtmDimension) => {
  switch (dimension) {
    case "canal":
      return channelOf(r.medium, r.marketplace);
    case "origem":
      return r.marketplace ? r.channel : (r.source ?? "(direct)");
    case "origem-meio":
      return r.marketplace ? r.channel : `${r.source ?? "(direct)"} / ${r.medium ?? "(none)"}`;
    case "campanha":
      return r.marketplace ? r.channel : (r.campaign ?? "(sem campanha)");
  }
};

export async function utmSales(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
  dimension: UtmDimension,
): Promise<UtmSalesRow[]> {
  const rows = await attributionRows(clientId, w, platform);
  const groups = new Map<string, { orders: number; revenue: number }>();
  for (const r of rows) {
    const label = labelFor(r, dimension);
    const g = groups.get(label) ?? { orders: 0, revenue: 0 };
    g.orders += r.orders;
    g.revenue += r.revenue;
    groups.set(label, g);
  }
  const total = rows.reduce((s, r) => s + r.revenue, 0);
  return [...groups.entries()]
    .map(([label, g]) => ({
      key: label,
      label,
      orders: g.orders,
      revenue: g.revenue,
      share: total > 0 ? (g.revenue / total) * 100 : 0,
      aov: g.orders > 0 ? g.revenue / g.orders : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function topSourceShare(
  clientId: string,
  w: Window,
): Promise<{ label: string; share: number } | null> {
  const rows = await utmSales(clientId, w, null, "origem-meio");
  const top = rows[0];
  return top ? { label: top.label, share: top.share } : null;
}

export async function storeOrders(
  clientId: string,
  w: Window,
): Promise<{ orders: number; paidOrders: number }> {
  const rows = await prismaClient.$queryRaw<{ orders: number; paid_orders: number }[]>`
    select count(*)::int as orders,
      count(*) filter (where o.financial_status = 'PAID')::int as paid_orders
    from sales_order o
    where o.client_id = ${clientId} and o.sales_platform = 'ECOMMERCE'
      and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
  `;
  return { orders: rows[0]?.orders ?? 0, paidOrders: rows[0]?.paid_orders ?? 0 };
}
