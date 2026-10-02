export type RefreshOutcome = "saved" | "conflict" | "failed";

export function credentialsAfterRefresh(input: {
  outcome: RefreshOutcome;
  read: string;
  latest: string | null;
}): "own" | "latest" | "rethrow" {
  const { outcome, read, latest } = input;
  if (outcome === "saved") return "own";
  const newer = latest !== null && latest !== read;
  if (outcome === "conflict") return newer ? "latest" : "own";
  return newer ? "latest" : "rethrow";
}
