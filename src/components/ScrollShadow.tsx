import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Detecta se há conteúdo acima/abaixo do corte numa área rolável. */
export function useScrollShadow<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState({ top: false, bottom: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const top = el.scrollTop > 1;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    setState((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  return { ref, ...state };
}

/** Gradientes fixos nas bordas da área rolável. */
export function ScrollShadows({ top, bottom }: { top: boolean; bottom: boolean }) {
  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "scroll-shadow-top pointer-events-none absolute inset-x-0 top-0 z-10 h-6 transition-opacity duration-200",
          top ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "scroll-shadow-bottom pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 transition-opacity duration-200",
          bottom ? "opacity-100" : "opacity-0",
        )}
      />
    </>
  );
}
