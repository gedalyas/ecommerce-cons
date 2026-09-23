import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  isExclusiveKind,
  switchNotice,
  type KindOwnership,
  type StoreConnector,
} from "@ecommerce/contracts/connectors";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { chooseDataSourceFn } from "./connectionsController";

export function DataSourceSwitch({
  connector,
  row,
}: {
  connector: StoreConnector;
  row: KindOwnership;
}) {
  const choose = useServerFn(chooseDataSourceFn);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kind = row.kind;
  if (!connector.canManage || !isExclusiveKind(kind)) return null;
  const leaving = row.owner === "this";
  const usable = connector.connection != null || connector.key === "manual_csv";
  if (!leaving && !usable) return null;
  const confirm = async () => {
    setBusy(true);
    const result = await choose({
      data: { kind, source: leaving ? null : connector.key },
    });
    setBusy(false);
    if (!result.ok) return setError(result.message);
    setOpen(false);
    await router.invalidate();
  };
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {leaving ? "Deixar de usar" : "Usar esta integração"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`${row.label}: ${leaving ? "deixar de usar" : "usar"} ${connector.label}`}
      >
        <p className={cn(textClass.body, "text-foreground")}>
          {switchNotice(row, connector.label)}
        </p>
        {error && <p className={cn(textClass.meta, "mt-2 text-destructive")}>{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button disabled={busy} onClick={() => void confirm()}>
            Confirmar
          </Button>
        </div>
      </Dialog>
    </>
  );
}
