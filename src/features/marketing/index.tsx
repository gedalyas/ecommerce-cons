import { Link } from "@tanstack/react-router";
import { AlertBanner } from "@/design-system/patterns/AlertBanner";
import { SectionPage } from "@/design-system/patterns/SectionPage";
import type { Pillar } from "@/design-system/patterns/PillarCard";
import { PresencaCriativos } from "./components/PresencaCriativos";
import { marketingSection } from "./data/marketing";

export function MarketingPage() {
  return (
    <SectionPage
      section={marketingSection}
      banner={
        <AlertBanner
          action={
            <Link
              to="/conexoes"
              className="text-[13px] font-semibold text-primary underline underline-offset-2"
            >
              Ir para Conexões
            </Link>
          }
        >
          Meta Ads não sincroniza há 6 dias — os dados de aquisição podem estar desatualizados.
        </AlertBanner>
      }
      renderExtra={(pillar: Pillar) =>
        pillar.extra === "presenca-criativos" ? <PresencaCriativos /> : null
      }
    />
  );
}
