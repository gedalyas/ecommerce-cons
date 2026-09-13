/**
 * RFM orchestrator: the customer table with the filter panel, the segment
 * shares and the aggregate refresh that recomputes scores from paid orders.
 * Server-only.
 */
import { Prisma } from "@/generated/prisma/client";
import { prismaClient } from "@/shared/dependencies/prismaClient";
import { PROTOTYPE_TODAY } from "@/shared/config/prototype";
import type { RfmCustomerRow, RfmFilterOptions, RfmPage, RfmSegmentShare } from "./customers.types";
import type { CustomersSearch, CustomersSortField, InactivityBand } from "./customersSchema";
import { frequencyScore, quintileScorer, rfmSegmentLabels, segmentFor } from "./rfmSegments";

const inList = (column: Prisma.Sql, values: string[]) =>
  values.length ? Prisma.sql`and ${column} = any(${values}::text[])` : Prisma.empty;

const between = (column: Prisma.Sql, from: string | null, to: string | null) => Prisma.sql`
  ${from ? Prisma.sql`and ${column} >= ${from}::date` : Prisma.empty}
  ${to ? Prisma.sql`and ${column} < ${to}::date + interval '1 day'` : Prisma.empty}
`;

const numberBetween = (column: Prisma.Sql, min: number | null, max: number | null) => Prisma.sql`
  ${min != null ? Prisma.sql`and ${column} >= ${min}` : Prisma.empty}
  ${max != null ? Prisma.sql`and ${column} <= ${max}` : Prisma.empty}
`;

const bandCondition = (band: InactivityBand) => {
  switch (band) {
    case "0-30":
      return Prisma.sql`c.days_since_last_purchase between 0 and 30`;
    case "31-60":
      return Prisma.sql`c.days_since_last_purchase between 31 and 60`;
    case "61-90":
      return Prisma.sql`c.days_since_last_purchase between 61 and 90`;
    case "91-180":
      return Prisma.sql`c.days_since_last_purchase between 91 and 180`;
    case "181+":
      return Prisma.sql`c.days_since_last_purchase > 180`;
  }
};

/** An EXISTS over the customer's paid orders with the given extra condition. */
const hasOrder = (condition: Prisma.Sql, negate = false) => Prisma.sql`
  and ${negate ? Prisma.sql`not` : Prisma.empty} exists (
    select 1 from sales_order o where o.customer_id = c.id and o.financial_status = 'PAID' ${condition}
  )
`;

const boughtProducts = (productIds: string[], negate: boolean) =>
  productIds.length
    ? hasOrder(
        Prisma.sql`and exists (select 1 from order_item i where i.order_id = o.id and i.product_id = any(${productIds}::text[]))`,
        negate,
      )
    : Prisma.empty;

/** The whole filter panel as one WHERE fragment on the `c` (customer) alias. */
export const rfmWhere = (clientId: string, s: CustomersSearch) => Prisma.sql`
  c.client_id = ${clientId} and c.orders_count > 0
  ${inList(Prisma.sql`c.rfm_segment`, s.segmento)}
  ${inList(Prisma.sql`c.acquisition_source`, s.origem)}
  ${inList(Prisma.sql`c.province`, s.uf)}
  ${inList(Prisma.sql`c.city`, s.cidade)}
  ${between(Prisma.sql`c.first_order_at`, s.primeiraDe, s.primeiraAte)}
  ${between(Prisma.sql`c.last_order_at`, s.ultimaDe, s.ultimaAte)}
  ${numberBetween(Prisma.sql`c.total_spent`, s.totalMin, s.totalMax)}
  ${numberBetween(Prisma.sql`c.orders_count`, s.pedidosMin, s.pedidosMax)}
  ${
    s.inatividade.length
      ? Prisma.sql`and (${Prisma.join(
          s.inatividade.map((b) => bandCondition(b)),
          " or ",
        )})`
      : Prisma.empty
  }
  ${
    s.comprasDe || s.comprasAte
      ? hasOrder(between(Prisma.sql`o.placed_at`, s.comprasDe, s.comprasAte))
      : Prisma.empty
  }
  ${s.gateway.length ? hasOrder(Prisma.sql`and o.payment_gateway = any(${s.gateway}::text[])`) : Prisma.empty}
  ${s.metodo.length ? hasOrder(Prisma.sql`and o.processing_method::text = any(${s.metodo}::text[])`) : Prisma.empty}
  ${s.cupom.length ? hasOrder(Prisma.sql`and o.discount_codes && ${s.cupom}::text[]`, s.cupomModo === "excluir") : Prisma.empty}
  ${boughtProducts(s.comprou, false)}
  ${boughtProducts(s.naoComprou, true)}
`;

