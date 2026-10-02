import {
  connectionStageLabel,
  type ConnectionSummary,
  type StoreConnector,
} from "@ecommerce/contracts/connectors";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

type Props = {
  connector: StoreConnector | null;
  canAddNew: boolean;
  onEdit: (connector: StoreConnector, connection: ConnectionSummary) => void;
  onNew: (connector: StoreConnector) => void;
  onClose: () => void;
};

export function IntegrationInstancesDialog({
  connector,
  canAddNew,
  onEdit,
  onNew,
  onClose,
}: Props) {
  return (
    <Dialog
      open={connector !== null}
      onOpenChange={(open) => !open && onClose()}
      title={connector ? `Você já tem integrações de ${connector.label}` : ""}
      description="Edite uma das integrações existentes ou configure uma nova."
    >
      {connector && (
        <div className="grid gap-4">
          <ul className="divide-y divide-border">
            {connector.connections.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className={cn(textClass.body, "truncate font-semibold text-foreground")}>
                    {c.name}
                  </p>
                  <p className={cn(textClass.meta, "truncate text-muted-foreground")}>
                    {c.externalLabel || "Conta"} · {connectionStageLabel[c.stage]}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => onEdit(connector, c)}>
                  Editar
                </Button>
              </li>
            ))}
          </ul>
          {canAddNew && (
            <Button className="w-full" onClick={() => onNew(connector)}>
              Configurar nova
            </Button>
          )}
        </div>
      )}
    </Dialog>
  );
}
