# Assistant — tasks

Plan: [assistant-plan.md](assistant-plan.md). One commit per slice.

- [x] C1 Assistant API: `POST /assistant/messages` with read-only tools over the store's data
      (overview, sources, money, products, sales channels, customers, goals), each re-checking
      the user's area and the store's screens; structured answer with origin and caveats; at most
      8 lookups per question (repeats reused), 4 tool rounds and 60 s; 60 questions per store and
      40 per person every 15 min (store cap made store-wide in C3); `ASSISTANT_ASKED` audit without the question (2026-10-03)
- [x] C2 The real assistant screens: one conversation per person and store in
      `sessionStorage`, shared by panel, drawer and `/assistente` (`AssistantProvider` in the
      root); period, channel and screen sent; suggestions per screen, origin, caveats, typing,
      "Limpar", Portuguese failure bubbles (invalid period checked before sending, 503 kept);
      staged messages, attachment and audio removed; composer shadow promoted to
      `shadowClass.raisedTop` (2026-10-03)
- [x] C3 Consultant plan tool and release of the Assistente to new stores: `consultant_plan`
      (pillar status, the consultant's indicators and notes, open recommendations, milestone
      criteria) for the consulting areas the user can see; `defaultReleasedScreens` is every
      screen; decision `2026-10-03-assistant-answers-from-read-only-tools.md` (2026-10-03)
