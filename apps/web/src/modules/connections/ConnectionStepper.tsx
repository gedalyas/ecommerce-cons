import { CheckCircle2, CircleDashed, Loader2 } from "lucide-react";
import {
  connectionStageHint,
  connectionStageLabel,
  needsAccountHint,
  type ConnectionSummary,
} from "@ecommerce/contracts/connectors";
import { formatDate } from "@ecommerce/contracts/shared/format";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { stepIndexOf, stepperStages as steps } from "./connectionSteps";

export function ConnectionStepper({ connection }: { connection: ConnectionSummary }) {
  const current = stepIndexOf(connection.stage);
  const failed = connection.stage === "ERROR";
  return (
    <div className="w-full">
      <ol className="grid gap-2 sm:grid-cols-4">
        {steps.map((step, index) => {
          const done = index < current || (index === current && step === "READY");
          const active = index === current && !done;
          const Icon = done ? CheckCircle2 : active && !failed ? Loader2 : CircleDashed;
          return (
            <li key={step} className="flex items-start gap-2">
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  done ? "text-primary" : active ? "text-foreground" : "text-muted-foreground",
                  active && !failed && "animate-spin",
                )}
              />
              <div className="min-w-0">
                <div
                  className={cn(
                    textClass.meta,
                    "font-semibold",
                    done || active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {connectionStageLabel[step]}
                </div>
                <div className={cn(textClass.meta, "text-muted-foreground")}>
                  {step === "AUTHORIZED" && connection.needsAccount
                    ? needsAccountHint
                    : connectionStageHint[step]}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <p
        className={cn(
          textClass.meta,
          "mt-2",
          failed ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {failed
          ? `${connectionStageLabel.ERROR}: ${connection.lastError ?? connectionStageHint.ERROR}`
          : connection.lastSyncAt
            ? `Última sincronização ${formatDate(connection.lastSyncAt, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · ${connection.externalLabel}`
            : connection.externalLabel}
      </p>
    </div>
  );
}
