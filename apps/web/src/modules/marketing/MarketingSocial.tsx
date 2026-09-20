import { Badge } from "@/shared/ui/Badge";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { metricToTile } from "@/shared/ui/metricToTile";
import { MetricTileGroup } from "@/shared/ui/MetricTileGroup";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { TimeSeriesChart } from "@/shared/ui/TimeSeriesChart";
import { layout } from "@/shared/styles/spacing";
import { formatDate, formatNumber, formatPercent } from "@ecommerce/contracts/shared/format";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import type {
  MarketingSocial as MarketingSocialData,
  SocialAccountRow,
  SocialPostRow,
} from "@ecommerce/contracts/marketing";
import { socialPlatformLabel } from "@ecommerce/contracts/marketing";

const pct = (v: number | null) => (v == null ? "—" : formatPercent(v * 100));

const tiles = (data: MarketingSocialData, comparisonLabel: string) =>
  [
    { label: "Seguidores", metric: data.followers },
    { label: "Alcance", metric: data.reach },
    { label: "Engajamento", metric: data.engagement },
    { label: "Taxa de engajamento", metric: data.engagementRate },
    { label: "Publicações", metric: data.posts },
  ].map((tile) => metricToTile({ ...tile, comparisonLabel }));

const accountColumns: DataTableColumn<SocialAccountRow>[] = [
  {
    key: "platform",
    header: "Rede",
    render: (r) => socialPlatformLabel[r.platform],
    className: "font-semibold",
  },
  {
    key: "followers",
    header: "Seguidores",
    align: "right",
    render: (r) => formatNumber(r.followers),
    csv: (r) => r.followers,
  },
  {
    key: "reach",
    header: "Alcance",
    mobile: "lead",
    align: "right",
    render: (r) => formatNumber(r.reach),
    csv: (r) => r.reach,
  },
  {
    key: "engagement",
    header: "Engajamento",
    align: "right",
    render: (r) => formatNumber(r.engagement),
    csv: (r) => r.engagement,
  },
  {
    key: "engagementRate",
    header: "Taxa",
    align: "right",
    render: (r) => pct(r.engagementRate),
    csv: (r) => r.engagementRate,
  },
  {
    key: "posts",
    header: "Publicações",
    align: "right",
    render: (r) => formatNumber(r.posts),
    csv: (r) => r.posts,
  },
];

const postColumns: DataTableColumn<SocialPostRow>[] = [
  {
    key: "caption",
    header: "Publicação",
    render: (r) => (
      <a
        href={r.permalink}
        target="_blank"
        rel="noreferrer"
        className="line-clamp-2 max-w-md text-primary underline-offset-2 hover:underline"
      >
        {r.caption || "(sem legenda)"}
      </a>
    ),
    csv: (r) => r.caption,
  },
  {
    key: "platform",
    header: "Rede",
    render: (r) => (
      <Badge tone="muted">
        {socialPlatformLabel[r.platform]} · {r.mediaType.toLowerCase()}
      </Badge>
    ),
    csv: (r) => socialPlatformLabel[r.platform],
  },
  {
    key: "publishedAt",
    header: "Data",
    render: (r) => formatDate(r.publishedAt),
    csv: (r) => r.publishedAt.slice(0, 10),
    sortValue: (r) => r.publishedAt,
  },
  {
    key: "reach",
    header: "Alcance",
    mobile: "lead",
    align: "right",
    render: (r) => formatNumber(r.reach),
    csv: (r) => r.reach,
    sortValue: (r) => r.reach,
  },
  {
    key: "likes",
    header: "Curtidas",
    align: "right",
    render: (r) => formatNumber(r.likes),
    csv: (r) => r.likes,
    sortValue: (r) => r.likes,
  },
  {
    key: "comments",
    header: "Comentários",
    align: "right",
    render: (r) => formatNumber(r.comments),
    csv: (r) => r.comments,
    sortValue: (r) => r.comments,
  },
  {
    key: "engagement",
    header: "Engajamento",
    align: "right",
    render: (r) => formatNumber(r.engagement),
    csv: (r) => r.engagement,
    sortValue: (r) => r.engagement,
  },
];

export function MarketingSocial({
  data,
  period,
  comparisonLabel,
}: {
  data: MarketingSocialData;
  period: PeriodSearch;
  comparisonLabel: string;
}) {
  return (
    <>
      <SectionBlock title="Redes sociais" bodyClassName="p-0">
        <MetricTileGroup metrics={tiles(data, comparisonLabel)} bare />
      </SectionBlock>

      <SectionBlock
        title="Alcance no período"
        description="Contas alcançadas por dia, somando Instagram e Facebook."
        bodyClassName={layout.cardPadding}
      >
        <TimeSeriesChart series={data.reachSeries} unit="count" granularity={period.por} />
      </SectionBlock>

      <SectionBlock title="Por rede" bodyClassName="p-0">
        <DataTable
          columns={accountColumns}
          rows={data.accounts}
          rowKey={(r) => `${r.platform}:${r.accountId}`}
          emptyMessage="Conecte o Instagram e o Facebook em Conexões para ver as redes aqui."
          csvFileName="redes-sociais"
        />
      </SectionBlock>

      <SectionBlock
        title="Publicações que mais engajaram"
        description="As 10 publicações do período com mais curtidas, comentários, salvamentos e compartilhamentos."
        bodyClassName="p-0"
      >
        <DataTable
          columns={postColumns}
          rows={data.topPosts}
          rowKey={(r) => `${r.platform}:${r.externalId}`}
          emptyMessage="Nenhuma publicação no período."
          csvFileName="publicacoes"
        />
      </SectionBlock>
    </>
  );
}
