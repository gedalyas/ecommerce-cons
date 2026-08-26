import { useEffect, useState } from "react";
import { breakpoints, type Breakpoint } from "../tokens/breakpoints";

/** true quando a viewport tem pelo menos a largura do breakpoint informado. */
export function useBreakpoint(name: Breakpoint) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpoints[name]}px)`);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [name]);

  return matches;
}