const sortColumn: Record<CustomersSortField, Prisma.Sql> = {
  name: Prisma.sql`c.name`,
  orders: Prisma.sql`c.orders_count`,
  total: Prisma.sql`c.total_spent`,
  lastOrderAt: Prisma.sql`c.last_order_at`,
};

const MAX_EXPORT_ROWS = 5000;

export async function rfmPage(
  clientId: string,
  s: CustomersSearch,
  options: { forExport?: boolean } = {},
): Promise<RfmPage> {
  const where = rfmWhere(clientId, s);
  const pageSize = options.forExport ? MAX_EXPORT_ROWS : s.porPagina;
  const page = options.forExport ? 1 : s.pagina;
  const direction = s.direcao === "asc" ? Prisma.sql`asc` : Prisma.sql`desc`;
  const [rows, count] = await Promise.all([
    prismaClient.$queryRaw<
      {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        rfm_segment: string | null;
        orders_count: number;
        total_spent: number;
        first_order_at: Date | null;
        last_order_at: Date | null;
        days_since_last_purchase: number | null;
        acquisition_source: string | null;
        province: string | null;
        city: string | null;
      }[]
    >`
      select c.id, c.name, c.email, c.phone, c.rfm_segment, c.orders_count, c.total_spent::float8 as total_spent,
        c.first_order_at, c.last_order_at, c.days_since_last_purchase, c.acquisition_source, c.province, c.city
      from customer c
      where ${where}
      order by ${sortColumn[s.ordenar]} ${direction} nulls last, c.name
      limit ${pageSize} offset ${(page - 1) * pageSize}
    `,
    prismaClient.$queryRaw<{ total: number }[]>`
      select count(*)::int as total from customer c where ${where}
    `,
  ]);
  const list: RfmCustomerRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    segment: r.rfm_segment ?? "—",
    orders: r.orders_count,
    total: r.total_spent,
    firstOrderAt: r.first_order_at?.toISOString() ?? null,
    lastOrderAt: r.last_order_at?.toISOString() ?? null,
    daysSinceLastPurchase: r.days_since_last_purchase,
    source: r.acquisition_source,
    province: r.province,
    city: r.city,
  }));
  return {
    rows: list,
    total: count[0]?.total ?? 0,
    page,
    pageSize,
    sort: { field: s.ordenar, direction: s.direcao },
  };
}

/** Customers and revenue per segment, after the filters. */
export async function rfmSegments(
  clientId: string,
  s: CustomersSearch,
): Promise<RfmSegmentShare[]> {
  const rows = await prismaClient.$queryRaw<
    { segment: string; customers: number; revenue: number }[]
  >`
    select coalesce(c.rfm_segment, '—') as segment, count(*)::int as customers, sum(c.total_spent)::float8 as revenue
    from customer c
    where ${rfmWhere(clientId, s)}
    group by 1
    order by 2 desc
  `;
  const totalCustomers = rows.reduce((t, r) => t + r.customers, 0);
  return rows.map((r) => ({
    key: r.segment,
    label: r.segment,
    value: r.customers,
    share: totalCustomers > 0 ? (r.customers / totalCustomers) * 100 : 0,
    customers: r.customers,
    revenue: r.revenue,
  }));
}

