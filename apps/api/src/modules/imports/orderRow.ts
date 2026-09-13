import type { OrderInput } from "./importRows.types";

const NOON_UTC = "T12:00:00.000Z";

const dayOf = (day: string) => new Date(`${day}${NOON_UTC}`);

export function orderRowOf(order: OrderInput, customerId: string, orderNumberForCustomer: number) {
  const placedAt = dayOf(order.placedAt);
  return {
    customerId,
    placedAt,
    paidAt: order.status === "PAID" ? placedAt : null,
    salesPlatform: order.salesPlatform,
    channel: order.channel,
    utmSource: order.utmSource,
    utmMedium: order.utmMedium,
    utmCampaign: order.utmCampaign,
    financialStatus: order.status,
    paymentGateway: order.gateway,
    processingMethod: order.processingMethod,
    productRevenue: order.productRevenue,
    shippingRevenue: order.shipping,
    totalDiscounts: order.discount,
    totalPrice: order.totalPrice,
    discountCodes: order.coupons,
    province: order.province,
    city: order.city,
    orderNumberForCustomer,
    itemsCount: order.items.reduce((s, i) => s + i.quantity, 0),
  };
}
