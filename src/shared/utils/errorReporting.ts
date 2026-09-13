/**
 * Client-side error reporting hook for the React error boundaries.
 *
 * The prototype has no telemetry backend yet, so this only normalizes the error
 * into something readable and logs it. Point `sink` at a real collector when one
 * exists — every boundary already funnels through here.
 */
type ErrorContext = Record<string, unknown>;

function describe(error: unknown): string {
  // Loaders and server functions commonly throw a raw Response; String(it) is the
  // opaque "[object Response]", so pull out the status and URL instead.
  if (error instanceof Response) {
    return `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`;
  }
  return error instanceof Error ? error.message : String(error);
}

export function reportError(error: unknown, context: ErrorContext = {}) {
  if (typeof window === "undefined") return;
  console.error("[error-boundary]", describe(error), {
    route: window.location.pathname,
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  });
}
