import { Link } from "@tanstack/react-router";
import { Card } from "@/shared/ui/Card";
import { ProgressBar } from "@/shared/ui/ProgressBar";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { formatPercent, formatPeriodLabel } from "@ecommerce/contracts/shared/format";
import { formatMetric } from "@ecommerce/contracts/shared/metricFormat";
import {
  goalGroupLabel,
  type GoalCard,
  type GoalGroup,
  type GoalsSummary,
} from "@ecommerce/contracts/goals";

const groups: GoalGroup[] = ["vendas", "marketing", "trafego", "recompra"];

const signed = (card: GoalCard) => {
  if (card.difference == null) return "—";
  const text = formatMetric(Math.abs(card.difference), card.unit);
  return card.difference < 0 ? `−${text}` : `+${text}`;
};

function GoalTile({ card }: { card: GoalCard }) {
  const good = card.difference == null ? null : card.difference >= 0 === (card.goodWhen === "up");
  const behind = card.progress != null && card.pacing != null && card.progress < card.pacing;
  const onTrack = card.goal == null ? null : card.goodWhen === "up" ? !behind : (good ?? true);
  return (
    <Card className={layout.cardPadding}>
      <p className={cn(textClass.label, "text-muted-foreground")}>{card.label}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div>
          <p className={cn(textClass.meta, "text-muted-foreground")}>Realizado</p>
          <p className={cn(textClass.cardTitle, textClass.numeric)}>
            {formatMetric(card.actual, card.unit)}
          </p>
        </div>
        <div>
          <p className={cn(textClass.meta, "text-muted-foreground")}>Meta</p>
          <p className={cn(textClass.cardTitle, textClass.numeric)}>
            {formatMetric(card.goal, card.unit)}
          </p>
        </div>
        <div>
          <p className={cn(textClass.meta, "text-muted-foreground")}>Diferença</p>
          <p
            className={cn(
              textClass.cardTitle,
              textClass.numeric,
              good == null ? "" : good ? "text-primary" : "text-warning",
            )}
          >
            {signed(card)}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <div className={cn(textClass.meta, "flex justify-between text-muted-foreground")}>
          <span>Caminho para a meta</span>
          <span className={textClass.numeric}>
            {card.progress == null ? "—" : formatPercent(card.progress, 0)}
          </span>
        </div>
        <ProgressBar
          className="mt-2"
          label={`${card.label}: caminho para a meta`}
          value={card.progress}
          marker={card.pacing}
          tone={onTrack === false ? "warning" : "accent"}
        />
      </div>
    </Card>
  );
}

export function GoalsSummary({ data }: { data: GoalsSummary }) {
  return (
    <>
      {data.empty && (
        <SectionBlock tone="warning" bodyClassName={layout.cardPadding}>
          <p className={textClass.body}>
            Nenhuma meta cadastrada para {formatPeriodLabel(data.window.inicio, data.window.fim)}.{" "}
            <Link
              to="/metas"
              search={(prev) => ({ ...prev, aba: "planejamento" })}
              className="font-semibold text-primary underline underline-offset-2"
            >
              Planejar o ano
            </Link>
          </p>
        </SectionBlock>
      )}
      {groups.map((group) => (
        <SectionBlock
          key={group}
          title={goalGroupLabel[group]}
          meta={
            group === "vendas" ? (
              <span className={cn(textClass.meta, "text-muted-foreground")}>
                {formatPercent(data.elapsed, 0)} do período decorrido · marcador = onde a loja
                deveria estar
              </span>
            ) : undefined
          }
          bodyClassName={layout.cardPadding}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.cards
              .filter((c) => c.group === group)
              .map((card) => (
                <GoalTile key={card.key} card={card} />
              ))}
          </div>
        </SectionBlock>
      ))}
    </>
  );
}
