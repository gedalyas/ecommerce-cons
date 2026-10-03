# Assistente

The assistant answers questions about the active store's numbers. Claude (Haiku 4.5) reads the
store's data through read-only tools on the API and answers in Portuguese, naming where the answer
comes from and what in the data is fragile. Plan: `assistant-plan.md`.

## Surfaces

One conversation per store and browser tab, shared by every surface (`AssistantProvider`, mounted
by the root around the shell):

- **Docked panel** (≥1280px): 288px right column on every shell screen, collapsible to a 56px
  rail.
- **Drawer** (768–1279px): the floating "Assistente" button opens it from the right.
- **Full page** `/assistente` (below 768px the floating button links here): the same conversation
  with a wider column; the shell hides the panel on this page.

The header reads "Assistente" and "Vendo: {screen}" — the screen the user is on
(`storeScreenLabel`, "Dashboard" elsewhere). "Limpar" ("Limpar conversa" on the page) empties the
conversation.

## Conversation

- **Empty**: one line on what the assistant does and three suggested questions about the current
  screen (Dinheiro, Marketing, Produtos, Clientes, Metas) or about the store as a whole
  (`assistantSuggestions`). A suggestion sends itself.
- **Question**: the composer sends on Enter (Shift+Enter breaks the line), up to 2,000
  characters. While the answer comes, three dots show "digitando"; the composer waits.
- **Answer**: the origin above the text ("Marketing · Aquisição", "Produtos", "Visão geral"), the
  text, and up to three caveats in smaller text under a rule.
- **Failure**: a warning-tinted bubble with the API's Portuguese message (unavailable, too many
  questions, invalid period); the conversation goes on.

The question carries the period and channel selected in the top bar and the current screen
(none on `/assistente`). The history sent is the last 12 messages, starting on a question and
without the failure bubbles (`requestMessagesOf`).

The conversation lives in `sessionStorage` under `assistente:{userId}:{storeId}` (another person
signing in on the same tab starts their own): it survives navigation
and reloads, ends with the tab, and never reaches the database. Switching stores shows that
store's conversation; an answer that arrives after the switch is dropped.

There are no attachments and no audio: the only upload in the product is the CSV import.

## Answers (API)

`POST /assistant/messages` (`apps/api/src/modules/assistant`):

1. **Real numbers only.** The model sees only what its tools return: overview KPIs and alerts,
   data sources, the DRE, best-selling products and stock health, sales by channel, customers and
   retention, goals. Each tool needs the area and the screen visible to whoever asks; otherwise it
   answers "no access".
2. **Origin.** The structured answer names an area (overview, orders, products, customers, goals
   or a consulting area) and, for a consulting area, a pillar of the engagement template; the API
   turns it into the label.
3. **Caveats.** Tools carry each KPI's data-quality note, the source statuses ("failing to sync",
   "imported by hand", "not connected") and the cost and stock notices; the model must turn the
   ones its answer depends on into caveats.

Limits: 4 tool rounds, 8 lookups and 60 s per question; 30 questions per store and user and 60
per person every 15 minutes. Without `ANTHROPIC_API_KEY` the API answers 503 and the bubble says
the assistant is not available. Each answered question is recorded as `ASSISTANT_ASKED` with the
areas consulted, never the question.
