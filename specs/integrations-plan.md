# Integrations the Bling way — plan

Approved 2026-10-01. Source: the Claude-in-Chrome report on Bling's Central de Extensões
(observed 2026-09-30, 30 screenshots; kept outside git) compared with our `/conexoes` of the
same day. The 2026-09-22 meeting asked for "connections inspired by Bling's integration catalog";
the first version (G2) was one long page of stacked groups, one row per connector and a bottom
drawer, which Davi judged wrong.

## What Bling does (worth copying)

- **Tabs** at the top (Descubra · Integrações · Serviços · Minhas instalações) and a wide search.
- **Catalog by category**: a collapsible side menu with groups and subcategories (Vendas online
  → Marketplace, Plataforma de e-commerce, Hub, Social commerce…; Logística; Financeiro;
  Inteligência; ERP). Each subcategory has a title, a one-line description and sometimes a
  "Recomendados pelo Bling" block.
- **Cards**: white, light border, square logo (~46 px), bold name, one-line description, a
  "Recomendado" badge. The whole card is clickable — no button. 3 per row (4 on wide screens),
  1 on phones.
- **Search with suggestions**: logo + name + category ("Mercado Livre — Em Marketplace"),
  footer "Não encontrou? Sugira uma integração", Enter → results grouped by category.
- **Minhas instalações**: the store's integrations by category, 2 per row, a ⋮ menu with
  "Desativar" in red, and a "Desativadas" accordion.
- **A page per integration** (not a modal) with a breadcrumb and vertical tabs (Autenticação ·
  Configuração · Funcionalidades · Ajuda): an OAuth onboarding with numbered green steps and a
  full-width "Conectar com X"; key/token fields with a red asterisk and "Testar"; a ✓ / struck
  table of what it does; a help box at the foot of every tab; toggles labelled
  "Ativado/Desativado".
- **Modalities are separate cards** ("Mercado Livre", "Mercado Envios"; "Amazon", "Amazon FBA
  Classic", "Amazon FBA Onsite"). When the store already has one, a modal asks "edit an existing
  one or configure a new one".

**Not copied** (weak points): the catalog does not show what is connected; no card shows status
or last sync; no history; "Salvar" repeated per tab.

## Decisions (Davi, 2026-10-01)

1. **Name and URL "Integrações"** — menu, title and `/integracoes`; `/conexoes` redirects
   keeping its query (OAuth returns, e-mails, help links).
2. **Modalities as separate integrations, like Bling — also behind the screen** (confirmed
   the same day: each connects on its own and brings only its orders). Was: **Modalities as cards**, like Bling (Mercado Livre / Mercado Livre Full; Amazon / FBA
   Classic / FBA Onsite) — supersedes the 2026-09-23 "modality inside the card"; recorded in
   `decisions/` in slice 3.
3. **Several accounts of the same platform, now** — named instances ("ML Matriz", "ML
   Filial"), like Bling's.
4. **Before M4** — part of the MVP scope.

Kept from our side: status, last sync and "Testar" (G2) — what Bling lacks.

## Database (the one migration, slice 4)

`connection` and `data_source` are unique per (store, platform) today and eight API call sites
rely on it. For several accounts: `connection` gets an instance name and stops being unique per
(store, platform); the **one source per data kind** rule (2026-09-23) stays per **platform** —
every Mercado Livre account of the store feeds the kind Mercado Livre owns, with the same date
cut; orders record the connection they came from (filter, and undo what an account brought when
it is removed).

## Slices (one commit each, then M4)

| Slice | Scope                                                                                                                                                                                                                                                                                                      | Size                        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 1     | **Integrations hub**: "Integrações" in the menu, `/integracoes` (redirect from `/conexoes`), tabs Integrações · Minhas integrações · Planilhas, wide search, category menu (Gestão/ERP · Vendas online · Marketing), recommended per category, clickable card grid, "Conectada" badge; 390 px              | ~550 lines, web + contracts |
| 2     | **Integration page** (own route, breadcrumb): Conexão (numbered onboarding + big button, or fields * + "Testar"), O que puxa (✓ / struck table, single-owner notice), Configurações (account, source per kind, "Ativado/Desativado" toggles), Ajuda + help box on every tab, one "Salvar"; the drawer goes | ~600 lines                  |
| 3     | **Modalities as cards** (decision recorded) and **search suggestions** (logo + name + category, "Sugira uma integração" = today's "Solicitar conexão")                                                                                                                                                     | ~350 lines                  |
| 4     | **Several accounts per platform** — **the migration**: instance name, connection per account, orders with their connection, "edit existing or configure new" modal, sync per account, audit                                                                                                                | ~600 lines                  |
| 5     | **Minhas integrações**: cards by category with the account name, status (Conectada · Sincronizando · Erro), last sync, ⋮ (Testar, Sincronizar, Desconectar in red), "Desconectadas" accordion; Planilhas tab with the manual/AI import                                                                     | ~400 lines                  |

Per slice: `typecheck`, `lint` (caps api 15 / web 7), `check:cycles` 0, `test`,
`format:check`, `build`; smoke at 1280 and 390 px on an empty store and on Loja Exemplo,
connecting through the stubs (Meta/Google/ML) — **two Mercado Livre accounts** in slice 4;
`db-reviewer` and `security-auditor` on slice 4; `check-design-system` on every slice.
