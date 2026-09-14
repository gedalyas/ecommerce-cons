type JsonValue = unknown;

const objectOf = (value: JsonValue): Record<string, unknown> | null =>
  value !== null && value !== undefined && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const needsAccountOf = (settings: JsonValue): boolean => {
  const object = objectOf(settings);
  return object !== null && "accountId" in object && object["accountId"] === null;
};

export const accountIdOf = (settings: JsonValue): string | null => {
  const value = objectOf(settings)?.["accountId"];
  return typeof value === "string" ? value : null;
};

export function reconnectSettings(
  fresh: Record<string, unknown> | null,
  stored: JsonValue,
): Record<string, unknown> | null {
  if (!fresh) return null;
  const kept = accountIdOf(stored);
  if (kept && "accountId" in fresh && fresh["accountId"] === null) {
    return { ...fresh, accountId: kept };
  }
  return fresh;
}
