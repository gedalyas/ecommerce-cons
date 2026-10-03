# Assistant — tasks

Plan: [assistant-plan.md](assistant-plan.md). One commit per slice.

- [x] C1 Assistant API: `POST /assistant/messages` with read-only tools over the store's data
      (overview, sources, money, products, sales channels, customers, goals), each re-checking
      the user's area and the store's screens; structured answer with origin and caveats; at most
      8 lookups per question (repeats reused), 4 tool rounds and 60 s; 30 questions per store and
      60 per person every 15 min; `ASSISTANT_ASKED` audit without the question (2026-10-03)
- [ ] C2 The real assistant screens: conversation in the browser, period and screen sent,
      staged messages, attachment and audio removed
- [ ] C3 Consultant plan tool and release of the Assistente to new stores
