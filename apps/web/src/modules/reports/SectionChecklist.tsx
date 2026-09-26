import { reportSectionLabel, type ReportSectionKey } from "@ecommerce/contracts/reports";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

export function SectionChecklist({
  available,
  selected,
  onToggle,
}: {
  available: readonly ReportSectionKey[];
  selected: readonly ReportSectionKey[];
  onToggle: (key: ReportSectionKey) => void;
}) {
  return (
    <fieldset>
      <legend className={cn(textClass.label, "text-foreground")}>Seções</legend>
      <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {available.map((key) => (
          <li key={key}>
            <label
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 border border-border px-3 py-2",
                radiusClass.control,
              )}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={selected.includes(key)}
                onChange={() => onToggle(key)}
              />
              <span className={textClass.body}>{reportSectionLabel[key]}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
