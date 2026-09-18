import { useEffect, useState } from "react";
import { cn } from "@/shared/utils/cn";
import type { PageHeaderProps } from "./pageHeader.types";

export type { PageHeaderProps } from "./pageHeader.types";

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.getElementById("app-scroll");
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 1);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 -mx-4 flex items-start justify-between gap-4 border-b bg-background px-4 pb-4 pt-6 transition-all duration-200 sm:-mx-6 sm:px-6 xl:-mx-8 xl:px-8",
        scrolled ? "border-border shadow-sm" : "border-transparent",
      )}
    >
      <div className="min-w-0">
        <h1 className="t-section-title text-foreground">{title}</h1>
        <p className="t-meta mt-1 text-muted-foreground">{subtitle}</p>
      </div>
      {action && <div className="shrink-0 pt-1">{action}</div>}
    </header>
  );
}
