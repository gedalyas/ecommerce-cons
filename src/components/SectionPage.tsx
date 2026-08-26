import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { PillarCard } from "@/components/PillarCard";
import { sections } from "@/lib/mock-data";

export function SectionPage({ slug }: { slug: keyof typeof sections }) {
  const section = sections[slug]!;

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-8 py-7">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{section.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{section.subtitle}</p>
      </header>

      {slug === "marketing" && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <span>
            Meta Ads não sincroniza há 6 dias — os dados de aquisição podem estar desatualizados.
          </span>
          <Link
            to="/conexoes"
            className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-2"
          >
            Ir para Conexões <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {section.pillars.map((pillar) => (
          <PillarCard key={pillar.title} pillar={pillar} />
        ))}
      </div>
    </div>
  );
}
