import {
  canViewArea,
  isScreenReleased,
  type AccessArea,
  type AreaAccess,
  type ScreenRelease,
  type StoreScreen,
} from "@ecommerce/contracts/auth";

export const areaOfPath: Record<string, AccessArea> = {
  "/dinheiro": "MONEY",
  "/marketing": "MARKETING",
  "/influenciadores": "MARKETING",
  "/logistica": "LOGISTICS",
  "/gestao": "MANAGEMENT",
  "/metas": "MANAGEMENT",
  "/pedidos": "DATA",
  "/produtos": "DATA",
  "/clientes": "DATA",
  "/metricas": "DATA",
};

export const screenOfPath: Record<string, StoreScreen> = {
  "/assistente": "ASSISTANT",
  "/dinheiro": "MONEY",
  "/marketing": "MARKETING",
  "/logistica": "LOGISTICS",
  "/gestao": "MANAGEMENT",
  "/pedidos": "ORDERS",
  "/produtos": "PRODUCTS",
  "/clientes": "CUSTOMERS",
  "/metas": "GOALS",
  "/metricas": "METRICS",
  "/influenciadores": "INFLUENCERS",
};

export const UNDER_DEVELOPMENT_PATH = "/em-desenvolvimento";

export const ownerOnlyPaths = ["/loja"] as const;

export function canOpenPath(pathname: string, access: AreaAccess): boolean {
  if (access === null) return true;
  if (ownerOnlyPaths.some((path) => path === pathname)) return false;
  const area = areaOfPath[pathname];
  return area === undefined || canViewArea(access, area);
}

export function isPathReleased(pathname: string, release: ScreenRelease): boolean {
  const screen = screenOfPath[pathname];
  return screen === undefined || isScreenReleased(release, screen);
}

export function underDevelopmentSlugOf(pathname: string): string {
  return pathname.replace(/^\//, "");
}

export function pathOfUnderDevelopmentSlug(slug: string): string | null {
  const pathname = `/${slug}`;
  return pathname in screenOfPath ? pathname : null;
}

export type NavItem<T> = T & { locked: boolean; hiddenFromClient: boolean };

export function navItems<T extends { to: string }>(
  items: readonly T[],
  access: AreaAccess,
  release: ScreenRelease,
  releasedScreens: readonly StoreScreen[],
): NavItem<T>[] {
  return items
    .filter((item) => canOpenPath(item.to, access))
    .map((item) => {
      const screen = screenOfPath[item.to];
      return {
        ...item,
        locked: !isPathReleased(item.to, release),
        hiddenFromClient: screen !== undefined && !releasedScreens.includes(screen),
      };
    });
}

export function isNavItemActive(
  item: { to: string; locked: boolean },
  location: { pathname: string; tela: string | undefined },
): boolean {
  if (!item.locked) return location.pathname === item.to;
  return (
    location.pathname === UNDER_DEVELOPMENT_PATH &&
    location.tela === underDevelopmentSlugOf(item.to)
  );
}
