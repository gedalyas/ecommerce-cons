import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, CircleDashed, FileSpreadsheet, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  conectado: { label: "Conectado", icon: CheckCircle2, className: "text-success" },
  erro: { label: "Erro de autenticação", icon: AlertTriangle, className: "text-warning" },
  "nao-conectado": { label: "Não conectado", icon: CircleDashed, className: "text-muted-foreground" },
  manual: { label: "Importação manual", icon: FileSpreadsheet, className: "text-muted-foreground" },
} as const;

function Conexoes() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-8 py-7">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Conexões</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fontes que alimentam os indicadores do painel
        </p>
      </header>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <span className="h-2 w-2 rounded-full bg-warning" />
        <span className="num font-medium text-foreground">5 de 7 fontes ativas</span>
        <span className="text-muted-foreground">· 1 com erro, 1 não conectada</span>
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <ul className="divide-y divide-border">
          {connections.map((c) => {
            const meta = statusMeta[c.status];
            const Icon = meta.icon;
            return (
              <li key={c.name} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-48 flex-1">
                  <div className="text-sm font-medium text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.type}</div>
                </div>
                <div className={cn("flex w-48 items-center gap-1.5 text-xs font-medium", meta.className)}>
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </div>
                <div className="num w-40 text-xs text-muted-foreground">{c.sync}</div>
                <Button
                  variant={c.status === "erro" ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                >
                  {c.status === "nao-conectado" ? "Conectar" : "Reconectar"}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <header className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">Importação manual</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Extratos e planilhas que ainda não têm integração automática.
          </p>
        </header>
        <div className="p-5">
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-background px-6 py-10 text-center">
            <UploadCloud className="h-7 w-7 text-muted-foreground" />
            <div className="mt-3 text-sm font-medium text-foreground">
              Arraste a planilha aqui ou selecione um arquivo
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Formatos aceitos: .xlsx, .csv · até 10 MB
            </p>
            <Button variant="outline" size="sm" className="mt-4 h-8 text-xs">
              Selecionar arquivo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
