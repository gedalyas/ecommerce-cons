import type { AdPlatform } from "@/generated/prisma/enums";
import { prismaClient } from "@/shared/dependencies/prismaClient";
import type { Window } from "@/shared/utils/periodWindow";
import type { RegionPerformanceRow } from "./marketing.types";
import { regionRows, type RegionSalesRow, type RegionSpendRow } from "./regionPerformance";

export async function regionSpend(clientId: string, w: Window): Promise<RegionSpendRow[]> {
  const rows = await prismaClient.$queryRaw<
    (Omit<RegionSpendRow, "platform"> & { platform: AdPlatform })[]
  >`
    select r.province, r.platform,
      coalesce(sum(r.spend), 0)::float8 as spend,
      coalesce(sum(r.impressions), 0)::int as impressions,
      coalesce(sum(r.clicks), 0)::int as clicks,
      coalesce(sum(r.conversions), 0)::int as conversions
    from ad_spend_region_daily r
    where r.client_id = ${clientId} and r.date >= ${w.start} and r.date < ${w.end}
    group by 1, 2
  `;
  return rows;
}

export async function regionSales(clientId: string, w: Window): Promise<RegionSalesRow[]> {
  return prismaClient.$queryRaw<RegionSalesRow[]>`
    select o.province,
      coalesce(sum(o.total_price), 0)::float8 as revenue,
      count(*)::int as orders,
      count(distinct o.customer_id)::int as customers,
      count(*) filter (where o.order_number_for_customer >= 2)::int as repeat_orders,
      count(distinct o.customer_id) filter (
        where c.first_order_at >= ${w.start} and c.first_order_at < ${w.end}
      )::int as new_customers
    from sales_order o
    join customer c on c.id = o.customer_id
    where o.client_id = ${clientId} and o.financial_status = 'PAID'
      and o.sales_platform = 'ECOMMERCE'
      and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
    group by 1
  `;
}

export async function regionPerformance(
  clientId: string,
  w: Window,
  includeFee: boolean,
): Promise<RegionPerformanceRow[]> {
  const [spend, sales] = await Promise.all([regionSpend(clientId, w), regionSales(clientId, w)]);
  return regionRows(spend, sales, includeFee);
}
