# Decisions

Record of product and technical decisions. One short note per decision.

- One file per decision: `YYYY-MM-DD-short-title.md`.
- Fields: **Context**, **Decision**, **Why**, **Alternatives discarded**.
- Never rewrite an old decision to "fix" it — write a new one that supersedes
  it. The history is the value.

Record a decision only when all of these hold: it changes business,
architecture, data or security; there was a real alternative that was
rejected; the why is not obvious from the code and the commit; someone would
reopen it in ~6 months.
