import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

type Props<K extends string> = {
  label: string;
  items: readonly { key: K; label: string }[];
  value: K | null;
  onChange: (key: K) => void;
};

export function SideTabs<K extends string>({ label, items, value, onChange }: Props<K>) {
  return (
    <nav aria-label={label} className="min-w-0">
      <div className={cn(textClass.label, "mb-2 hidden text-muted-foreground @3xl:block")}>
        {label}
      </div>
      <ul className="flex gap-2 overflow-x-auto pb-1 @3xl:flex-col @3xl:gap-1 @3xl:overflow-visible @3xl:pb-0">
        {items.map((item) => {
          const active = item.key === value;
          return (
            <li key={item.key} className="shrink-0">
              <button
                type="button"
                aria-current={active ? "true" : undefined}
                onClick={() => onChange(item.key)}
                className={cn(
                  textClass.body,
                  radiusClass.control,
                  "w-full whitespace-nowrap border px-3 py-2 text-left transition-colors duration-150 @3xl:border-transparent",
                  active
                    ? "border-primary bg-success-soft font-semibold text-primary"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
