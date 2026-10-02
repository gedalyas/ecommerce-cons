import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  integrationsTabLabel,
  integrationsTabs,
  summaryDetail,
  type ConnectionsScreen,
  type IntegrationPageSearch,
  type IntegrationsSearch,
} from "@ecommerce/contracts/connections";
import { connectorErrorReasonLabel, type StoreConnector } from "@ecommerce/contracts/connectors";
import type { ImportsScreen } from "@ecommerce/contracts/imports";
import { ImportPanel } from "@/modules/imports/contract";
import { AlertBanner } from "@/shared/ui/AlertBanner";
import { Button } from "@/shared/ui/Button";
import { PageHeader } from "@/shared/ui/PageHeader";
import { TabBar } from "@/shared/ui/TabBar";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { ConnectDialog } from "./ConnectDialog";
import { IntegrationsCatalog } from "./IntegrationsCatalog";
import { MyIntegrations } from "./MyIntegrations";
import { StatusMappingDialog } from "./StatusMappingDialog";
import { IntegrationInstancesDialog } from "./IntegrationInstancesDialog";
import { asIntegration, integrationsOf, isStoreIntegration } from "./integrationRules";
import { useIntegrationsSearch } from "./useIntegrationsSearch";

function OutcomeBanners({
  connected,
  failed,
  search,
  onRetry,
}: {
  connected: StoreConnector | null;
  failed: StoreConnector | null;
  search: IntegrationsSearch;
  onRetry: (connector: StoreConnector) => void;
}) {
  return (
    <>
      {connected && (
        <AlertBanner icon={false}>
          <span role="status" className="font-semibold text-foreground">
            {connected.connection?.needsAccount
              ? `${connected.label} conectado. Escolha a conta para começar a importação.`
              : `${connected.label} conectado. O histórico está sendo importado — acompanhe em Minhas integrações.`}
          </span>
        </AlertBanner>
      )}
      {search.erro && (
        <AlertBanner
          action={
            failed && failed.availability === "oauth" ? (
              <Button size="sm" variant="outline" onClick={() => onRetry(failed)}>
                Tentar de novo
              </Button>
            ) : undefined
          }
        >
          <span role="alert" className="text-foreground">
            {failed
              ? `Não foi possível conectar ${failed.label}. `
              : "Não foi possível concluir a conexão. "}
            {connectorErrorReasonLabel[search.motivo]}
          </span>
        </AlertBanner>
      )}
    </>
  );
}

export function Connections({
  data,
  imports,
}: {
  data: ConnectionsScreen;
  imports: ImportsScreen;
}) {
  const { search, patch } = useIntegrationsSearch();
  const connectedPlatform = data.connectors.find((c) => c.key === search.conectado) ?? null;
  const connected = connectedPlatform
    ? asIntegration(
        connectedPlatform,
        connectedPlatform.connections.find((c) => c.id === search.integracao) ??
          connectedPlatform.connection,
      )
    : null;
  const failed = data.connectors.find((c) => c.key === search.erro) ?? null;
  const mine = integrationsOf(data.connectors.filter(isStoreIntegration));
  const detail = summaryDetail(data.summary);
  const [connecting, setConnecting] = useState<StoreConnector | null>(null);
  const [mapping, setMapping] = useState<StoreConnector | null>(() =>
    search.escolher && connected?.connection?.needsAccount ? connected : null,
  );
  const tabs = integrationsTabs.map((key) => ({
    key,
    label:
      key === "minhas"
        ? `${integrationsTabLabel[key]} (${mine.length})`
        : integrationsTabLabel[key],
  }));
  const navigate = useNavigate();
  const [instances, setInstances] = useState<StoreConnector | null>(null);
  const openPage = (
    c: StoreConnector,
    search: { conta?: string; nova?: boolean; aba?: IntegrationPageSearch["aba"] } = {},
  ) => void navigate({ to: "/integracoes/$chave", params: { chave: c.key }, search });
  const openCard = (c: StoreConnector) =>
    c.connections.length > 0 ? setInstances(c) : openPage(c);
  return (
    <div className={layout.page}>
      <PageHeader title="Integrações" subtitle="Fontes que alimentam os indicadores da loja" />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        <OutcomeBanners
          connected={connected}
          failed={failed}
          search={search}
          onRetry={setConnecting}
        />
        <AlertBanner icon={false}>
          <span className={cn(textClass.numeric, "font-semibold text-foreground")}>
            {data.summary.active} de {data.summary.total} fontes ativas
          </span>
          {detail && <span className="text-muted-foreground"> · {detail}</span>}
        </AlertBanner>

        <TabBar tabs={tabs} value={search.aba} onChange={(aba) => patch({ aba })} />

        {search.aba === "integracoes" && (
          <IntegrationsCatalog
            connectors={data.connectors}
            category={search.categoria}
            query={search.busca}
            onCategory={(categoria) => patch({ categoria, busca: "" })}
            onQuery={(busca) => patch({ busca })}
            onOpen={openCard}
          />
        )}
        {search.aba === "minhas" && (
          <MyIntegrations
            connectors={mine}
            onBrowse={() => patch({ aba: "integracoes" })}
            onOpen={(c, aba) =>
              openPage(c, {
                ...(c.connection ? { conta: c.connection.id } : {}),
                ...(aba ? { aba } : {}),
              })
            }
          />
        )}
        {search.aba === "planilhas" && <ImportPanel data={imports} />}
      </div>

      <ConnectDialog connector={connecting} onClose={() => setConnecting(null)} />
      <StatusMappingDialog connector={mapping} onClose={() => setMapping(null)} />
      <IntegrationInstancesDialog
        connector={instances}
        canAddNew={instances?.canManage === true && instances.availability === "oauth"}
        onEdit={(c, connection) => openPage(c, { conta: connection.id })}
        onNew={(c) => openPage(c, { nova: true })}
        onClose={() => setInstances(null)}
      />
    </div>
  );
}
