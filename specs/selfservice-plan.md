# Self-service — invitations by e-mail, password reset, import preview and undo

Status: **approved 2026-09-13, in execution** — board in `selfservice-tasks.md`.

## Why this round

The SaaS round (`saas-plan.md`) made every store a tenant, but a client still cannot use the
product alone: the consultant releases an e-mail on `/admin` and has to tell the person by
hand, a forgotten password has no way out, and a CSV import writes straight into the store —
a wrong column mapping dirties the orders with no way back. This round closes those four
gaps, in the order a real client meets them.

## Decisions (recorded in `decisions/2026-09-13-selfservice-access-and-undoable-imports.md`)

1. **Invitations carry a token and travel by e-mail.** The link `/cadastro?convite=<token>`
   is the proof; `POST /auth/register` requires the token, not just a released e-mail
   (today anyone who knows an invited address could sign up as that person). Tokens are
   random 32 bytes, stored as sha256, expire in 7 days, and the staff can resend (new token,
   new e-mail) from `/admin`.
2. **E-mail goes out through SMTP (nodemailer) with a file outbox in development.**
   `SMTP_URL` + `MAIL_FROM` configure any provider (Resend, SES, Mailtrap, Gmail); without
   `SMTP_URL` in development every message is written to `MAIL_OUTBOX_DIR` (default
   `apps/api/outbox/`, gitignored) so the flow can be exercised locally; production refuses
   to boot without it. The mailer is injected into the routers like `now`.
3. **Password reset by e-mail link.** `POST /auth/password/forgot` always answers 202 (no
   account enumeration) and, when the e-mail exists, sends `/redefinir-senha?token=`; the
   token is single-use, 1 hour, sha256 stored; `POST /auth/password/reset` sets the password
   and revokes every refresh token of the user.
4. **Import preview before writing.** `POST /imports/preview` runs the same pipeline
   (limits → headers → parse → map) and answers counts, the first errors and a sample of the
   mapped rows without touching the tables; the web shows it and the user confirms with
   `POST /imports` (the file is re-sent — 10 MB at most, simpler than parking it server-side).
5. **Undo = LIFO, with snapshots.** While writing, an import records in `import_undo` what it
   touched: created rows (`previous = null`) and the JSON of rows it replaced. Only the most
   recent non-undone job of each kind can be undone (a later import may have overwritten the
   same keys); the snapshots of the three most recent jobs per kind are kept, so undoing
   twice in a row works; older ones are purged when a new job finishes. Undo deletes the created rows and restores the replaced ones; customers and
   products created by an orders import are deleted only when nothing else references them.

## Stages

| Stage | Scope                                                                                      | Workspaces                    |
| ----- | ------------------------------------------------------------------------------------------ | ----------------------------- |
| A0    | Plan, board, decision record                                                               | specs                         |
| A1    | Mail infrastructure: `shared/mail` (SMTP + outbox), env, app-url, pure templates + tests   | api                           |
| A2    | Invitation tokens: schema, e-mail, resend, `/cadastro?convite=`, admin status              | database, api, contracts, web |
| A3    | Password reset: schema, endpoints, e-mail, `/esqueci-senha`, `/redefinir-senha`            | database, api, contracts, web |
| A4    | Import preview: endpoint, contract, two-step `ImportPanel`                                 | api, contracts, web           |
| A5    | Import undo: `import_undo`, recording in the write service, endpoint, "Desfazer" button    | database, api, contracts, web |
| A6    | Docs (`saas.md`, `imports.md`, README, `.env.example`, CLAUDE.md), e2e smoke, board closed | specs                         |

Each stage is one commit (schema stages may split `database` from the rest), checks green
before each: `typecheck`, `lint --max-warnings 15`, `check:cycles -- --max-files 0`, `test`,
`format:check`, `build`, plus the headless-browser flow of the stage.

## Endpoints added

| Method | Path                            | Auth  | Body / query                | Answer                        |
| ------ | ------------------------------- | ----- | --------------------------- | ----------------------------- |
| GET    | `/auth/invitation`              | none  | `?token=`                   | `{ email, role, storeName }`  |
| POST   | `/auth/register`                | none  | `{ token, name, password }` | `{ user, tokens }` (201)      |
| POST   | `/auth/password/forgot`         | none  | `{ email }`                 | 202, always                   |
| POST   | `/auth/password/reset`          | none  | `{ token, password }`       | 204                           |
| POST   | `/admin/invitations/:id/resend` | staff | —                           | `Invitation` (new expiry)     |
| POST   | `/imports/preview`              | store | multipart `file`, `kind`    | `ImportPreview`               |
| POST   | `/imports/:id/undo`             | store | —                           | `ImportJob` (status `UNDONE`) |

## Out of scope (stays in the follow-ups)

OAuth connectors, sync log, store archiving, assistant, sessions per product, OpenAPI.
