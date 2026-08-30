import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Sticky header at the top of the content area; gains a shadow on scroll. */
export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
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
        "sticky top-0 z-20 -mx-4 border-b bg-background px-4 pb-4 pt-6 transition-all duration-200 sm:-mx-6 sm:px-6 xl:-mx-8 xl:px-8",
        scrolled ? "border-border shadow-sm" : "border-transparent",
      )}
    >
      <h1 className="t-section-title text-foreground">{title}</h1>
      <p className="t-meta mt-1 text-muted-foreground">{subtitle}</p>
    </header>
  );
}
