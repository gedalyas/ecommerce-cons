import { AlertTriangle, CheckCircle2, CircleDashed, FileSpreadsheet } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { AlertBanner } from "@/shared/ui/AlertBanner";
import { layout } from "@/shared/styles/spacing";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import type { DataSourceStatus } from "@/generated/prisma/enums";
import type { ConnectionsScreen } from "./connections.types";
import { summaryDetail } from "./connectionsSummary";

const statusMeta: Record<
  DataSourceStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  CONNECTED: { label: "Conectado", icon: CheckCircle2, className: "text-primary" },
  ERROR: { label: "Erro de autenticação", icon: AlertTriangle, className: "text-warning" },
  NOT_CONNECTED: {
    label: "Não conectado",
    icon: CircleDashed,
    className: "text-muted-foreground",
  },
  MANUAL: { label: "Importação manual", icon: FileSpreadsheet, className: "text-muted-foreground" },
};

export function Connections({ data }: { data: ConnectionsScreen }) {
  const detail = summaryDetail(data.summary);
  return (
    <div className={layout.page}>
      <PageHeader title="Conexões" subtitle="Fontes que alimentam os indicadores do painel" />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        <AlertBanner icon={false}>
          <span className={cn(textClass.numeric, "font-semibold text-foreground")}>
            {data.summary.active} de {data.summary.total} fontes ativas
          </span>
          {detail && <span className="text-muted-foreground"> · {detail}</span>}
        </AlertBanner>

        <SectionBlock>
          <div className="hidden border-b border-border px-5 py-3 md:flex md:items-center md:gap-4">
            <span className={cn(textClass.label, "min-w-0 flex-1 text-muted-foreground")}>
              Fonte
            </span>
            <span className={cn(textClass.label, "w-48 text-muted-foreground")}>Status</span>
            <span className={cn(textClass.label, "w-40 text-muted-foreground")}>Sincronização</span>
            <span className={cn(textClass.label, "w-28 text-muted-foreground")}>Ação</span>
          </div>
          <ul className="divide-y divide-border">
            {data.sources.map((c) => {
              const meta = statusMeta[c.status];
              const Icon = meta.icon;
              return (
                <li
                  key={c.name}
                  className="flex flex-col gap-3 px-5 py-4 md:flex-row md:flex-wrap md:items-center md:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-foreground">{c.name}</div>
                    <div className={cn(textClass.meta, "text-muted-foreground")}>{c.kind}</div>
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
                  <div
                    className={cn(
                      textClass.numeric,
                      textClass.meta,
                      "w-full text-muted-foreground md:w-40",
                    )}
                  >
                    {c.syncLabel}
                  </div>
                  <Button
                    variant={c.status === "ERROR" ? "default" : "outline"}
                    size="sm"
                    className="h-11 w-full md:h-8 md:w-28"
                  >
                    {c.status === "NOT_CONNECTED" ? "Conectar" : "Reconectar"}
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
          <div
            className={cn("border border-dashed border-border bg-background p-5", radiusClass.card)}
          >
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
