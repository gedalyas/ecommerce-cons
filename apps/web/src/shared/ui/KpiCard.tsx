import { Card } from "./Card";
import { MetricTile } from "./MetricTile";
import { metricToTile } from "./metricToTile";
import type { KpiCardProps } from "./kpiCard.types";

export type { KpiCardProps } from "./kpiCard.types";

export function KpiCard(props: KpiCardProps) {
  return (
    <Card {...(props.className ? { className: props.className } : {})}>
      <MetricTile metric={metricToTile(props)} />
    </Card>
  );
}
