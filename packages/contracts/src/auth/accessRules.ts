import {
  accessAreaLabel,
  accessAreas,
  accessLevelLabel,
  type AccessArea,
  type AccessLevel,
  type AreaGrant,
  type ClientMembership,
} from "./accessAreas";
import type { UserRole } from "./auth.types";

export type AreaAccess = readonly AreaGrant[] | null;

export function grantsOf(
  viewAreas: readonly AccessArea[],
  editAreas: readonly AccessArea[],
): AreaGrant[] {
  return accessAreas.flatMap((area): AreaGrant[] => {
    if (editAreas.includes(area)) return [{ area, level: "edit" }];
    if (viewAreas.includes(area)) return [{ area, level: "view" }];
    return [];
  });
}

export function areasOfGrants(grants: readonly AreaGrant[]): {
  viewAreas: AccessArea[];
  editAreas: AccessArea[];
} {
  const ordered = accessAreas.filter((area) => grants.some((g) => g.area === area));
  return {
    viewAreas: ordered,
    editAreas: ordered.filter((area) => grants.some((g) => g.area === area && g.level === "edit")),
  };
}

export function areaAccessOf(user: {
  role: UserRole;
  membership: ClientMembership | null;
  grants: readonly AreaGrant[];
}): AreaAccess {
  return user.role === "CLIENT" && user.membership === "MEMBER" ? user.grants : null;
}

export function levelOfArea(access: AreaAccess, area: AccessArea): AccessLevel | null {
  if (access === null) return "edit";
  return access.find((g) => g.area === area)?.level ?? null;
}

export function canViewArea(access: AreaAccess, area: AccessArea): boolean {
  return levelOfArea(access, area) !== null;
}

export function canEditArea(access: AreaAccess, area: AccessArea): boolean {
  return levelOfArea(access, area) === "edit";
}

export function grantLabels(grants: readonly AreaGrant[]): string[] {
  return grants.map(
    (g) => `${accessAreaLabel[g.area]} (${accessLevelLabel[g.level].toLowerCase()})`,
  );
}

export function canEditEveryArea(access: AreaAccess, areas: readonly AccessArea[]): boolean {
  return areas.every((area) => canEditArea(access, area));
}
