# 2026-09-13 — SaaS tenancy: store per client, roles, invitations, active store header

## Contexto

The product was built around one mocked client (Loja Aurora) with a fixed consulting layer
(pillar KPIs, recommendations and alerts as seeded copy). It is a SaaS: many stores, each
configured by its own users, served by consultants who own a portfolio, administered by the
consultancy.

## Decisão

- **The store is the tenant** (`Client`). `CLIENT` users belong to one store; `CONSULTANT`
  users see the stores assigned to them (`ConsultantAssignment`); `ADMIN` sees all.
- **Access by invitation.** An e-mail is released by an admin or consultant (`Invitation`);
  registration only succeeds for a pending invitation. The first admin comes from the
  environment on seed.
- **One active store per request.** The web keeps `activeClientId` in the session and sends
  `x-client-id`; the API's `resolveClient` middleware checks the role's access and sets
  `req.auth.clientId`. Data services keep taking `clientId` and never see roles.
- **Connectors are a catalog** with per-store status; the ones without an integration are
  requested and handled by the consultancy; CSV import is the working door.
- **No demo tenant, no example copy.** Sections, pillars and milestone criteria are created
  per store from a template; KPIs are live or absent; recommendations are written by the
  consultant. The synthetic dataset survives only as a development seed.

## Por quê

- A header for the active store keeps every data endpoint and service untouched: they already
  take `clientId`. Putting the store in the URL would rewrite every route on both sides;
  putting it in the JWT would force a new token per switch.
- Invitations instead of open sign-up: the consultancy sells the service; an unknown e-mail
  has nothing to see.
- Template-created engagement instead of seeded copy: the copy was Aurora's; a real store
  starts with the structure and earns the numbers from its data.

## Alternativas descartadas

- **Store slug in every URL** (`/lojas/:slug/pedidos`). Rewrites all routes, BFF and API paths
  for a value that changes once per session.
- **One token per store.** Extra round trip and a refresh dance on every switch.
- **Open sign-up with approval.** More screens (pending state, approval) for a flow the
  consultancy does not want; can be added on top of invitations later.
- **Keeping Aurora as a demo tenant.** Davi asked for it to go; the dev seed keeps local
  development possible without shipping a fake store.
