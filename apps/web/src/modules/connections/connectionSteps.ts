import { connectionStages, type ConnectionStage } from "@ecommerce/contracts/connectors";

export const stepperStages = connectionStages.filter((s) => s !== "ERROR");

export function stepIndexOf(stage: ConnectionStage): number {
  return stage === "ERROR" ? 1 : stepperStages.indexOf(stage);
}
