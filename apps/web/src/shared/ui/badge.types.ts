import type { ReactNode } from "react";
export type BadgeTone = "accent" | "outline" | "muted" | "warning";
export type BadgeProps = { tone?: BadgeTone; className?: string; children: ReactNode };
