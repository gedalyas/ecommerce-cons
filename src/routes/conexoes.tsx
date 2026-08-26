import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, CircleDashed, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { connections } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/conexoes")({
  head: () => ({
    meta: [
      { title: "Conexões · Loja Aurora | Fontes de dados integradas" },
      {
        name: "description",
        content:
          "Status das fontes de dados da Loja Aurora: ERP, plataforma, mídia paga, analytics e importação manual de planilhas.",
      },
      { property: "og:title", content: "Conexões · Loja Aurora" },
      {
        property: "og:description",
        content: "5 de 7 fontes ativas: veja sincronizações, erros de autenticação e importação manual.",
      },
    ],
  }),
  component: Conexoes,
});

const statusMeta = {
  conectado: { label: "Conectado", icon: CheckCircle2, className: "text-primary" },
  erro: { label: "Erro de autenticação", icon: AlertTriangle, className: "text-warning" },
  "nao-conectado": { label: "Não conectado", icon: CircleDashed, className: "text-muted-foreground" },
  manual: { label: "Importação manual", icon: FileSpreadsheet, className: "text-muted-foreground" },
} as const;

function Conexoes() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-4 pb-12 sm:px-6 xl:px-8">
      <PageHeader title="Conexões" subtitle="Fontes que alimentam os indicadores do painel" />

      <div className="mt-6 space-y-8">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border border-l-[3px] border-l-warning bg-card px-5 py-4 text-[15px] shadow-sm">
          <span className="num font-semibold text-foreground">5 de 7 fontes ativas</span>
          <span className="text-muted-foreground">· 1 com erro, 1 não conectada</span>
        </div>

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="hidden border-b border-border px-5 py-3 md:flex md:items-center md:gap-4">
            <span className="t-label min-w-0 flex-1 text-muted-foreground">Fonte</span>
            <span className="t-label w-48 text-muted-foreground">Status</span>
            <span className="t-label w-40 text-muted-foreground">Sincronização</span>
            <span className="t-label w-28 text-muted-foreground">Ação</span>
          </div>
          <ul className="divide-y divide-border">
            {connections.map((c) => {
              const meta = statusMeta[c.status];
              const Icon = meta.icon;
              return (
                <li
                  key={c.name}
                  className="flex flex-col gap-3 px-5 py-4 md:flex-row md:flex-wrap md:items-center md:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-foreground">{c.name}</div>
                    <div className="t-meta text-muted-foreground">{c.type}</div>
                  </div>
                  <div
                    className={cn(
                      "t-meta flex min-w-0 items-center gap-2 font-semibold md:w-48",
                      meta.className,
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {meta.label}
                  </div>
                  <div className="num t-meta w-full text-muted-foreground md:w-40">{c.sync}</div>
                  <Button
                    variant={c.status === "erro" ? "default" : "outline"}
                    size="sm"
                    className="h-11 w-full md:h-8 md:w-28"
                  >
                    {c.status === "nao-conectado" ? "Conectar" : "Reconectar"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-card shadow-sm">
          <header className="border-b border-border px-5 py-4">
            <h2 className="t-card-title text-foreground">Importação manual</h2>
            <p className="t-meta mt-1 text-muted-foreground">
              Extratos e planilhas que ainda não têm integração automática.
            </p>
          </header>
          <div className="p-5">
            <div className="rounded-lg border border-dashed border-border bg-background p-5">
              <div className="text-[15px] font-semibold text-foreground">
                Arraste a planilha aqui ou selecione um arquivo
              </div>
              <p className="t-meta mt-1 text-muted-foreground">
                Formatos aceitos: .xlsx, .csv · até 10 MB
              </p>
              <Button variant="outline" size="sm" className="mt-4 h-11 md:h-8">
                Selecionar arquivo
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
