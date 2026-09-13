import { Prisma } from "@/generated/prisma/client";
import type { SalesPlatform } from "@/generated/prisma/enums";
import { prismaClient } from "@/shared/dependencies/prismaClient";
import type { Window } from "@/shared/utils/periodWindow";
import type { OrdersFilters, RegionRow } from "./orders.types";
import { ordersWhere } from "./ordersService";
import { toRegionRows, type RegionSqlRow } from "./regionRows";

const regionColumns = Prisma.sql`
  coalesce(sum(o.total_price) filter (where o.financial_status = 'PAID'), 0)::float8 as paid,
  coalesce(sum(o.total_price), 0)::float8 as captured,
  count(*) filter (where o.financial_status = 'PAID')::int as paid_orders,
  count(*)::int as captured_orders,
  count(distinct o.customer_id) filter (where o.financial_status = 'PAID')::int as customers,
  coalesce(sum(o.items_count) filter (where o.financial_status = 'PAID'), 0)::int as items,
  coalesce(sum(o.total_discounts) filter (where o.financial_status = 'PAID'), 0)::float8 as discounts
`;

export async function salesByProvince(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
  filters: OrdersFilters,
): Promise<RegionRow[]> {
  const rows = await prismaClient.$queryRaw<RegionSqlRow[]>`
    select o.province as key, o.province as label, o.province, ${regionColumns}
    from sales_order o
    where ${ordersWhere(clientId, w, platform, filters)}
    group by o.province
    order by paid desc
  `;
  return toRegionRows(rows);
}

export async function salesByCity(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
  filters: OrdersFilters,
): Promise<RegionRow[]> {
  const rows = await prismaClient.$queryRaw<RegionSqlRow[]>`
    select o.city || ' / ' || o.province as key, o.city as label, o.province, ${regionColumns}
    from sales_order o
    where ${ordersWhere(clientId, w, platform, filters)}
    group by o.city, o.province
    order by paid desc
  `;
  return toRegionRows(rows);
}
