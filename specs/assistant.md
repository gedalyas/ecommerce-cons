# Assistente

Two surfaces, one shared state hook (`useAssistant` in
`src/layout/AssistantPanel/AssistantPanel.tsx`):

- **Docked panel** (≥1280px): 360px right column, always visible, collapsible
  to a 56px rail.
- **Drawer / full page** (<1280px): floating "Assistente" button opens a drawer
  from `md`; below `md` it links to the full-screen `/assistente` page
  (`src/features/assistant`).

## Header

"Assistente" plus the current context in smaller text: "Vendo: {context}". The
context follows the route (`contextBySection` in `AssistantPanel/data.ts`),
e.g. `/marketing` → "Vendo: Aquisição".

## Suggested questions

Three per section (`suggestionsBySection`), rendered as buttons that send the
question. Example for `/marketing`: "Por que meu CAC subiu?", "Qual canal está
pior?", "O que fazer primeiro?".

## Conversation

Pre-seeded with 2 Q&A pairs. Assistant answers cite concrete numbers and name
the origin pillar (small label above the bubble, e.g. "Marketing · Aquisição").
One answer ends with the button "Levar para a reunião com o consultor"
(`meeting: true`) — a core product gesture: the assistant feeds the human
consulting session.

Sending any message appends the user text and a **fixed canned reply**
(`fixedReply`) attributed to "Dinheiro · Organização". There is no real AI
integration in the prototype.

## Grounding rules for future integration

When the real assistant lands, answers must:

1. cite actual numbers from the client's data,
2. name the origin pillar of every claim,
3. disclose data-fidelity caveats (e.g. Meta Ads stale for 6 days), and
4. offer the "take to the consultant meeting" action where relevant.
