/**
 * Clientes screen orchestrator: one payload per tab, plus what Marketing's
 * Retenção pillar reads. Server-only.
 */
import { prismaClient } from "@/shared/dependencies/prismaClient";
import { PROTOTYPE_TODAY } from "@/shared/config/prototype";
import type { PeriodSearch } from "@/shared/utils/period";
import { toWindow } from "@/shared/utils/periodWindow";
import type { CustomersScreen, RetentionSummary, RfmCustomerRow } from "./customers.types";
import type { CustomersSearch } from "./customersSchema";
import { customersLtvCac, customersRepurchase } from "./repurchaseService";
import { refreshCustomerAggregates, rfmFilterOptions, rfmPage, rfmSegments } from "./rfmService";

async function clientIdFor(slug: string) {
  const client = await prismaClient.client.findUnique({ where: { slug }, select: { id: true } });
  if (!client) throw new Error(`Unknown client "${slug}"`);
  return client.id;
}

export async function customersScreen(
  clientSlug: string,
  search: PeriodSearch & CustomersSearch,
): Promise<CustomersScreen> {
  const clientId = await clientIdFor(clientSlug);
  switch (search.aba) {
    case "rfm": {
      const [segments, page, options, buyers] = await Promise.all([
        rfmSegments(clientId, search),
        rfmPage(clientId, search),
        rfmFilterOptions(clientId),
        prismaClient.customer.count({ where: { clientId, ordersCount: { gt: 0 } } }),
      ]);
      return { aba: "rfm", rfm: { segments, page, options, buyers } };
    }
    case "recompra":
      return { aba: "recompra", repurchase: await customersRepurchase(clientId, search) };
    case "ltv-cac":
      return { aba: "ltv-cac", ltvCac: await customersLtvCac(clientId, search) };
  }
}

export async function customersExport(
  clientSlug: string,
  search: PeriodSearch & CustomersSearch,
): Promise<RfmCustomerRow[]> {
  const clientId = await clientIdFor(clientSlug);
  return (await rfmPage(clientId, search, { forExport: true })).rows;
}

export async function refreshCustomers(clientSlug: string): Promise<number> {
  return refreshCustomerAggregates(await clientIdFor(clientSlug));
}

/** Recompra 90 dias and LTV 12 meses - the Marketing › Retenção pillar reads them through the route. */
export async function retentionSummary(clientSlug: string): Promise<RetentionSummary> {
  const clientId = await clientIdFor(clientSlug);
  const today = new Date(`${PROTOTYPE_TODAY}T00:00:00.000Z`);
  const days = (n: number) => new Date(today.getTime() - n * 86_400_000).toISOString().slice(0, 10);
  const last90 = toWindow({ inicio: days(89), fim: PROTOTYPE_TODAY });
  const last365 = toWindow({ inicio: days(364), fim: PROTOTYPE_TODAY });
  const [repeat, ltv] = await Promise.all([
    prismaClient.$queryRaw<{ orders: number; repeat_orders: number }[]>`
      with ranked as (
        select o.placed_at, row_number() over (partition by o.customer_id order by o.placed_at) as n
        from sales_order o where o.client_id = ${clientId} and o.financial_status = 'PAID'
      )
      select count(*)::int as orders, count(*) filter (where n >= 2)::int as repeat_orders
      from ranked where placed_at >= ${last90.start} and placed_at < ${last90.end}
    `,
    prismaClient.$queryRaw<{ ltv: number | null }[]>`
      select avg(spent)::float8 as ltv from (
        select sum(o.total_price) as spent from sales_order o
        join customer c on c.id = o.customer_id
        where o.client_id = ${clientId} and o.financial_status = 'PAID'
          and c.first_order_at >= ${last365.start} and c.first_order_at < ${last365.end}
        group by o.customer_id
      ) cohort
    `,
  ]);
  const r = repeat[0];
  return {
    repurchaseRate90: r && r.orders > 0 ? (r.repeat_orders / r.orders) * 100 : null,
    ltv12Months: ltv[0]?.ltv ?? null,
  };
}
