# Commercial — task board

Checklist companion to `commercial-plan.md`. Tick tasks as they land (`[x]`), add a short
note when something changed along the way. Keep this file and the plan in sync.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped

Status: **B0–B2 done, B3 next** — last updated 2026-09-13

---

## B0 — Plan

- [x] `specs/commercial-plan.md` rewritten from the Arko reference
      (`reference/arko-integracoes-guru-zapsign.md`), this board,
      `decisions/2026-09-13-billing-gate-and-contract.md`

## B1 — Schema and env

- [x] `GuruWebhook` (`guruId` unique, `kind` SELL|SUBSCRIPTION, `email`, `status`,
      `invoiceStatus?`, `payload`, `processedAt?`, `createdAt`)
- [x] `Subscription` (`email` unique, `clientId?` unique, `source` GURU|MANUAL, `status`
      ACTIVE|PAST_DUE|CANCELED, `guruSubscriptionId?`, `planName?`, `contactName?`,
      `amount?`, `installments?`, `startedAt?`, `currentPeriodEnd?`, `canceledAt?`,
      `lastEventAt`)
- [x] `Contract` (`clientId` unique, `zapsignToken` unique, `signerToken?`, `signerEmail`,
      `status` PENDING|SIGNED|REFUSED|DELETED|EXPIRED, `signedAt?`, `signedFileUrl?`,
      `payload`, `createdAt`, `updatedAt`)
- [x] Env (`GURU_*`, `ZAPSIGN_*`), `.env.example`, migration `20260913210000_billing`; the
      dev `.env` carries dummy `GURU_ACCOUNT_TOKEN` / `ZAPSIGN_WEBHOOK_SECRET` so simulated
      webhooks can be exercised

## B2 — Guru webhooks

- [x] Contracts `billing/`: closed sets + labels (`subscriptionStatuses`,
      `contractStatuses`), `BillingScreen`, permissive zod for the two payloads (raw or
      envelope)
- [x] API `modules/billing`: public router mounted before `requireAuth`; `assertAccountToken`;
      `guruWebhookStore` (upsert by guru id); pure `guruSaleRules.ts` (approved+paid of a
      known offer → ACTIVE; pastdue → PAST_DUE; refund/chargeback/canceled → CANCELED;
      otherwise ignored) with tests; `applySubscriptionEvent` (upsert by e-mail, link to
      the store of the user with that e-mail); automatic `CLIENT` invitation when no user
      exists (mailer injected); audit events with a system actor ("Guru")
- [x] Flow (`e2e_guru.mjs`): 401 without/with a wrong token, 422 without id; approved sale in
      the envelope → invitation in the outbox → register → onboarding → `/billing` shows the
      GURU subscription linked to the new store; retry of the same id sends nothing; pastdue
      invoice → PAST_DUE; cancellation webhook → CANCELED; a new approved transaction →
      ACTIVE again without a second invitation; every step in the activity log as "Guru"
- [x] Audit gains a system actor (`actorRole` nullable); `auth` no longer imports billing —
      `afterRegister` is injected from `app.ts` (a cycle auth → billing → admin → auth showed
      up and was broken there); schema errors answer 422 (the API's validation status), not
      400 as the plan said

## B3 — Gate and screens

- [ ] `resolveClient`: CLIENT with a CANCELED subscription → 403 "Assinatura encerrada";
      `StoreSummary.access` (`ACTIVE | PAST_DUE | CANCELED | NONE`)
- [ ] Web: root guard → `/assinatura-encerrada` (checkout link, sign out); PAST_DUE banner
      in the shell; `/loja` › Assinatura block; `/admin` › Lojas column (status, plan,
      period end) + "Liberar acesso" / "Encerrar acesso" (admin, audited)
- [ ] Flow: cancel → client blocked → admin grants → client back → Guru re-approval →
      GURU subscription active again

## B4 — ZapSign contract

- [ ] API `modules/contracts`: `zapsignClient(env)` (create doc from template, get doc,
      resend signer e-mail; disabled without token), pure `contractDocRequest.ts`
      (variables: name, e-mail, store, plan, value, installments, signature date) with
      tests, `createContractForStore` called after `createStore` when a GURU subscription
      exists, webhook `POST /webhooks/zapsign` (`x-webhook-secret`, timing-safe) upserting
      by token, `ContractSummary` in `/billing` and `AdminStore`
- [ ] Web: dismissable "Assine seu contrato" card on the dashboard (signing link), `/loja`
      status, `/admin` column + "Reenviar e-mail"
- [ ] Flow with a local ZapSign stub: onboarding creates the doc (request shape checked) →
      card shows → simulated `doc_signed` → status Assinado

## B5 — Docs and close

- [ ] `specs/saas.md` (billing, contract), README/`.env.example`, CLAUDE.md (public
      webhooks rule), board closed; e2e scripts in the scratchpad
