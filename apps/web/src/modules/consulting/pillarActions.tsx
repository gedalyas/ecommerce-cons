import type { ConsultingSection } from "@ecommerce/contracts/consulting";
import type { Pillar } from "@/shared/ui/pillarCard.types";
import { PillarEditor } from "./PillarEditor";

export function pillarActionOf(section: ConsultingSection) {
  return (pillar: Pillar) => {
    if (!section.canEdit) return null;
    const source = section.pillars.find((p) => p.key === pillar.key);
    return source ? <PillarEditor pillar={source} /> : null;
  };
}
