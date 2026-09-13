import { PageHeader } from "./PageHeader";
import { PillarCard } from "./PillarCard";
import { layout } from "@/shared/styles/spacing";
import { cn } from "@/shared/utils/cn";
import type { SectionPageProps } from "./sectionPage.types";

export type { Section, SectionPageProps } from "./sectionPage.types";

/** Section screen template - same container and rhythm as the Dashboard. */
export function SectionPage({ section, banner, renderExtra, renderAction }: SectionPageProps) {
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
              {...(renderAction?.(pillar) ? { actionSlot: renderAction(pillar) } : {})}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
