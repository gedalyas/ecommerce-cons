import type { ReactNode } from "react";
export type CardTone = "default" | "warning" | "highlight" | "muted";
export type CardProps = { tone?: CardTone; className?: string; children: ReactNode };
