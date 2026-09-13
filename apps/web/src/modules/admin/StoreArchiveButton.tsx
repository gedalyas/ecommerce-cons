import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { AdminStore } from "@ecommerce/contracts/admin";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { archiveStoreFn, restoreStoreFn } from "./adminController";

export function StoreArchiveButton({
  store,
  onError,
}: {
  store: AdminStore;
  onError: (message: string) => void;
}) {
  const archive = useServerFn(archiveStoreFn);
  const restore = useServerFn(restoreStoreFn);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (fn: typeof archive) => {
    setBusy(true);
    try {
      const result = await fn({ data: { id: store.id } });
      if (!result.ok) onError(result.message);
      setOpen(false);
      await router.invalidate();
    } finally {
      setBusy(false);
    }
  };

  if (store.archivedAt) {
    return (
      <Button variant="ghost" size="sm" disabled={busy} onClick={() => void run(restore)}>
        Reativar
      </Button>
    );
  }
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Arquivar
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Arquivar loja"
        description={store.name}
        className="max-w-md"
      >
        <p className={cn(textClass.body, "text-foreground")}>
          O cliente perde o acesso até a loja ser reativada. Os dados, as conexões e o
          acompanhamento ficam guardados; a consultoria continua vendo a loja.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Manter ativa
          </Button>
          <Button variant="destructive" onClick={() => void run(archive)} disabled={busy}>
            {busy ? "Arquivando…" : "Arquivar loja"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
