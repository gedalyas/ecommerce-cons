import { FileText } from "lucide-react";
import { useState } from "react";
import type { AreaAccess, ScreenRelease } from "@ecommerce/contracts/auth";
import { sectionsVisibleTo } from "@ecommerce/contracts/reports";
import { Button } from "@/shared/ui/Button";
import { Sheet } from "@/shared/ui/Sheet";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { layout } from "@/shared/styles/spacing";
import { ReportBuilder } from "./ReportBuilder";
import { ReportSchedules } from "./ReportSchedules";

type ReportTab = "build" | "schedules";

const tabOptions: { key: ReportTab; label: string }[] = [
  { key: "build", label: "Montar" },
  { key: "schedules", label: "Automações" },
];

export function ReportButton({ access, release }: { access: AreaAccess; release: ScreenRelease }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ReportTab>("build");
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
        <div className={layout.cardPadding}>
          <SegmentedControl options={tabOptions} value={tab} onChange={setTab} label="Relatório" />
        </div>
        {open && tab === "build" && <ReportBuilder available={available} />}
        {open && tab === "schedules" && <ReportSchedules available={available} />}
      </Sheet>
    </>
  );
}
