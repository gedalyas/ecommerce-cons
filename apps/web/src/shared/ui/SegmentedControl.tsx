import { cn } from "@/shared/utils/cn";
import { radiusClass } from "@/shared/styles/radius";

export type SegmentedOption<K extends string> = { key: K; label: string };

/** A small radio group rendered as pills - metric pickers, level switches. */
export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: readonly SegmentedOption<K>[];
  value: K;
  onChange: (key: K) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full flex-wrap items-center gap-1 border border-border bg-card p-1 sm:h-9 sm:flex-nowrap sm:overflow-x-auto",
        radiusClass.control,
        className,
      )}
    >
      {options.map((option) => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.key)}
            className={cn(
              "h-7 whitespace-nowrap px-3 text-[13px] leading-[18px] transition-colors duration-150",
              radiusClass.badge,
              active
                ? "bg-primary font-semibold text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
