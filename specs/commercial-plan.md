# Commercial flow — subscription (Guru) and contract (ZapSign)

Status: **draft 2026-09-13, not scheduled** — vendors decided, accounts and credentials not yet
available. This page records the decision and the intended flow so the round can start the
day the credentials exist; nothing below is implemented.

## Decisions (2026-09-13)

- **Payment and subscription: Digital Manager Guru.** Checkout, recurring billing and the
  subscription status live in Guru; the product never handles card data.
- **Contract: ZapSign.** The consulting contract is generated from a template and signed
  electronically; the signed PDF stays in ZapSign, the product keeps the document token and
  the status.

## Intended flow

1. **Sale.** The client buys the plan on a Guru checkout. Guru notifies the API
   (`POST /webhooks/guru`, subscription webhook) with the contact's e-mail and name, the
   product and the subscription status.
2. **Invitation.** On an approved subscription the API creates (or resends) the `CLIENT`
   invitation for that e-mail with "Nova loja" and sends the link — the same path the staff
   uses on `/admin` today, now triggered by the sale.
3. **Contract.** When the client finishes `/configurar-loja`, the API creates the contract in
   ZapSign from the template (`POST /api/v1/models/create-doc/`, prefilled with store and
   client data) and stores `Contract { storeId, zapsignToken, status }`. The client signs
   from the e-mail ZapSign sends; `doc_signed` (`POST /webhooks/zapsign`) marks it signed.
4. **Gate.** `Client.subscription { provider: "guru", externalId, status, currentPeriodEnd }`
   drives access: `ACTIVE`/`TRIAL` → full; `PAST_DUE` → banner; `CANCELLED`/`EXPIRED` → the
   store opens read-only with a "Reativar" link to the checkout. Staff always see the store.
   The contract status appears on `/loja` and on `/admin` (Assinado · Pendente · Recusado).
5. **Admin.** `/admin` › Lojas shows plan, subscription status and contract status; manual
   overrides (grant access without a sale — a pilot, a partner) are a staff action recorded
   in the audit log.

## What each integration needs

| Item                  | Guru                                                                               | ZapSign                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Inbound               | Subscription webhook (statuses selectable in Guru; POST JSON)                      | Webhook per event (`doc_signed`, `doc_refused`, `doc_created`, `doc_deleted`, `email_bounce`)        |
| Validating the origin | **To confirm** in the account (developer docs were unreachable on 2026-09-13)      | Custom headers on the webhook (`POST /api/v1/user/company/webhook/header/`) — a shared secret header |
| Outbound              | API to read a subscription (backfill / reconcile)                                  | `Authorization: Bearer <api token>`; create doc from template, read doc, download signed file        |
| Env                   | `GURU_WEBHOOK_SECRET`, `GURU_API_TOKEN`                                            | `ZAPSIGN_API_TOKEN`, `ZAPSIGN_WEBHOOK_SECRET`, `ZAPSIGN_TEMPLATE_TOKEN`                              |
| Idempotency           | Webhooks retry: key on the subscription id + status + timestamp                    | Key on `token` + `event_type`                                                                        |
| Where it lands        | `apps/api/src/modules/billing` (webhook router, `subscriptionOf`, gate middleware) | `apps/api/src/modules/contracts` (webhook router, `createContract`, status)                          |

## Open questions for the round

- Which Guru statuses map to which access level (trial? "aguardando pagamento"?).
- One product per plan or one product with variants; whether the consultancy sells annual
  plans with a different checkout.
- Whether the contract is signed **before** onboarding (blocks the store) or after (blocks
  only the connectors) — the flow above assumes after.
- Sandbox: ZapSign has one (`sandbox: true` in payloads); Guru to confirm.

## Sources

- ZapSign: how webhooks work, create webhook (with headers), events —
  <https://docs.zapsign.com.br/webhooks/como-funciona>,
  <https://docs.zapsign.com.br/webhooks/criar-webhook>,
  <https://docs.zapsign.com.br/webhooks/eventos>
- Guru: <https://docs.digitalmanager.guru/> (developer pages returned 404 on 2026-09-13)
