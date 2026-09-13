# 2026-09-13 — Guru as the source of the subscription, a soft gate, a contract that never blocks

## Contexto

Payment goes through Digital Manager Guru and the consulting contract through ZapSign (vendor
decisions of 2026-09-13). The Arko CRM already integrates both
(`specs/reference/arko-integracoes-guru-zapsign.md`); this product needs a far smaller
slice: know whether a store's subscription is alive, let a sale open the door, and get the
contract signed.

## Decisão

1. The product never calls the Guru to ask; it stores every webhook delivery (keyed by the
   Guru id) and derives the subscription state from the last event per e-mail.
2. A subscription is keyed by e-mail and linked to the store when the user creates it. An
   approved, paid sale of a known offer creates the `CLIENT` invitation automatically.
3. Only `CANCELED` blocks a client (403 + `/assinatura-encerrada` with the checkout link);
   `PAST_DUE` warns; `ACTIVE` and **no subscription** allow. Staff are never blocked. An admin
   can grant or end access by hand (`MANUAL` subscription).
4. The contract is created after onboarding, from a ZapSign template, and its status is
   shown — it never blocks access. Without `ZAPSIGN_API_TOKEN` the step is skipped.

## Por quê

- The CRM learned that webhooks must always be stored and answered 200 (a lost 400 means a
  lost sale) and that idempotency by the Guru id is what makes retries harmless.
- Keying by e-mail is the only identity the sale carries that the product also has; CPF
  pairing and offer routing are CRM problems, not this product's.
- "No subscription = allowed" keeps every store created by the staff (pilots, partners, the
  dev seed) working and makes billing a switch the Guru flips, not a migration.
- The Arko app already showed that blocking on the contract only creates support tickets;
  a visible card plus the staff's resend button gets signatures.

## Alternativas descartadas

- **Reading the subscription from the Guru API on login.** Latency and a dependency on
  every request; the CRM does not do it either.
- **Trial/plan logic in the product.** The Guru's offers and cycles already express it; the
  product would duplicate a billing engine.
- **Blocking on a pending contract.** Rejected for the reason above.
