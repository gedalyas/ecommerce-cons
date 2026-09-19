import type { StoreScreen } from "@ecommerce/contracts/auth";

export const screenRoutePrefixes: Record<StoreScreen, readonly string[]> = {
  ASSISTANT: [],
  MONEY: ["/money"],
  MARKETING: ["/marketing"],
  LOGISTICS: ["/logistics"],
  MANAGEMENT: ["/management"],
  ORDERS: ["/orders"],
  PRODUCTS: ["/products"],
  CUSTOMERS: ["/customers"],
  GOALS: ["/goals"],
  METRICS: ["/analysis"],
  INFLUENCERS: ["/influencers"],
};
