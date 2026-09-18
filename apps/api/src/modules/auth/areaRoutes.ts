import type { AccessArea } from "@ecommerce/contracts/auth";

export const areaRoutePrefixes: Record<AccessArea, readonly string[]> = {
  MONEY: ["/money"],
  MARKETING: ["/marketing", "/influencers"],
  LOGISTICS: ["/logistics"],
  MANAGEMENT: ["/management", "/goals"],
  DATA: ["/orders", "/products", "/customers", "/analysis"],
};

const READ_METHODS = ["GET", "HEAD", "OPTIONS"];

export function levelRequiredBy(method: string): "view" | "edit" {
  return READ_METHODS.includes(method.toUpperCase()) ? "view" : "edit";
}
