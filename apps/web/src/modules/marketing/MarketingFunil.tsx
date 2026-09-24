import { useState } from "react";
import {
  adPlatformLabel,
  funnelStageLabel,
  funnelStages,
  untaggedSummary,
  type CampaignTagRow,
  type MarketingInvestmentFunnel,
} from "@ecommerce/contracts/marketing";
import { formatCurrency, formatPercent } from "@ecommerce/contracts/shared/format";
import { AlertBanner } from "@/shared/ui/AlertBanner";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { CampaignTagSelect } from "./CampaignTagSelect";

const stageOptions = [
  { key: "none", label: "Sem etapa" },
  ...funnelStages.map((key) => ({ key, label: funnelStageLabel[key] })),
];

function tagColumns(
  data: MarketingInvestmentFunnel,
  onError: (message: string | null) => void,
): DataTableColumn<CampaignTagRow>[] {
  const channelLabel = (key: string) => data.channels.find((c) => c.key === key)?.label ?? key;
  return [
    {
      key: "campaignName",
      header: "Campanha",
      render: (r) => r.campaignName,
      sortValue: (r) => r.campaignName,
      className: "min-w-48 font-semibold",
      mobile: "title",
    },
    {
      key: "platform",
      header: "Plataforma",
      render: (r) => adPlatformLabel[r.platform],
      sortValue: (r) => r.platform,
      className: "whitespace-nowrap",
    },
    {
      key: "spend",
      header: "Investimento",
      align: "right",
      render: (r) => formatCurrency(r.spend),
      sortValue: (r) => r.spend,
    },
    {
      key: "stage",
      header: "Etapa do funil",
      render: (r) =>
        data.canEdit ? (
          <CampaignTagSelect
            row={r}
            field="stage"
            options={stageOptions}
            label="Etapa"
            onError={onError}
          />
        ) : r.stage ? (
          funnelStageLabel[r.stage]
        ) : (
          "Sem etapa"
        ),
      csv: (r) => (r.stage ? funnelStageLabel[r.stage] : "Sem etapa"),
      sortValue: (r) => r.stage,
    },
    {
      key: "channel",
      header: "Canal de venda",
      render: (r) =>
        data.canEdit ? (
          <CampaignTagSelect
            row={r}
            field="channel"
            options={data.channels}
            label="Canal"
            onError={onError}
          />
        ) : (
          channelLabel(r.channel)
        ),
      csv: (r) => channelLabel(r.channel),
      sortValue: (r) => r.channel,
    },
  ];
}

export function MarketingFunil({ data }: { data: MarketingInvestmentFunnel }) {
  const [error, setError] = useState<string | null>(null);
  const untagged = untaggedSummary(data.tags);
  return (
    <div className={layout.blockStack}>
      {untagged.count > 0 && (
        <AlertBanner>
          {untagged.count === 1 ? "1 campanha está" : `${untagged.count} campanhas estão`} sem etapa
          do funil
          {untagged.spendShare == null
            ? ""
            : ` (${formatPercent(untagged.spendShare)} do investimento do período)`}
          {data.canEdit ? ". Marque abaixo." : "; a consultoria faz essa marcação."}
        </AlertBanner>
      )}
      <SectionBlock
        title="Etapa e canal de cada campanha"
        description="A consultoria marca a etapa do funil (topo, meio ou fundo) e o canal de venda que cada campanha alimenta. O investimento das campanhas entra nessa etapa e nesse canal."
      >
        {error && <p className={cn(textClass.meta, "px-4 pt-4 text-destructive")}>{error}</p>}
        <DataTable
          columns={tagColumns(data, setError)}
          rows={data.tags}
          rowKey={(r) => `${r.platform}|${r.campaignId}`}
          initialSort={{ key: "spend", direction: "desc" }}
          initialPageSize={25}
          emptyMessage="Sem campanhas com investimento no período."
        />
      </SectionBlock>
    </div>
  );
}
