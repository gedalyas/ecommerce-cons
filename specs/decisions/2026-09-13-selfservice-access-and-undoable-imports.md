# 2026-09-13 — Invitations by tokenised e-mail, SMTP with a file outbox, undo by LIFO snapshots

## Contexto

After the SaaS round a client cannot reach the product without the consultancy telling them
by hand that their e-mail was released, a forgotten password has no recovery, and a CSV
import writes straight into the store. `specs/selfservice-plan.md` closes those gaps; three
of its choices deserve a record.

## Decisão

1. **An invitation is a token sent by e-mail, and registering requires it.** The
   `Invitation` row keeps a sha256 of a random 32-byte token and an expiry (7 days); the
   e-mail carries `/cadastro?convite=<token>`; `POST /auth/register` takes the token and
   derives the e-mail from it. The staff can resend, which rotates the token.
2. **Mail is sent through SMTP (nodemailer) configured by `SMTP_URL`, and in development
   without it every message is written as a file to `MAIL_OUTBOX_DIR`.** Production refuses
   to boot without `SMTP_URL`. The mailer is a dependency injected into the routers.
3. **An import can be undone only while it is the most recent job of its kind, using
   snapshots taken while writing.** `import_undo` keeps, per touched row, `previous = null`
   (created) or the JSON of the row it replaced; undo deletes or restores. When a newer job
   of the same kind finishes, the undo rows of the older ones are purged.

## Por quê

- Without a token, releasing an e-mail is the whole proof: anyone who knows the address of an
  invited person can sign up as them (the register page even confirmed the store's name).
  The link in the inbox is the standard proof of ownership and costs one column.
- SMTP is the one interface every provider offers; a vendor SDK would tie the repo to a
  service before one is chosen. The file outbox keeps the flow testable offline (the e2e
  reads the link from the file) and lets a developer see the message without a mail account.
- A full undo of any past import needs either an event log or per-import snapshots plus
  conflict detection between overlapping imports. LIFO makes "restore what this import
  replaced" exactly right, because nothing newer touched those keys; the purge keeps storage
  bounded to one job's snapshots per kind (≤ 50 000 rows, the parse cap).

## Alternativas descartadas

- **Keep the e-mail lookup on `/cadastro` and only notify.** Same security hole, one more
  e-mail; rejected.
- **Magic-link login instead of passwords.** Changes the auth model for web and the coming
  mobile app; the reset link solves the actual problem.
- **Provider SDK (Resend, SES).** Revisit when a provider is chosen and SMTP proves limiting
  (templates, webhooks for bounces).
- **Undo any job by replaying later imports.** Needs every original file kept and re-run;
  far more machinery than the case warrants.
- **Undo only created rows, keep overwritten ones.** Cheap but wrong: an import that
  replaced a month of ad spend would leave the wrong month after "undo".
