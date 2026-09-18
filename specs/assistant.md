# Assistente

Two surfaces, one shared state hook (`useAssistant` in
`src/modules/assistant/AssistantPanel.tsx`):

- **Docked panel** (≥1280px): 288px right column, always visible, collapsible
  to a 56px rail.
- **Drawer / full page** (<1280px): floating "Assistente" button opens a drawer
  from `md`; below `md` it links to the full-screen `/assistente` page
  (`src/modules/assistant/Assistant.tsx`).

## Header

"Assistente" plus the current context in smaller text: "Vendo: {context}". The
context follows the route (`contextBySection` in `AssistantPanel/data.ts`),
e.g. `/marketing` → "Vendo: Aquisição".

## Conversation

Pre-seeded with 2 Q&A pairs. Assistant answers cite concrete numbers and name
the origin pillar (small label above the bubble, e.g. "Marketing · Aquisição").
The panel shows no suggested questions and no "take to the meeting" action:
the assistant answers; it does not hand work to the consultant.

Sending any message appends the user text and a **fixed canned reply**
(`fixedReply`) attributed to "Dinheiro · Organização". There is no real AI
integration in the prototype.

## Grounding rules for future integration

When the real assistant lands, answers must:

1. cite actual numbers from the client's data,
2. name the origin pillar of every claim,
3. disclose data-fidelity caveats (e.g. Meta Ads stale for 6 days).
