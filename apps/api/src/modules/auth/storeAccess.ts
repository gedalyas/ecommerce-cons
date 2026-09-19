import type { AreaAccess, ScreenRelease, StoreScreen, UserRole } from "@ecommerce/contracts/auth";

export type StoreAccess = {
  role: UserRole;
  ownClientId: string | null;
  ownClientArchived: boolean;
  ownReleasedScreens: readonly StoreScreen[];
  assignedClientIds: readonly string[];
  areaAccess: AreaAccess;
  release: ScreenRelease;
};

export const ARCHIVED_STORE_MESSAGE =
  "Esta loja está arquivada. Fale com sua consultoria para reativá-la.";

export function isBlockedByArchive(access: StoreAccess, clientId: string): boolean {
  return access.role === "CLIENT" && access.ownClientId === clientId && access.ownClientArchived;
}

export function canAccessStore(access: StoreAccess, clientId: string): boolean {
  switch (access.role) {
    case "ADMIN":
      return true;
    case "CONSULTANT":
      return access.assignedClientIds.includes(clientId);
    case "CLIENT":
      return access.ownClientId === clientId;
  }
}

export function defaultStoreOf(access: StoreAccess): string | null {
  if (access.role === "CLIENT") return access.ownClientId;
  return access.assignedClientIds.length === 1 ? (access.assignedClientIds[0] ?? null) : null;
}

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
