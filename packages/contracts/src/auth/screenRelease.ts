import type { UserRole } from "./auth.types";
import { storeScreens, type StoreScreen } from "./storeScreens";

export type ScreenRelease = readonly StoreScreen[] | null;

export function screenReleaseOf(
  user: { role: UserRole },
  store: { releasedScreens: readonly StoreScreen[] } | null,
): ScreenRelease {
  if (user.role !== "CLIENT") return null;
  return store?.releasedScreens ?? [];
}

export function isScreenReleased(release: ScreenRelease, screen: StoreScreen): boolean {
  return release === null || release.includes(screen);
}

export function orderedScreens(screens: readonly StoreScreen[]): StoreScreen[] {
  return storeScreens.filter((screen) => screens.includes(screen));
}
