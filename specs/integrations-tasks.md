# Integrations tasks

Board for `integrations-plan.md`. Tick as work lands; one commit per slice, checks green before each.

Status: **done 2026-10-01 — every slice landed; next: M4 (`m4-plan.md`).**

- [x] 1 — Integrations hub: `/integracoes` (redirect from `/conexoes`), tabs Integrações ·
      Minhas integrações · Planilhas, search, category menu, recommended, card grid, "Conectada"
- [x] 2 — Integration page: Conexão · O que puxa · Configurações · Ajuda, one "Salvar"; the drawer goes
- [x] 3 — Modalities as separate integrations, like Bling (Mercado Livre / Full, Amazon / FBA
      Classic / FBA Onsite): own keys, own connection, orders filtered by modality, one source
      per kind shared by the family (decision record)
- [x] 3b — Search suggestions (logo, name, category) and "Não encontrou?"
- [x] 4a — Account apart from integration (the migration `connector_accounts`): `connector_account`
      owns the credentials (one per store, platform and external id), `connection` becomes the
      integration (name, modality, cursor) — modalities of one seller share one token; refresh
      race handled; orders record their `connectionId`
- [x] 4b — API and contracts per integration: routes by connection id, authorize with a name,
      a new integration on an existing account, `StoreConnector.connections[]`, audit with the name;
      providers that use a constant external id (Bling "bling", fallbacks "ga4", "meta"…) need the
      real account id first, or two logins of one platform merge into one account
- [x] 4c — Screens for several accounts: Bling's "editar existente ou configurar nova" modal, name,
      account choice, integration selector on the page
- [x] 5 — Minhas integrações cards (status, last sync, ⋮, "Desconectadas") and the Planilhas tab
