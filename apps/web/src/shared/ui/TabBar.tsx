import { cn } from "@/shared/utils/cn";

export type TabItem<K extends string> = { key: K; label: string };

export function TabBar<K extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: readonly TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[15px] leading-6 transition-colors duration-150",
              active
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
