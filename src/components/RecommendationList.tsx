import type { Recommendation } from "@/lib/mock-data";

export function RecommendationList({ items }: { items: Recommendation[] }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.text} className="flex flex-wrap items-center justify-between gap-2 py-3">
          <span className="min-w-0 text-[15px] text-foreground">{item.text}</span>
          <span className="t-meta flex flex-wrap items-center gap-4 text-muted-foreground">
            <span className="num">{item.prazo}</span>
            <span>{item.responsavel}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
