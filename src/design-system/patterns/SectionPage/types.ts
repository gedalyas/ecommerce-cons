import type { ReactNode } from "react";
import type { Pillar } from "../PillarCard/types";

export type Section = { title: string; subtitle: string; pillars: Pillar[] };

export type SectionPageProps = {
  section: Section;
  /** Faixa de aviso exibida acima dos pilares. */
  banner?: ReactNode;
  /** A pillar's extra content, resolved by the feature. */
  renderExtra?: (pillar: Pillar) => ReactNode;
};
