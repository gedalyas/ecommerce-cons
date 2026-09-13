import { todayIso } from "@ecommerce/contracts/shared/clock";

export function currentDay(): string {
  return process.env["DEMO_TODAY"] || todayIso();
}
