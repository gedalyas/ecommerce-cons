# 2026-10-02 — New stores open every screen but the assistant

## Contexto

Since 2026-09-19 (`2026-09-19-screens-released-per-store.md`) a new store opened only Marketing
and Pedidos; the other nine screens showed "Em desenvolvimento" because, on a real store, they
showed wrong numbers (Margem 100%, Ruptura 100%, coupons counted out of their validity). The M4
round (`m4-plan.md`) fixed the data behind them: unknown cost and stock are no longer zero, the
products spreadsheet and Bling bring cost and stock, and Métricas, Metas, Gestão, Clientes,
Influenciadores and Dinheiro got their fixes and notices.

## Decisão

- `defaultReleasedScreens` (contracts) is every screen except **Assistente**, which is still a
  canned conversation (Task C). Store creation (`storeService`) writes that list explicitly.
- Existing stores keep their list; staff release screens per store in `/admin` as before.
- The Prisma `@default([MARKETING, ORDERS])` on `Client.releasedScreens` stays: changing it would
  take a second migration in M4, and every real store is created through `storeService`
  (only the dev seed's "Loja Exemplo" keeps the column default).

## Por quê

A screen that reads "—" with a reason ("Cadastre o custo dos produtos", "Sem fonte de estoque",
"sem fonte de anúncios") is useful to a new client; one locked behind "Em desenvolvimento" is
not. The remaining risk is a store without any source, which every screen now handles as an
empty store.

## Alternativas descartadas

- **Keep releasing per store only**: every new pilot would need a staff action for screens that
  are ready, and a forgotten store would stay half-locked.
- **Change the column default in the schema**: same effect for new rows, but a second M4
  migration for a value the creation code already decides.
