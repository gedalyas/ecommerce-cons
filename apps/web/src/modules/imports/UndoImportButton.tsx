import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { importKindLabel, type ImportJob } from "@ecommerce/contracts/imports";
import { formatNumber } from "@ecommerce/contracts/shared/format";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { undoImportFn } from "./importsController";

export function UndoImportButton({ job }: { job: ImportJob }) {
  const undo = useServerFn(undoImportFn);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await undo({ data: { id: job.id } });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setOpen(false);
      await router.invalidate();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Desfazer
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Desfazer importação"
        description={`${importKindLabel[job.kind]} · ${job.fileName}`}
        className="max-w-md"
      >
        <p className={cn(textClass.body, "text-foreground")}>
          As {formatNumber(job.rowsImported)} linhas gravadas por esta importação serão removidas e
          os dados que ela substituiu voltam ao que eram. Os indicadores são recalculados.
        </p>
        {message && (
          <p role="alert" className={cn(textClass.meta, "mt-3 text-destructive")}>
            {message}
          </p>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Manter
          </Button>
          <Button variant="destructive" onClick={() => void confirm()} disabled={busy}>
            {busy ? "Desfazendo…" : "Desfazer importação"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
