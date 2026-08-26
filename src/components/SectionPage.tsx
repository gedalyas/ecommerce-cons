import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PillarCard } from "@/components/PillarCard";
import { sections } from "@/lib/mock-data";

export function SectionPage({ slug }: { slug: keyof typeof sections }) {
  const section = sections[slug]!;

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-4 pb-12 sm:px-6 xl:px-8">
      <PageHeader title={section.title} subtitle={section.subtitle} />

      <div className="mt-6 space-y-8">
        {slug === "marketing" && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border border-l-[3px] border-l-warning bg-card px-5 py-4 text-[15px] shadow-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
            <span className="min-w-0 flex-1">
              Meta Ads não sincroniza há 6 dias — os dados de aquisição podem estar desatualizados.
            </span>
            <Link
              to="/conexoes"
              className="text-[13px] font-semibold text-primary underline underline-offset-2"
            >
              Ir para Conexões
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {section.pillars.map((pillar) => (
            <PillarCard key={pillar.title} pillar={pillar} />
          ))}
        </div>
      </div>
    </div>
  );
}
