import {
  adPlatformLabel,
  stageKeyLabel,
  type StageCreative,
  type StageCreatives,
} from "@ecommerce/contracts/marketing";
import { formatCurrency, formatPercent } from "@ecommerce/contracts/shared/format";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { CreativeThumbnail } from "./DepthNameCell";

function CreativeItem({ ad }: { ad: StageCreative }) {
  const cost =
    ad.costPerConversion == null
      ? "sem conversão"
      : `${formatCurrency(ad.costPerConversion, 2)} por conversão`;
  return (
    <li className="flex items-start gap-3 py-3">
      <CreativeThumbnail url={ad.thumbnailUrl} />
      <div className="min-w-0 flex-1">
        <p className={cn(textClass.body, "truncate font-semibold")}>{ad.adName}</p>
        <p className={cn(textClass.meta, "truncate text-muted-foreground")}>
          {adPlatformLabel[ad.platform]} · {ad.campaignName} · {ad.adsetName}
        </p>
        <p className={cn(textClass.meta, textClass.numeric, "text-muted-foreground")}>
          {formatCurrency(ad.spend)} · CTR {ad.ctr == null ? "—" : formatPercent(ad.ctr)} · {cost}
        </p>
      </div>
    </li>
  );
}

export function CreativesByStage({ stages }: { stages: StageCreatives[] }) {
  const withAds = stages.filter((s) => s.ads.length > 0);
  return (
    <SectionBlock
      title="Criativos por etapa"
      description="Os anúncios com mais investimento em cada etapa do funil no período. A miniatura aparece quando a plataforma a envia."
      bodyClassName={layout.cardPadding}
    >
      {withAds.length === 0 ? (
        <p className={cn(textClass.body, "text-muted-foreground")}>Sem anúncios no período.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {withAds.map((s) => (
            <div key={s.stage} className="min-w-0">
              <p className={cn(textClass.label, "text-muted-foreground")}>
                {stageKeyLabel[s.stage]}
              </p>
              <ul className="divide-y divide-border">
                {s.ads.map((ad) => (
                  <CreativeItem key={`${ad.platform}|${ad.adId}`} ad={ad} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </SectionBlock>
  );
}
