import { Prisma, prismaClient } from "@ecommerce/database/client";
import type { SalesPlatform } from "@ecommerce/database/enums";
import type { Window } from "@ecommerce/contracts/shared/periodWindow";
import type { InventoryFacts } from "./inventoryMetrics";
import type {
  BoughtTogetherRow,
  ProductSales,
  ProductsFilterOptions,
  ProductsSearch,
} from "@ecommerce/contracts/products";

export type CatalogFilters = Pick<
  ProductsSearch,
  "categoria" | "subcategoria" | "marca" | "colecao"
>;

const inList = (column: Prisma.Sql, values: string[]) =>
  values.length ? Prisma.sql`and ${column} = any(${values}::text[])` : Prisma.empty;

/** Catalog filters, on the `p` (product) alias. */
export const catalogFilter = (filters: CatalogFilters | null) =>
  filters
    ? Prisma.sql`
        ${inList(Prisma.sql`p.category`, filters.categoria)}
        ${inList(Prisma.sql`p.subcategory`, filters.subcategoria)}
        ${inList(Prisma.sql`p.brand`, filters.marca)}
        ${inList(Prisma.sql`p.collection`, filters.colecao)}
      `
    : Prisma.empty;

const platformFilter = (platform: SalesPlatform | null) =>
  platform ? Prisma.sql`and o.sales_platform = ${platform}::sales_platform` : Prisma.empty;

/** Every product of the catalog with its paid sales in the window (zero when none). */
export async function productSales(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
  filters: CatalogFilters | null,
): Promise<ProductSales[]> {
  const rows = await prismaClient.$queryRaw<
    {
      product_id: string;
      name: string;
      category: string;
      subcategory: string | null;
      brand: string | null;
      collection: string | null;
      units: number;
      revenue: number;
      cost: number;
      orders: number;
      stock_qty: number;
    }[]
  >`
    with sales as (
      select i.product_id,
        sum(i.quantity)::int as units,
        sum(i.quantity * i.unit_price)::float8 as revenue,
        coalesce(sum(i.quantity * i.unit_cost), 0)::float8 as cost,
        count(distinct o.id)::int as orders
      from order_item i
      join sales_order o on o.id = i.order_id
      where o.client_id = ${clientId} and o.financial_status = 'PAID'
        and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
        ${platformFilter(platform)}
      group by i.product_id
    ),
    stock as (
      select product_id, sum(stock_qty)::int as stock_qty from product_variant group by product_id
    )
    select p.id as product_id, p.name, p.category, p.subcategory, p.brand, p.collection,
      coalesce(s.units, 0) as units, coalesce(s.revenue, 0) as revenue, coalesce(s.cost, 0) as cost,
      coalesce(s.orders, 0) as orders, coalesce(st.stock_qty, 0) as stock_qty
    from product p
    left join sales s on s.product_id = p.id
    left join stock st on st.product_id = p.id
    where p.client_id = ${clientId} ${catalogFilter(filters)}
    order by revenue desc, p.name
  `;
  return rows.map((r) => ({
    productId: r.product_id,
    name: r.name,
    category: r.category,
    subcategory: r.subcategory,
    brand: r.brand,
    collection: r.collection,
    units: r.units,
    revenue: r.revenue,
    cost: r.cost,
    orders: r.orders,
    stockQty: r.stock_qty,
  }));
}

