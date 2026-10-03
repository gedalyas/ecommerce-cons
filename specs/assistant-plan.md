# Assistant — plan (Task C)

## Context

M4 opened every screen but the Assistente, which was still a staged conversation: two seeded
exchanges, one fixed reply ("Dinheiro · Organização"), and attachment and audio buttons that did
nothing. A client never saw it (`ASSISTANT` was outside `defaultReleasedScreens`); staff saw it
on every screen. The API already talks to Claude for the spreadsheet column suggestion
(`shared/ai/createAnthropic.ts`, `imports/importsSuggestService.ts`).

The grounding rules come from `assistant.md`: every answer cites the store's real numbers, names
the area or pillar it comes from, and says when the data is fragile (a source failing to sync,
data imported by hand, unknown cost).

Decisions (Davi, 2026-10-03): the conversation lives only in the browser; the model is Haiku
4.5; new stores open the Assistente.

## How it works

- Claude calls **read-only tools**, always bound to the token's `clientId`. Each tool reuses an
  existing service function and returns compact JSON: raw numbers, the `fidelityNote`, and the
  notices the screens already show (`costCoverageNotice`, `stockSourceNotice`).
- No tool returns a customer's name or e-mail — aggregates and product names only.
- Each tool needs the screen and area visible to whoever asks (the same area + release check as
  the Relatório); without access the tool answers "no access", never the data.
- The final answer is structured (`output_config.format`): `{ area, pillar, text, caveats[] }`;
  the API turns area + pillar into the label shown above the bubble ("Marketing · Aquisição").
- Limits: at most 4 tool rounds, 8 lookups per question (a repeated lookup reuses its result),
  60 s per question, `max_tokens` 1024, history of 12 messages of up to 2,000 characters, 30
  questions per 15 min per user and store and 60 per person across stores. Text the store's data
  brings (product names, alerts) is clipped to 160 characters before it reaches the model.
- No key: 503 "O assistente não está disponível agora."
- Audit: `ASSISTANT_ASKED` with the tools used, never the question's text.
- No migration in Task C. No streaming in v1: the answer arrives whole, behind a typing
  indicator.

## Slices — 3, one commit each

- **C1 — Assistant API** (contracts, api): `contracts/assistant` (request schema, reply type);
  `modules/assistant` (router `POST /assistant/messages` with rate limit, controller, service with
  the tool loop, pure `assistantTools`, `assistantFacts`, `assistantPrompt`, `assistantAnswer`,
  each tested). Tools: `store_overview`, `data_sources`, `money_results`, `products_sales`,
  `marketing_channels`, `customers_retention`, `goals_progress`. `ASSISTANT` gets its API route
  guard; `ASSISTANT_ASKED` audit action.
- **C2 — The real assistant screens** (web): BFF `askAssistantFn`; `useAssistant` keeps the
  conversation in `sessionStorage` per store and sends the selected period and the current
  screen; the staged messages, attachment and audio go; empty state with suggested questions,
  origin label, caveats, "Limpar conversa", unavailable and error messages; 390px.
- **C3 — Consultant plan and release** (contracts, api, specs): `consultant_plan` tool (pillar
  status, manual KPIs with the consultant's note, open recommendations, milestone criteria);
  `defaultReleasedScreens` becomes every screen; `assistant.md` rewritten; decision record.

## Verification

Per slice: typecheck, lint (api 15 / web 7), cycles 0, tests, format, build. The local `.env` has
no key, so the smoke points `ANTHROPIC_BASE_URL` at a stub of the Messages API that answers a
`tool_use` first and the structured answer next.
