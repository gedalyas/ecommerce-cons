# 2026-10-03 — The assistant answers from read-only tools over the store's data

## Contexto

The Assistente was a staged conversation and the only screen M4 kept locked
(`2026-10-02-new-stores-open-every-screen-but-the-assistant.md`). Making it real meant choosing
how Claude reaches the store's numbers, which model answers, where the conversation lives and who
sees the screen. The spec already fixed what an answer must do: cite real numbers, name its area
or pillar, and say when the data is fragile.

## Decisão

- **Read-only tools.** Claude calls eight tools (`apps/api/src/modules/assistant/assistantTools.ts`):
  overview, data sources, money, products, sales channels, customers, goals and the consultant's
  plan. Each one reuses an existing service function, is bound to the token's store, and needs the
  area and the screen visible to whoever asks. The final answer is structured
  (`{ area, pillar, text, caveats }`) and the API writes the origin label.
- **Haiku 4.5** answers (Davi), with 4 tool rounds, 8 lookups and 60 s per question, 60 questions
  per store (its people together) and 40 per person every 15 minutes.
- **The conversation lives in the browser** (`sessionStorage`, per person and store). The API
  records only `ASSISTANT_ASKED` with the areas consulted, never the question.
- **New stores open the Assistente** (`defaultReleasedScreens` is every screen). Stores created
  before keep their list; staff release it in `/admin`.

## Por quê

Tools let the answer reach the period and the area the question names and keep the per-area
access the screens already enforce, so a member without Dinheiro cannot get the DRE by asking.
Every number the model may cite comes from a service that already feeds a screen, with its
data-quality note next to it, which is what turns caveats into a rule instead of a hope. Haiku
keeps the cost per question low enough to open the screen to every store. Keeping the
conversation out of the database avoids storing free text a client types (which may hold personal
data) and a retention policy for it.

## Alternativas descartadas

- **One fixed summary of the store in the prompt**: cheaper per question, but blind to any period
  or detail outside the summary, and it would send every area to the model regardless of the
  member's grants.
- **Sonnet**: better at crossing areas, at a higher cost per question; revisit if the answers
  fall short on real stores.
- **Conversations saved in the database**: the consultant could read what the client asked and
  the history would follow the user across devices, at the cost of the task's only migration and
  a retention rule for free text.
- **Keep the Assistente locked per store**: every store would need a staff action for a screen
  that answers "no data" gracefully on an empty store.

Known limits: the history comes from the browser and is not trusted (permissions never derive from
it); the overview tool shows the same headline KPIs as the Dashboard (net profit and margin
included) to every member, as the Dashboard does; store data and the questions go to Anthropic,
which the privacy terms must name as an operator.
