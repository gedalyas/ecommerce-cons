export const periodPaths = [
  "/",
  "/dinheiro",
  "/marketing",
  "/logistica",
  "/gestao",
  "/pedidos",
  "/produtos",
  "/clientes",
  "/metas",
  "/metricas",
  "/influenciadores",
] as const;

export const showsPeriod = (pathname: string) =>
  (periodPaths as readonly string[]).includes(pathname);
