import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, LifeBuoy } from "lucide-react";
import { useState } from "react";
import {
  integrationPageTabLabel,
  integrationPageTabs,
  type ConnectionsScreen,
} from "@ecommerce/contracts/connections";
import { familyOf, type StoreConnector } from "@ecommerce/contracts/connectors";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { radiusClass } from "@/shared/styles/radius";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { ConnectDialog } from "./ConnectDialog";
import { ConnectionPanel } from "./ConnectionPanel";
import { ConnectorLogo } from "./ConnectorLogo";
import { DataKindsPanel } from "./DataKindsPanel";
import { HelpPanel } from "./HelpPanel";
import { RequestDialog } from "./RequestDialog";
import { SettingsPanel } from "./SettingsPanel";
import { SideTabs } from "./SideTabs";
import { NewIntegrationPanel } from "./NewIntegrationPanel";
import {
  accountChoices,
  asIntegration,
  cardStateOf,
  selectedIntegration,
} from "./integrationRules";
import { useIntegrationPageSearch } from "./useIntegrationPageSearch";

const tabItems = integrationPageTabs.map((key) => ({ key, label: integrationPageTabLabel[key] }));

const stateBadge = { connected: "Conectada", error: "Com erro", manual: "Por planilha" } as const;

function HelpBox({ onHelp }: { onHelp: () => void }) {
  return (
    <div
      className={cn(
        radiusClass.card,
        "flex flex-wrap items-center gap-3 border border-primary bg-success-soft px-4 py-3",
      )}
    >
      <LifeBuoy className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <p className={cn(textClass.meta, "min-w-0 flex-1 text-foreground")}>
        Tem dúvidas sobre essa integração? Veja o passo a passo ou fale com sua consultoria.
      </p>
      <Button variant="outline" size="sm" onClick={onHelp}>
        Ver manual
      </Button>
    </div>
  );
}

function Header({ connector }: { connector: StoreConnector }) {
  const state = cardStateOf(connector);
  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/integracoes"
        className={cn(textClass.meta, "flex w-fit items-center gap-1 font-semibold text-primary")}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Integrações
      </Link>
      <div className="flex items-center gap-4">
        <ConnectorLogo connectorKey={connector.key} label={connector.label} className="h-14 w-14" />
        <div className="min-w-0">
          <h1 className={cn(textClass.sectionTitle, "text-foreground")}>{connector.label}</h1>
          <p className={cn(textClass.body, "text-muted-foreground")}>{connector.description}</p>
        </div>
        {state && (
          <Badge tone={state === "connected" ? "accent" : "muted"} className="ml-auto shrink-0">
            {stateBadge[state]}
          </Badge>
        )}
      </div>
    </div>
  );
}

function IntegrationPicker({
  connector,
  selectedId,
  onChoose,
  onNew,
}: {
  connector: StoreConnector;
  selectedId: string | null;
  onChoose: (id: string) => void;
  onNew: (() => void) | null;
}) {
  if (connector.connections.length < 2 && !onNew) return null;
  return (
    <div className="flex flex-wrap items-end gap-3">
      {connector.connections.length > 1 && (
        <div className="grid min-w-0 flex-1 gap-1 sm:max-w-sm">
          <span className={cn(textClass.label, "text-muted-foreground")}>Integração</span>
          <Select value={selectedId ?? ""} onValueChange={onChoose}>
            <SelectTrigger aria-label="Integração">
              <SelectValue placeholder="Escolha" />
            </SelectTrigger>
            <SelectContent>
              {connector.connections.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} · {c.externalLabel || "Conta"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {onNew && (
        <Button variant="outline" onClick={onNew}>
          Configurar nova
        </Button>
      )}
    </div>
  );
}

function NewIntegration({
  connector,
  screen,
  onCreated,
}: {
  connector: StoreConnector;
  screen: ConnectionsScreen;
  onCreated: (id: string) => void;
}) {
  const choices = accountChoices(screen.accounts, familyOf(connector.key), connector.connections);
  return (
    <SectionBlock title="Nova integração" bodyClassName={layout.cardPadding}>
      <NewIntegrationPanel connector={connector} choices={choices} onCreated={onCreated} />
    </SectionBlock>
  );
}

export function IntegrationPage({
  connector,
  screen,
}: {
  connector: StoreConnector;
  screen: ConnectionsScreen;
}) {
  const router = useRouter();
  const { search, setTab, choose, startNew } = useIntegrationPageSearch();
  const tab = search.aba;
  const [requesting, setRequesting] = useState<StoreConnector | null>(null);
  const [connecting, setConnecting] = useState<StoreConnector | null>(null);
  const canAddNew = connector.canManage && connector.availability === "oauth";
  const creating = search.nova && canAddNew;
  const selected = selectedIntegration(connector.connections, { ...search, nova: creating });
  const shown = asIntegration(connector, selected);
  return (
    <div className={layout.page}>
      <div className={cn(layout.headerGap, layout.blockStack)}>
        <Header connector={shown} />
        <IntegrationPicker
          connector={connector}
          selectedId={creating ? null : (selected?.id ?? null)}
          onChoose={choose}
          onNew={canAddNew && !creating ? startNew : null}
        />
        {creating ? (
          <NewIntegration
            connector={connector}
            screen={screen}
            onCreated={(id) => {
              choose(id);
              void router.invalidate();
            }}
          />
        ) : (
          <div className="@container">
            <div className="grid grid-cols-1 gap-6 @3xl:grid-cols-[200px_minmax(0,1fr)]">
              <SideTabs label="Seções" items={tabItems} value={tab} onChange={setTab} />
              <div className="flex min-w-0 flex-col gap-4">
                <SectionBlock
                  title={integrationPageTabLabel[tab]}
                  bodyClassName={layout.cardPadding}
                >
                  {tab === "conexao" && (
                    <ConnectionPanel
                      connector={shown}
                      onRequest={setRequesting}
                      onConnect={setConnecting}
                      onSettings={() => setTab("configuracoes")}
                    />
                  )}
                  {tab === "dados" && <DataKindsPanel connector={shown} owners={screen.owners} />}
                  {tab === "configuracoes" && (
                    <SettingsPanel key={selected?.id ?? "none"} connector={shown} />
                  )}
                  {tab === "ajuda" && <HelpPanel connector={shown} />}
                </SectionBlock>
                {tab !== "ajuda" && <HelpBox onHelp={() => setTab("ajuda")} />}
              </div>
            </div>
          </div>
        )}
      </div>
      <RequestDialog connector={requesting} onClose={() => setRequesting(null)} />
      <ConnectDialog connector={connecting} onClose={() => setConnecting(null)} />
    </div>
  );
}
