import { PageHeader } from "../PageHeader";
import { PillarCard } from "../PillarCard";
import { layout } from "../../tokens/spacing";
import { cn } from "@/lib/utils";
import type { SectionPageProps } from "./types";

/** Section screen template - same container and rhythm as the Dashboard. */
export function SectionPage({ section, banner, renderExtra }: SectionPageProps) {
  return (
    <div className={layout.page}>
      <PageHeader title={section.title} subtitle={section.subtitle} />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        {banner}
        <div className={layout.groupStack}>
          {section.pillars.map((pillar) => (
            <PillarCard
              key={pillar.title}
              pillar={pillar}
              {...(renderExtra?.(pillar) ? { extraSlot: renderExtra(pillar) } : {})}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
