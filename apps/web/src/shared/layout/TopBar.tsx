import { PeriodSelector } from "@/shared/ui/PeriodSelector";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

export function TopBar({ storeName, showPeriod }: { storeName: string; showPeriod: boolean }) {
  const { period, setPeriod } = usePeriod();

  return (
    <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4 sm:px-6 xl:px-8">
      <span className={cn(textClass.meta, "truncate font-semibold text-foreground md:hidden")}>
        {storeName}
      </span>
      {showPeriod && (
        <PeriodSelector
          value={period}
          onChange={setPeriod}
          className="ml-auto md:-ml-2 md:mr-auto"
        />
      )}
    </div>
  );
}
