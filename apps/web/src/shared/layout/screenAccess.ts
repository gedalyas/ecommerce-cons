import { canViewArea, type AccessArea, type AreaAccess } from "@ecommerce/contracts/auth";

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

export const ownerOnlyPaths = ["/loja"] as const;

export function canOpenPath(pathname: string, access: AreaAccess): boolean {
  if (access === null) return true;
  if (ownerOnlyPaths.some((path) => path === pathname)) return false;
  const area = areaOfPath[pathname];
  return area === undefined || canViewArea(access, area);
}

export function openableItems<T extends { to: string }>(
  items: readonly T[],
  access: AreaAccess,
): T[] {
  return items.filter((item) => canOpenPath(item.to, access));
}
