# 2026-10-01 — The seller's account is apart from the integration

## Contexto

`connection` held everything about a platform link in one row, unique per (store, connector):
the sealed credentials, the external account, the cursor, the settings and the stage. Two
changes of 2026-10-01 broke that shape (`integrations-plan.md`): several accounts of one platform
per store, like Bling's named instances ("ML Matriz", "ML Filial"), and marketplace modalities as
separate integrations (`2026-10-01-connector-modalities-as-integrations.md`). With one row per
modality, Mercado Livre and Mercado Livre Full of the same seller stored two grants of the same
app — and Mercado Livre may keep only the latest one, so each authorization or refresh could log
the other out.

## Decisão

- **`connector_account`** is the seller's login: one per (store, platform family, external id),
  owner of the sealed credentials, the auth pattern and the external label. Authorizing again
  with the same seller updates it; an account with no integration left is deleted.
- **`connection`** is the integration: a connector key (a modality) on an account, with its own
  name, stage, cursor and settings; unique per (account, connector key), so a store can hold
  several per platform.
- The worker opens and renews **the account's** token. Two integrations of one account may renew
  at once: the token is written only if it did not change since it was read, and a failed or
  lost renewal uses the newer token a sibling saved (`refreshRace.ts`, pure, tested).
- `sales_order.connection_id` (nullable, set null when the integration goes) records which
  integration wrote the order, next to `source` (the connector key). Disconnecting still keeps the
  data, as before.
- Existing connections were dev-only (real connections wait for the company's domain, 2026-09-20):
  the dev rows were emptied before the migration; no data lives in the migration.

## Por quê

The token belongs to the seller, not to the modality: sharing it removes the grant fight and lets
the next modality of a connected seller start without a new login. Keeping the integration as
its own row is what Bling's "editar existente ou configurar nova" needs.

## Alternativas descartadas

- **Copy the token into each modality's row**: every refresh would rotate one copy and leave the
  other stale (Mercado Livre refresh tokens are single use).
- **One connection per platform with modalities inside its settings**: contradicts the
  separate-integration decision and cannot hold two accounts.
- **A lock per account around the worker's refresh** (advisory lock): needs a session-bound lock
  across the pooled Prisma client; the compare-and-set on the stored token is enough.
