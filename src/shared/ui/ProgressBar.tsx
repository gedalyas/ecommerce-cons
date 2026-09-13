import { cn } from "@/shared/utils/cn";

/**
 * A horizontal progress bar with an optional marker ("where you should be").
 * `value` and `marker` are percentages; values above 100 fill the bar.
 */
export function ProgressBar({
  value,
  marker,
  tone = "accent",
  label,
  className,
}: {
  value: number | null;
  marker?: number | null;
  tone?: "accent" | "warning";
  label: string;
  className?: string;
}) {
  const width = value == null ? 0 : Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value == null ? undefined : Math.round(width)}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full", tone === "warning" ? "bg-warning" : "bg-primary")}
        style={{ width: `${width}%` }}
      />
      {marker != null && marker > 0 && marker < 100 && (
        <div
          aria-hidden
          className="absolute top-0 h-full w-0.5 bg-foreground/60"
          style={{ left: `${marker}%` }}
        />
      )}
    </div>
  );
}
