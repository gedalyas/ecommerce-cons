import { AlertTriangle, CheckCircle2, CircleDashed, FileSpreadsheet } from "lucide-react";
import { Button } from "@/design-system/primitives/Button";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { SectionBlock } from "@/design-system/patterns/SectionBlock";
import { AlertBanner } from "@/design-system/patterns/AlertBanner";
import { layout } from "@/design-system/tokens/spacing";
import { radiusClass } from "@/design-system/tokens/radius";
import { textClass } from "@/design-system/tokens/typography";
import { cn } from "@/lib/utils";
import { connections } from "./data/connections";

const statusMeta = {
  conectado: { label: "Conectado", icon: CheckCircle2, className: "text-primary" },
  erro: { label: "Erro de autenticação", icon: AlertTriangle, className: "text-warning" },
  "nao-conectado": { label: "Não conectado", icon: CircleDashed, className: "text-muted-foreground" },
  manual: { label: "Importação manual", icon: FileSpreadsheet, className: "text-muted-foreground" },
} as const;

export function ConexoesPage() {
  return (
    <div className={layout.page}>
      <PageHeader title="Conexões" subtitle="Fontes que alimentam os indicadores do painel" />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        <AlertBanner icon={false}>
          <span className={cn(textClass.numeric, "font-semibold text-foreground")}>
            5 de 7 fontes ativas
          </span>{" "}
          <span className="text-muted-foreground">· 1 com erro, 1 não conectada</span>
        </AlertBanner>

        <SectionBlock>
          <div className="hidden border-b border-border px-5 py-3 md:flex md:items-center md:gap-4">
            <span className={cn(textClass.label, "min-w-0 flex-1 text-muted-foreground")}>Fonte</span>
            <span className={cn(textClass.label, "w-48 text-muted-foreground")}>Status</span>
            <span className={cn(textClass.label, "w-40 text-muted-foreground")}>Sincronização</span>
            <span className={cn(textClass.label, "w-28 text-muted-foreground")}>Ação</span>
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
                    <div className={cn(textClass.meta, "text-muted-foreground")}>{c.type}</div>
                  </div>
                  <div
                    className={cn(
                      textClass.meta,
                      "flex min-w-0 items-center gap-2 font-semibold md:w-48",
                      meta.className,
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {meta.label}
                  </div>
                  <div className={cn(textClass.numeric, textClass.meta, "w-full text-muted-foreground md:w-40")}>
                    {c.sync}
                  </div>
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
        </SectionBlock>

        <SectionBlock
          title="Importação manual"
          description="Extratos e planilhas que ainda não têm integração automática."
          bodyClassName={layout.cardPadding}
        >
          <div className={cn("border border-dashed border-border bg-background p-5", radiusClass.card)}>
            <div className="text-[15px] font-semibold text-foreground">
              Arraste a planilha aqui ou selecione um arquivo
            </div>
            <p className={cn(textClass.meta, "mt-1 text-muted-foreground")}>
              Formatos aceitos: .xlsx, .csv · até 10 MB
            </p>
            <Button variant="outline" size="sm" className="mt-4 h-11 md:h-8">
              Selecionar arquivo
            </Button>
          </div>
        </SectionBlock>
      </div>
    </div>
  );
}
