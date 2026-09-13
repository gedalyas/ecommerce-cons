/** Paid-order totals over a window (or one bucket of it), already split by sales platform. */
export type OrdersAggregate = {
  /** Paid revenue (total_price of PAID orders). */
  revenue: number;
  /** Paid orders. */
  orders: number;
  /** Revenue of every order regardless of payment state. */
  captured: number;
  capturedOrders: number;
  /** Cost of goods sold for the paid orders (qty × unit cost). */
  cogs: number;
  /** Paid orders that are the customer's second or later order. */
  repeatOrders: number;
  ecommerce: { orders: number; revenue: number };
  marketplace: { orders: number; revenue: number };
};

export type OrdersBucket = OrdersAggregate & { bucket: string };