export async function rfmFilterOptions(clientId: string): Promise<RfmFilterOptions> {
  const distinctCustomers = (column: Prisma.Sql) =>
    prismaClient.$queryRaw<{ value: string }[]>`
      select distinct ${column} as value from customer c
      where c.client_id = ${clientId} and c.orders_count > 0 and ${column} is not null
      order by 1
    `;
  const distinctOrders = (column: Prisma.Sql) =>
    prismaClient.$queryRaw<{ value: string }[]>`
      select distinct ${column} as value from sales_order o
      where o.client_id = ${clientId} and o.financial_status = 'PAID' and ${column} is not null
      order by 1
    `;
  const [origem, uf, cidade, gateway, metodo, cupom, products, ranges] = await Promise.all([
    distinctCustomers(Prisma.sql`c.acquisition_source`),
    distinctCustomers(Prisma.sql`c.province`),
    distinctCustomers(Prisma.sql`c.city`),
    distinctOrders(Prisma.sql`o.payment_gateway`),
    distinctOrders(Prisma.sql`o.processing_method::text`),
    prismaClient.$queryRaw<{ value: string }[]>`
      select distinct unnest(o.discount_codes) as value from sales_order o
      where o.client_id = ${clientId} and o.financial_status = 'PAID' order by 1
    `,
    prismaClient.product.findMany({
      where: { clientId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prismaClient.$queryRaw<
      { total_min: number; total_max: number; orders_min: number; orders_max: number }[]
    >`
      select coalesce(min(c.total_spent), 0)::float8 as total_min, coalesce(max(c.total_spent), 0)::float8 as total_max,
        coalesce(min(c.orders_count), 0)::int as orders_min, coalesce(max(c.orders_count), 0)::int as orders_max
      from customer c where c.client_id = ${clientId} and c.orders_count > 0
    `,
  ]);
  const plain = (rows: { value: string }[]) =>
    rows.map((r) => ({ value: r.value, label: r.value }));
  const methodLabel: Record<string, string> = {
    CREDIT_CARD: "Cartão de crédito",
    PIX: "Pix",
    BOLETO: "Boleto",
  };
  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));
  const r = ranges[0];
  return {
    segmento: rfmSegmentLabels.map((l) => ({ value: l, label: l })),
    origem: plain(origem),
    uf: plain(uf),
    cidade: plain(cidade),
    gateway: plain(gateway),
    metodo: metodo.map((m) => ({ value: m.value, label: methodLabel[m.value] ?? m.value })),
    cupom: plain(cupom),
    comprou: productOptions,
    naoComprou: productOptions,
    ranges: {
      totalMin: Math.floor(r?.total_min ?? 0),
      totalMax: Math.ceil(r?.total_max ?? 0),
      ordersMin: r?.orders_min ?? 0,
      ordersMax: r?.orders_max ?? 0,
    },
  };
}

/**
 * Recomputes every customer's aggregates and RFM scores from the paid orders.
 * Runs in chunks so a 30k-customer base updates in seconds.
 */
export async function refreshCustomerAggregates(clientId: string): Promise<number> {
  const today = new Date(`${PROTOTYPE_TODAY}T00:00:00.000Z`);
  const rows = await prismaClient.$queryRaw<
    { id: string; first_at: Date | null; last_at: Date | null; orders: number; total: number }[]
  >`
    select c.id,
      min(o.placed_at) filter (where o.financial_status = 'PAID') as first_at,
      max(o.placed_at) filter (where o.financial_status = 'PAID') as last_at,
      count(o.id) filter (where o.financial_status = 'PAID')::int as orders,
      coalesce(sum(o.total_price) filter (where o.financial_status = 'PAID'), 0)::float8 as total
    from customer c
    left join sales_order o on o.customer_id = c.id
    where c.client_id = ${clientId}
    group by c.id
  `;
  const buyers = rows.filter((r) => r.orders > 0 && r.last_at);
  const daysSince = (d: Date) =>
    Math.max(0, Math.floor((today.getTime() - d.getTime()) / 86_400_000));
  const recency = quintileScorer(
    buyers.map((r) => daysSince(r.last_at!)),
    false,
  );
  const monetary = quintileScorer(
    buyers.map((r) => r.total),
    true,
  );

  const updates = rows.map((r) => {
    const buyer = r.orders > 0 && r.last_at;
    const days = buyer ? daysSince(r.last_at!) : null;
    const scores = buyer
      ? { r: recency(days!), f: frequencyScore(r.orders), m: monetary(r.total) }
      : null;
    return {
      id: r.id,
      firstAt: r.first_at,
      lastAt: r.last_at,
      orders: r.orders,
      total: r.total,
      days,
      scores,
      segment: scores ? segmentFor(scores) : null,
    };
  });

  for (let i = 0; i < updates.length; i += 500) {
    const chunk = updates.slice(i, i + 500);
    await prismaClient.$executeRaw`
      update customer c set
        first_order_at = v.first_at, last_order_at = v.last_at, orders_count = v.orders,
        total_spent = v.total, days_since_last_purchase = v.days,
        r_score = v.r, f_score = v.f, m_score = v.m, rfm_segment = v.segment
      from (values ${Prisma.join(
        chunk.map(
          (u) =>
            Prisma.sql`(${u.id}, ${u.firstAt}::timestamp, ${u.lastAt}::timestamp, ${u.orders}::int, ${u.total}::numeric, ${u.days}::int, ${u.scores?.r ?? null}::int, ${u.scores?.f ?? null}::int, ${u.scores?.m ?? null}::int, ${u.segment}::text)`,
        ),
      )}) as v(id, first_at, last_at, orders, total, days, r, f, m, segment)
      where c.id = v.id
    `;
  }
  return buyers.length;
}
