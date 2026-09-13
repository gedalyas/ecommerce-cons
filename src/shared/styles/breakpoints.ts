/** Breakpoints used by the Dashboard. No new breakpoint is allowed. */
export const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 } as const;

export type Breakpoint = keyof typeof breakpoints;

/** Prefixos Tailwind correspondentes, para uso em classes. */
export const bp = { sm: "sm:", md: "md:", lg: "lg:", xl: "xl:", "2xl": "2xl:" } as const;
