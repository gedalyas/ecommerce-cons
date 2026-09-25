import { Prisma, prismaClient } from "@ecommerce/database/client";
import type { ProductPerformanceRow } from "@ecommerce/contracts/marketing";
import type { Window } from "@ecommerce/contracts/shared/periodWindow";
import { productPerformance, type ItemSums, type SiteSales } from "./productPerformance";

const ITEM_LIMIT = 50;

async function itemsByProduct(clientId: string, w: Window): Promise<ItemSums[]> {
  return prismaClient.$queryRaw<ItemSums[]>`
    with items as (
      select t.item_id, (array_agg(t.item_name order by t.date desc))[1] as item_name,
        coalesce(sum(t.items_viewed), 0)::int as views,
        coalesce(sum(t.items_added_to_cart), 0)::int as add_to_cart,
        coalesce(sum(t.items_purchased), 0)::int as purchases
      from traffic_item_daily t
      where t.client_id = ${clientId} and t.date >= ${w.start} and t.date < ${w.end}
      group by t.item_id
    ),
    sku_owners as (
      select v.sku, min(v.product_id) as product_id
      from product_variant v
      join product p on p.id = v.product_id and p.client_id = ${clientId}
      where v.sku in (select item_id from items)
      group by v.sku
      having count(distinct v.product_id) = 1
    ),
    resolved as (
      select i.*, coalesce(o.product_id, p.id) as product_id, p2.name as product_name
      from items i
      left join sku_owners o on o.sku = i.item_id
      left join product p on p.id = i.item_id and p.client_id = ${clientId}
      left join product p2 on p2.id = coalesce(o.product_id, p.id)
    )
    select coalesce(product_id, 'item:' || item_id) as "key", product_id as "productId",
      coalesce(max(product_name), max(item_name)) as "name",
      sum(views)::int as "views", sum(add_to_cart)::int as "addToCart",
      sum(purchases)::int as "purchases"
    from resolved
    group by 1, 2
    order by "views" desc, 1
    limit ${ITEM_LIMIT}
  `;
}

async function siteSales(clientId: string, w: Window, productIds: string[]): Promise<SiteSales[]> {
  if (productIds.length === 0) return [];
  return prismaClient.$queryRaw<SiteSales[]>`
    select i.product_id as "productId", sum(i.quantity)::int as "units",
      coalesce(sum(i.quantity * i.unit_price), 0)::float8 as "revenue"
    from order_item i
    join sales_order o on o.id = i.order_id
    where o.client_id = ${clientId} and o.financial_status = 'PAID'
      and o.sales_platform = 'ECOMMERCE'
      and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
      and i.product_id in (${Prisma.join(productIds)})
    group by i.product_id
  `;
}

export async function productPerformanceOf(
  clientId: string,
  w: Window,
): Promise<ProductPerformanceRow[]> {
  const items = await itemsByProduct(clientId, w);
  const productIds = items.flatMap((i) => (i.productId ? [i.productId] : []));
  return productPerformance(items, await siteSales(clientId, w, productIds));
}
