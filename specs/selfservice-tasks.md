# Self-service — task board

Checklist companion to `selfservice-plan.md`. Tick tasks as they land (`[x]`), add a short
note when something changed along the way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **A0–A2 done, A3 next** — last updated 2026-09-13

---

## A0 — Plan

- [x] `specs/selfservice-plan.md`, this board,
      `decisions/2026-09-13-selfservice-access-and-undoable-imports.md`

## A1 — Mail infrastructure (api)

- [x] `shared/mail/mailer.types.ts` (`Mailer`, `MailMessage`), `smtpMailer.ts` (nodemailer
      over `SMTP_URL`), `outboxMailer.ts` (one `.txt` per message in `MAIL_OUTBOX_DIR`;
      pure `outboxFile.ts` + test), `createMailer(env, now)`
- [x] Env: `APP_URL` (links in e-mails), `MAIL_FROM`, `SMTP_URL` (required when
      `NODE_ENV=production`), `MAIL_OUTBOX_DIR` (default `apps/api/outbox`, gitignored);
      `.env.example` updated
- [x] `mailer` and `appUrl` injected into the auth and admin routers (`app.ts`); the pure
      templates land with their first use (A2 `invitationMail`, A3 `passwordResetMail`)

## A2 — Invitation tokens

- [x] Schema: `Invitation.tokenHash` (unique), `expiresAt`; migration; dev seed unaffected
- [x] API: `createInvitation` issues the token and sends the e-mail; `POST
/admin/invitations/:id/resend`; `GET /auth/invitation?token=` (404 unknown — the hash is cleared on
      acceptance, so a used link is also 404 — 410 expired, 409 accepted-but-hashed); `POST /auth/register` takes `token` (the e-mail comes from the
      invitation); `Invitation` in the admin payload gains `expiresAt`, `status`
      (`PENDING | EXPIRED | ACCEPTED`)
- [x] Contracts: `registerSchema` (`token`, `name`, `password`), `invitationLookupSchema`
      (`token`), `invitationStatuses` + label
- [x] Web: `/cadastro?convite=` reads the token (no e-mail field; a page without a valid
      token explains and links to `/entrar`); `/admin` › Convites shows the status and a
      "Reenviar" action; the created invitation shows "E-mail enviado para …"
- [x] Flow: invite → outbox file has the link → resend rotates it (old link 404) → open →
      register (e-mail read-only) → onboarding; `e2e_invite.mjs` in the scratchpad
- [x] Migration `20260913184500_invitation_tokens` (nullable columns, `migrate diff` +
      `deploy`); `tokens.ts` renames `newRefreshToken`/`hashRefreshToken` to
      `newOpaqueToken`/`hashToken` (shared with invitations and the reset)

## A3 — Password reset

- [ ] Schema: `PasswordReset` (`userId`, `tokenHash` unique, `expiresAt`, `usedAt`);
      migration
- [ ] API: `POST /auth/password/forgot` (rate-limited, 202 always, sends the e-mail when
      the user exists), `POST /auth/password/reset` (token valid and unused → new hash,
      revoke refresh tokens, mark used; 400 otherwise); pure `passwordResetMail`
- [ ] Contracts: `forgotPasswordSchema`, `resetPasswordSchema`
- [ ] Web: `/esqueci-senha` (e-mail → "Se o e-mail existir, enviamos o link"),
      `/redefinir-senha?token=` (new password → sign-in page with a success note); "Esqueci
      minha senha" link on `/entrar`; both public in the root guard
- [ ] Flow: forgot → outbox link → reset → login with the new password; old refresh token
      rejected

## A4 — Import preview

- [ ] Contracts: `ImportPreview` (`kind`, `counts { total, valid, rejected }`, `errors`,
      `columns`, `sample` — first 10 mapped rows as display strings), `IMPORT_PREVIEW_ROWS`
- [ ] API: `POST /imports/preview` (same limiter family, own count; multipart; no write);
      pure `previewRows.ts` (mapped rows → display columns per kind) with tests
- [ ] Web: `ImportPanel` becomes choose → preview (counts, sample table, first errors) →
      "Importar N linhas" → result; cancel returns to the file step
- [ ] Flow: preview a file with a bad row → counts match → confirm → job listed

## A5 — Import undo

- [ ] Schema: `ImportStatus` gains `UNDONE`; `ImportJob.undoneAt`; `ImportUndo` (`jobId`,
      `entity`, `key`, `previous Json?`) with index on `jobId`; migration
- [ ] API: the write service records created/replaced rows per entity (order + items,
      customer, product + variant, ad_spend, traffic) inside the same transaction; after a
      job finishes, undo rows of older jobs of the same kind are purged; `POST
/imports/:id/undo` (only the latest non-undone job of its kind → 409 otherwise) restores
      or deletes, re-stamps data sources when nothing remains, refreshes customers; pure
      `undoPlan.ts` (entries → ordered operations) with tests
- [ ] Contracts: `ImportJob.undoneAt`, `canUndo`; `importStatusLabel.UNDONE = "Desfeita"`
- [ ] Web: "Desfazer" on the job that can be undone (confirm `Dialog`), history shows the
      status
- [ ] Flow: import orders → undo → orders gone, customers without other orders gone, data
      source back to previous status; ad spend replace → undo → previous values back

## A6 — Docs and close

- [ ] `specs/saas.md` (invitation link, password reset), `specs/imports.md` (preview, undo,
      LIFO rule), README and `.env.example` (mail variables, outbox), CLAUDE.md (mailer as a
      dependency, undo rule); e2e script kept in the scratchpad; board closed
