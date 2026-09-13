import { cn } from "@/shared/utils/cn";
import { radiusClass } from "@/shared/styles/radius";
import type { SkeletonProps } from "./skeleton.types";

export type { SkeletonProps } from "./skeleton.types";

/** Loading placeholder in the surface color. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse bg-muted", radiusClass.control, className)}
    />
  );
}