/** Every variant with its stock and the fixed sales windows, relative to `today`. */
export async function inventoryFacts(
  clientId: string,
  today: Date,
  filters: CatalogFilters | null,
): Promise<InventoryFacts[]> {
  const rows = await prismaClient.$queryRaw<
    {
      variant_id: string;
      product_name: string;
      variant_name: string | null;
      sku: string;
      category: string;
      subcategory: string | null;
      brand: string | null;
      collection: string | null;
      stock_qty: number;
      price: number;
      cost: number | null;
      last_sale_at: Date | null;
      sold_total: number;
      sold_90: number;
      sold_30: number;
      sold_7: number;
    }[]
  >`
    with sold as (
      select i.variant_id,
        sum(i.quantity)::int as sold_total,
        sum(i.quantity) filter (where o.placed_at >= ${today}::timestamp - interval '90 days')::int as sold_90,
        sum(i.quantity) filter (where o.placed_at >= ${today}::timestamp - interval '30 days')::int as sold_30,
        sum(i.quantity) filter (where o.placed_at >= ${today}::timestamp - interval '7 days')::int as sold_7
      from order_item i
      join sales_order o on o.id = i.order_id
      where o.client_id = ${clientId} and o.financial_status = 'PAID' and o.placed_at < ${today}::timestamp + interval '1 day'
      group by i.variant_id
    )
    select v.id as variant_id, p.name as product_name, v.name as variant_name, v.sku,
      p.category, p.subcategory, p.brand, p.collection,
      v.stock_qty, v.price::float8 as price, v.cost::float8 as cost, v.last_sale_at,
      coalesce(s.sold_total, 0) as sold_total, coalesce(s.sold_90, 0) as sold_90,
      coalesce(s.sold_30, 0) as sold_30, coalesce(s.sold_7, 0) as sold_7
    from product_variant v
    join product p on p.id = v.product_id
    left join sold s on s.variant_id = v.id
    where p.client_id = ${clientId} ${catalogFilter(filters)}
    order by p.name, v.name
  `;
  return rows.map((r) => ({
    variantId: r.variant_id,
    productName: r.product_name,
    variantName: r.variant_name,
    sku: r.sku,
    category: r.category,
    subcategory: r.subcategory,
    brand: r.brand,
    collection: r.collection,
    stockQty: r.stock_qty,
    price: r.price,
    cost: r.cost,
    lastSaleAt: r.last_sale_at ? r.last_sale_at.toISOString() : null,
    soldTotal: r.sold_total,
    sold90: r.sold_90,
    sold30: r.sold_30,
    sold7: r.sold_7,
  }));
}

/** Pairs of products that appear in the same paid order, most frequent first. */
export async function boughtTogether(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
  limit = 20,
): Promise<BoughtTogetherRow[]> {
  const rows = await prismaClient.$queryRaw<
    { product_a: string; product_b: string; times: number; average_bundle: number }[]
  >`
    with lines as (
      select o.id as order_id, i.product_id, o.total_price
      from order_item i
      join sales_order o on o.id = i.order_id
      where o.client_id = ${clientId} and o.financial_status = 'PAID'
        and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
        ${platformFilter(platform)}
      group by o.id, i.product_id, o.total_price
    )
    select pa.name as product_a, pb.name as product_b,
      count(*)::int as times, avg(a.total_price)::float8 as average_bundle
    from lines a
    join lines b on b.order_id = a.order_id and b.product_id > a.product_id
    join product pa on pa.id = a.product_id
    join product pb on pb.id = b.product_id
    group by pa.name, pb.name
    order by times desc, average_bundle desc
    limit ${limit}
  `;
  return rows.map((r) => ({
    productA: r.product_a,
    productB: r.product_b,
    times: r.times,
    averageBundle: r.average_bundle,
  }));
}

export async function productsFilterOptions(clientId: string): Promise<ProductsFilterOptions> {
  const distinct = (column: Prisma.Sql) =>
    prismaClient.$queryRaw<{ value: string }[]>`
      select distinct ${column} as value from product p
      where p.client_id = ${clientId} and ${column} is not null
      order by 1
    `;
  const [categoria, subcategoria, marca, colecao] = await Promise.all([
    distinct(Prisma.sql`p.category`),
    distinct(Prisma.sql`p.subcategory`),
    distinct(Prisma.sql`p.brand`),
    distinct(Prisma.sql`p.collection`),
  ]);
  const plain = (rows: { value: string }[]) =>
    rows.map((r) => ({ value: r.value, label: r.value }));
  return {
    categoria: plain(categoria),
    subcategoria: plain(subcategoria),
    marca: plain(marca),
    colecao: plain(colecao),
  };
}
