import type { ReactNode } from "react";
import type { CardTone } from "../../primitives/Card";

export type SectionBlockProps = {
  title?: string;
  /** Text right-aligned with the title. */
  meta?: ReactNode;
  description?: ReactNode;
  tone?: CardTone;
  /** Classe de padding do corpo — usar apenas tokens de layout. */
  bodyClassName?: string;
  className?: string;
  children: ReactNode;
};
