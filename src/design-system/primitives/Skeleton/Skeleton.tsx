import { cn } from "@/lib/utils";
import { radiusClass } from "../../tokens/radius";
import type { SkeletonProps } from "./types";

/** Placeholder de carregamento na cor de superfície. */
export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={cn("animate-pulse bg-muted", radiusClass.control, className)} />;
}
