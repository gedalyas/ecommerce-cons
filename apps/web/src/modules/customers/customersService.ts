/**
 * Customers orchestrator: the only file of the module that touches Prisma.
 * Server-only.
 */
import { Prisma, prismaClient } from "@ecommerce/database/client";
import type { SalesPlatform } from "@ecommerce/database/enums";
import { isoDay, type Window } from "@/shared/utils/periodWindow";
import type { CustomersAggregate, CustomersBucket } from "./customers.types";

const platformFilter = (platform: SalesPlatform | null) =>
  platform ? Prisma.sql`and o.sales_platform = ${platform}::sales_platform` : Prisma.empty;

/**
 * A "new" customer is one whose first paid order sits in the window; with a
 * platform filter, that first order must be on the platform.
 */
export async function customersAggregate(
  clientId: string,
  w: Window,
  platform: SalesPlatform | null,
): Promise<CustomersAggregate> {
  const [buyers, fresh] = await Promise.all([
    prismaClient.$queryRaw<{ customers: number }[]>`
      select count(distinct o.customer_id)::int as customers
      from sales_order o
      where o.client_id = ${clientId} and o.financial_status = 'PAID'
        and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
        ${platformFilter(platform)}
    `,
    prismaClient.$queryRaw<{ new_customers: number }[]>`
      select count(*)::int as new_customers
      from customer c
      join sales_order o on o.customer_id = c.id and o.placed_at = c.first_order_at
      where c.client_id = ${clientId}
        and c.first_order_at >= ${w.start} and c.first_order_at < ${w.end}
        ${platformFilter(platform)}
    `,
  ]);
  return { customers: buyers[0]?.customers ?? 0, newCustomers: fresh[0]?.new_customers ?? 0 };
}

export async function customersByBucket(
  clientId: string,
  w: Window,
  unit: string,
  platform: SalesPlatform | null,
): Promise<CustomersBucket[]> {
  const [buyers, fresh] = await Promise.all([
    prismaClient.$queryRaw<{ bucket: Date; customers: number }[]>`
      select date_trunc(${unit}, o.placed_at) as bucket, count(distinct o.customer_id)::int as customers
      from sales_order o
      where o.client_id = ${clientId} and o.financial_status = 'PAID'
        and o.placed_at >= ${w.start} and o.placed_at < ${w.end}
        ${platformFilter(platform)}
      group by 1
    `,
    prismaClient.$queryRaw<{ bucket: Date; new_customers: number }[]>`
      select date_trunc(${unit}, c.first_order_at) as bucket, count(*)::int as new_customers
      from customer c
      join sales_order o on o.customer_id = c.id and o.placed_at = c.first_order_at
      where c.client_id = ${clientId}
        and c.first_order_at >= ${w.start} and c.first_order_at < ${w.end}
        ${platformFilter(platform)}
      group by 1
    `,
  ]);
  const byBucket = new Map<string, CustomersBucket>();
  for (const r of buyers) {
    const bucket = isoDay(r.bucket);
    byBucket.set(bucket, { bucket, customers: r.customers, newCustomers: 0 });
  }
  for (const r of fresh) {
    const bucket = isoDay(r.bucket);
    const row = byBucket.get(bucket) ?? { bucket, customers: 0, newCustomers: 0 };
    byBucket.set(bucket, { ...row, newCustomers: r.new_customers });
  }
  return [...byBucket.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
}
