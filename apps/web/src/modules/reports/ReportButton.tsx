import { FileText } from "lucide-react";
import { useState } from "react";
import type { AreaAccess, ScreenRelease } from "@ecommerce/contracts/auth";
import { sectionsVisibleTo } from "@ecommerce/contracts/reports";
import { Button } from "@/shared/ui/Button";
import { Sheet } from "@/shared/ui/Sheet";
import { ReportBuilder } from "./ReportBuilder";

export function ReportButton({ access, release }: { access: AreaAccess; release: ScreenRelease }) {
  const [open, setOpen] = useState(false);
  const available = sectionsVisibleTo(access, release);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileText className="h-4 w-4" /> Relatório
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Relatório"
        description="Escolha o período e as seções; veja a prévia com os números das telas."
      >
        {open && <ReportBuilder available={available} />}
      </Sheet>
    </>
  );
}
