import { CalendarClock, User } from "lucide-react";
import type { Recommendation } from "@/lib/mock-data";

export function RecommendationList({ items }: { items: Recommendation[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
      {items.map((item) => (
        <li
          key={item.text}
          className="flex flex-wrap items-center justify-between gap-2 bg-background px-3.5 py-2.5"
        >
          <span className="min-w-0 text-sm text-foreground">{item.text}</span>
          <span className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              <span className="num">{item.prazo}</span>
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {item.responsavel}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
