const placeholderIds = new Set(["bling", "ga4", "google-ads", "instagram", "meta", "tiktok"]);

export const isPlaceholderId = (reported: string): boolean => placeholderIds.has(reported);

export function accountExternalId(input: {
  reported: string;
  reconnecting: string | null;
  fresh: string;
}): string {
  if (!isPlaceholderId(input.reported)) return input.reported;
  return input.reconnecting ?? `${input.reported}:${input.fresh}`;
}
