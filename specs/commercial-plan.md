# Commercial flow — subscription (Guru) and contract (ZapSign)

Status: **paused after B2 (2026-09-13)** — the Guru webhooks and the subscription model are in; the gate, the screens and the ZapSign contract wait for the decision on a separate CRM project. Board in `commercial-tasks.md`. Vendor
behaviour taken from the Arko CRM integration, documented in
`reference/arko-integracoes-guru-zapsign.md` (webhook shapes, validation, retries).

## Decisions

Recorded in `decisions/2026-09-13-billing-gate-and-contract.md`:

1. **Guru is the source of truth for the subscription; the product only listens.** Two
   public webhooks, `POST /webhooks/guru/sells` (every transaction) and
   `POST /webhooks/guru/subscriptions` (cancellation), validated by the Account Token the
   Guru sends in the body (`api_token` = `GURU_ACCOUNT_TOKEN`), accepting the raw payload or
   the `{ payload, … }` envelope. Every delivery is stored in `guru_webhook` keyed by the
   Guru id (transaction or `sub_…`), so retries never duplicate. Answers: 200 stored, 422
   schema, 401 token, 500 unexpected (the Guru retries on 500).
2. **A subscription belongs to an e-mail first and to a store later.** `Subscription`
   (`email` unique, `clientId?`, status, plan, dates, source `GURU | MANUAL`). An approved and
   paid sale of a known offer (`GURU_OFFER_IDS`, empty = any) creates or reactivates it and,
   when no user exists for the e-mail, creates the `CLIENT` invitation ("Nova loja") and
   sends the link — the sale replaces the staff's manual invite. Registration and store
   creation link the subscription to the user's store.
3. **Gate: cancelled blocks, past due warns, nothing else does.** `CANCELED` (refund,
   chargeback or cancellation) → the client's store answers 403 and the web shows
   `/assinatura-encerrada` with the checkout link (`GURU_CHECKOUT_URL`); `PAST_DUE` →
   a banner in the shell; `ACTIVE` or **no subscription** → full access (stores created by
   the staff — pilots, partners, the dev seed — keep working). Staff are never blocked. An
   admin can grant or end access by hand (a `MANUAL` subscription, audited).
4. **The contract never blocks.** After the client finishes `/configurar-loja`, if the store
   has a Guru subscription the API creates the contract in ZapSign from the template
   (`POST /api/v1/models/create-doc/`, variables from user, store and sale) and stores
   `Contract` (`zapsignToken`, `signerToken`, status). ZapSign e-mails the signer; the web
   shows a dismissable "Assine seu contrato" card with the signing link
   (`https://app.zapsign.com.br/verificar/<signerToken>`) until `doc_signed` arrives on
   `POST /webhooks/zapsign` (header `x-webhook-secret`, timing-safe compare). Staff see the
   contract status per store and can resend the e-mail. Without `ZAPSIGN_API_TOKEN` the step
   is skipped (development).

## Stages

| Stage | Scope                                                                                                                                           | Workspaces          |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| B0    | Plan, board, decision; the Arko reference filed                                                                                                 | specs               |
| B1    | Schema: `guru_webhook`, `subscription`, `contract` + enums; env; migration                                                                      | database, api       |
| B2    | Guru webhooks: routers, token check, envelope, store, pure sale rules, subscription upsert, automatic invitation, audit                         | api, contracts      |
| B3    | Gate and screens: `resolveClient` block, shell banner, `/assinatura-encerrada`, `/admin` subscription column + grant/end access, `/loja` status | api, contracts, web |
| B4    | ZapSign: client, contract creation on onboarding, webhook, resend; web card, `/loja` and `/admin` status                                        | api, contracts, web |
| B5    | Docs, e2e with simulated webhooks and a ZapSign stub, board closed                                                                              | specs               |

## Endpoints added

| Method | Path                                | Auth       | Answer                                                  |
| ------ | ----------------------------------- | ---------- | ------------------------------------------------------- |
| POST   | `/webhooks/guru/sells`              | body token | 200 `{ received: true }`                                |
| POST   | `/webhooks/guru/subscriptions`      | body token | 200 `{ received: true }`                                |
| POST   | `/webhooks/zapsign`                 | header     | 200 `{ received: true }`                                |
| GET    | `/billing`                          | store      | `BillingScreen { subscription, contract, checkoutUrl }` |
| PUT    | `/admin/stores/:id/access`          | admin      | `{ granted: boolean }` → `AdminStore`                   |
| POST   | `/admin/stores/:id/contract/resend` | staff      | `ContractSummary`                                       |

## Env

```
GURU_ACCOUNT_TOKEN=            # required to accept Guru webhooks (401 otherwise)
GURU_OFFER_IDS=                # comma list; empty accepts any offer
GURU_CHECKOUT_URL=             # "Reativar" link on /assinatura-encerrada
ZAPSIGN_API_TOKEN=             # empty = contract step skipped
ZAPSIGN_API_BASE_URL=https://api.zapsign.com.br
ZAPSIGN_TEMPLATE_ID=
ZAPSIGN_WEBHOOK_SECRET=
ZAPSIGN_SANDBOX=false
```

## Out of scope

Offer routing by plan type, CPF pairing, split payments and follow-up pendencies (Arko CRM
concerns), Guru API calls (the CRM only uses them to change a contact's e-mail), Slack.
