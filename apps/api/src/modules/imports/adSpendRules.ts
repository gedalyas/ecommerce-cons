const URL_LIMIT = 2048;

export function safeImageUrl(value: string | null | undefined): string | null {
  if (!value || value.length > URL_LIMIT) return null;
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}
