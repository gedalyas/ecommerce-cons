# Integrações Guru (pagamento/assinatura) e ZapSign (assinatura de contrato)

Guia de replicação, levantado do código do `crm_backend` em 2026-09-13. Toda a integração vive
num único serviço (`crm_backend`, Express + Prisma/Postgres); o `arko_backend` só consome o
status do contrato por uma API interna. Caminhos abaixo são relativos a `crm_backend/`.

Os JSONs de exemplo foram **reconstruídos a partir do schema Zod, das projeções SQL e dos
fixtures de teste** — são os campos que o código lê, com valores fictícios. Não são dumps do
banco.

---

## 1. Guru (Digital Manager Guru)

### 1.1 Recepção do webhook

Duas rotas, montadas em `src/index.ts` sob `/api/webhooks` (`app.use('/api/webhooks', createGuruWebhookRouter())`):

| Rota                               | Evento no painel do Guru                                       | Schema Zod                                                  | Controller                                                      | Service                                                      |
| ---------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ |
| `POST /api/webhooks/sells`         | Vendas (toda transação: adesão, mensalidade, reembolso…)       | `src/modules/subscription/guruWebhookSchema.ts`             | `src/modules/subscription/guruSellWebhookController.ts`         | `src/modules/subscription/guruWebhookService.ts`             |
| `POST /api/webhooks/subscriptions` | Assinaturas — configurado **somente** com o evento "Cancelada" | `src/modules/subscription/guruSubscriptionWebhookSchema.ts` | `src/modules/subscription/guruSubscriptionWebhookController.ts` | `src/modules/subscription/guruSubscriptionWebhookService.ts` |

Router: `src/modules/subscription/guruWebhookRouter.ts`.

**Formato aceito.** O Guru pode mandar o payload "cru" ou embrulhado num envelope
`{ attempts, connection, payload, queue, request_id, return, url }`. Os dois schemas aceitam
ambos (`z.union`), e o controller/transform desembrulha (`req.body.payload || req.body`).

**Validação da origem — token no corpo.** Não há header nem segredo na URL. O Guru envia o
_Account Token_ da conta no campo `api_token` do payload; o service compara com a env
`GURU_ACCOUNT_TOKEN` (`src/modules/subscription/guruAccountToken.ts`):

- `api_token` ausente → `401 "Account Token não fornecido no webhook."`
- env ausente → `500`
- diferente → `401 "Account Token inválido."`

A comparação é `!==` simples (não é timing-safe, diferente do ZapSign).

**Pipeline do Express antes do handler** (`src/index.ts`): `helmet`, `cors`,
`express.json({ limit: '8mb', inflate: false })` (corpo comprimido responde 415), sanitizador
XSS global (`src/shared/middlewares/xssMiddleware.ts` — roda também nos webhooks),
`validateForm(schema)` (Zod; falha = `400` e o webhook é perdido — por isso os schemas são
permissivos, com `.passthrough()` e quase tudo opcional).

**Códigos de resposta** (decisão em `docs/decisions/2026-08-13-webhook-dedicado-de-assinaturas-do-guru.md`):
`200` para tudo que foi persistido (mesmo sem cliente correspondente), `400` só se o schema
mínimo falhar, `401` token inválido, `500` erro inesperado — o Guru reenvia em 500, e falhas
repetidas desativam o webhook no painel.

### 1.2 Retries e idempotência

Tabela `guru_webhooks` (model `GuruWebhook`, `prisma/schema.prisma`):

```prisma
model GuruWebhook {
  id             String    @id @default(uuid())
  guruId         String    @unique            // id da transação (vendas) ou da assinatura (sub_…)
  contactEmail   String
  status         String                       // status da transação ou last_status da assinatura
  invoiceStatus  String?                      // invoice.status (só vendas)
  payload        Json                         // payload inteiro, como chegou
  processed      Boolean   @default(false)
  refundReason   String?
  refundedAt     DateTime?                    // data da saída (reembolso/cancelamento)
  exitType       ExitType?                    // ADESAO | ACOMPANHAMENTO
  revertedAt     DateTime?                    // saída revertida pelo admin / recompra
  refundSellerId String?
  dismissed      Boolean   @default(false)    // "desconsiderar" no painel de reembolsos
  createdAt / updatedAt
}
```

Mecânica (`src/modules/subscription/guruWebhookStoreService.ts`):

1. `upsertByGuruId(payload.id)` — se já existe uma linha com o mesmo `guru_id`, **atualiza**
   `status`, `invoiceStatus` e `payload` e devolve `wasProcessed` (o valor antigo de `processed`).
   Retry do Guru com o mesmo id nunca duplica linha.
2. `processExit` roda **em toda entrega** (reembolso/chargeback pode chegar como update de um id
   que já era `approved`). É idempotente: preserva `refundedAt` já gravado, não inativa cliente
   já `INACTIVE`, e respeita `revertedAt` (saída revertida pelo admin não é reaplicada).
3. O fluxo de criação de cliente/contrato só roda se `!isExit && !wasProcessed`; ao terminar,
   `markProcessed`. `409` na criação do cliente (já existe) também marca processado.
4. Webhook de assinatura: o `guru_id` é o id da assinatura (prefixo `sub_`), estável pela vida
   toda — um re-cancelamento cai na **mesma linha**. Regra em
   `guruSubscriptionCancellationResolver.ts`: se `dates.canceled_at` > `revertedAt`, é churn
   novo (reativa a linha, limpa `revertedAt`/`dismissed`); senão é re-entrega velha e é ignorada.

Não há checagem de `request_id`/`attempts` do envelope nem verificação de ordem de chegada além
da acima.

### 1.3 Exemplo — webhook de venda (`/sells`)

Campos que o código lê estão comentados; o resto vai inteiro para `payload` (Json).

```jsonc
{
  "api_token": "<GURU_ACCOUNT_TOKEN>", // validação de origem
  "id": "9f1c2a3b-1111-4222-8333-444455556666", // guru_id (idempotência)
  "webhook_type": "transaction",
  "status": "approved", // approved | refunded | chargeback | waiting_payment | …
  "contact": {
    "id": "9e00aaaa-bbbb-4ccc-8ddd-eeeeffff0000",
    "name": "Ana Lima",
    "email": "ana.lima@exemplo.com", // chave de agrupamento (contact_email)
    "doc": "123.456.789-09", // CPF — identidade alternativa
    "phone_local_code": "11",
    "phone_number": "11999990000",
    "address": "Rua das Flores",
    "address_number": "100",
    "address_comp": "Apto 12",
    "address_district": "Centro",
    "address_city": "São Paulo",
    "address_state": "SP",
    "address_state_full_name": "São Paulo",
    "address_zip_code": "01000-000",
    "address_country": "BR",
  },
  "product": { "offer": { "id": "<offer-uuid>" } },
  "items": [
    {
      "offer": { "id": "9fdc9bd1-fee9-4117-908a-5862f2d44e0e" }, // items[0].offer.id é a oferta usada no roteamento
      "total_value": 3000,
    },
  ],
  "payment": {
    "total": 3000, // valor do contrato / adesão
    "installments": { "qty": 5 }, // texto de parcelamento no contrato
    "refuse_reason": null, // motivo de recusa (tela Mensalidades)
  },
  "invoice": {
    "status": "paid", // paid | waiting_payment | pastdue
    "cycle": 1, // >1 = cobrança recorrente
    "value": 299.9,
    "charge_at": "2026-05-17", // vencimento da fatura
    "period_end": "2026-06-17", // fim do período coberto
    "try": 1, // tentativa atual
    "tries": 4, // limite de tentativas
  },
  "subscription": {
    "id": "sub_ABC123", // identidade da assinatura (DISTINCT ON)
    "name": "Acompanhamento Individual",
    "last_status": "active", // active | pastdue | canceled | inactive
    "last_status_at": "2026-05-17T14:04:57Z",
    "charged_times": 1, // >1 = recorrente
    "charged_every_days": 30,
    "started_at": "2026-05-17T14:04:57Z", // início da assinatura
  },
  "dates": {
    "created_at": "2026-05-17T14:04:57Z", // data da transação
    "canceled_at": null, // data de cancelamento (quando houver)
  },
}
```

Datas usadas: `subscription.started_at` / `dates.started_at` / `dates.created_at` (início —
pega a mais antiga, `getSubscriptionPurchaseDateFromPayload`), `invoice.charge_at` (vencimento
do ciclo), `dates.canceled_at` (cancelamento). "Próximo vencimento" **não vem do payload**: é
calculado em `subscriptionPaymentRules.ts` → `resolveNextChargeAt` (`charge_at + 4 dias × tentativa`
enquanto `try < tries`; senão `charge_at + 1 mês`).

### 1.4 Exemplo — webhook de assinatura (`/subscriptions`, evento "Cancelada")

```jsonc
{
  "api_token": "<GURU_ACCOUNT_TOKEN>",
  "id": "sub_ABC123", // guru_id = id da assinatura
  "webhook_type": "subscription",
  "last_status": "canceled", // só 'canceled' é processado
  "cancel_at_cycle_end": false,
  "cancel_reason": "Cliente pediu cancelamento",
  "cancelled_by": {
    "name": "Backoffice",
    "email": "ops@exemplo.com",
    "date": "2026-08-14T22:07:36Z",
  },
  "dates": {
    "started_at": "2026-03-24T15:00:15Z",
    "canceled_at": "2026-08-14T22:07:36Z", // vira refunded_at
  },
  "subscriber": { "name": "Ana Lima", "email": "ana.lima@exemplo.com" }, // fallback de email
  "last_transaction": {
    "contact": { "email": "ana.lima@exemplo.com" }, // email preferido (bate com as linhas de venda)
  },
  "product": { "offer": { "id": "<offer-uuid>" } },
}
```

Só `id` é obrigatório no schema.

### 1.5 Status do Guru → estado interno

**Transação (`status` do `/sells`)** — `guruSaleRouting.ts`, `guruWebhookPayload.ts`, `guruWebhookConfig.ts`:

| `status`                               | `invoice.status`                     | O que acontece                                                                                                                                                                      |
| -------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approved`                             | `paid` ou ausente                    | Venda válida → roteia por oferta (adesão / acompanhamento / ignorada). Cliente vira/continua `FinancialStatus.ACTIVE`.                                                              |
| `approved`                             | outro (`waiting_payment`, `pastdue`) | `GuruSaleKind.IGNORED` — só armazenado (alimenta a tela Mensalidades).                                                                                                              |
| `refunded`, `chargeback`               | —                                    | `ExitType.ADESAO`; cliente → `INACTIVE`, tasks pendentes canceladas. **Exceto** se a oferta for de acompanhamento (`GURU_FOLLOW_UP_OFFER_IDS`): estorno de mensalidade não é saída. |
| qualquer                               | —                                    | Se `subscription.last_status === 'canceled'` no snapshot → `ExitType.ACOMPANHAMENTO`, cliente → `INACTIVE`.                                                                         |
| demais (`waiting_payment`, `refused`…) | —                                    | Armazenado, `IGNORED`.                                                                                                                                                              |

Constantes: `GURU_APPROVED_STATUS = 'approved'`, `GURU_PAID_INVOICE_STATUS = 'paid'`,
`GuruRefundStatus { REFUNDED='refunded', CHARGEBACK='chargeback' }`.

**Roteamento por oferta (`classifyGuruSale`)**:

| Condição                                                                    | `GuruSaleKind` | Efeito                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items[0].offer.id` ∈ `GURU_FOLLOW_UP_OFFER_IDS` ou `GURU_COUPLE_OFFER_IDS` | `FOLLOW_UP`    | Casal → marca `isCouple`. Recorrente (`invoice.cycle>1` ou `charged_times>1`) ou pagador terceiro conhecido → só marca processado. 1ª cobrança sem cliente → pendência `DIRECT_PIX_FOLLOWUP`; com cliente → tenta despachar contrato. |
| oferta fora das listas e `contact.doc` presente                             | `ADHESION`     | Cliente existe por CPF → atualiza cep/endereço, reativa se `INACTIVE`. Não existe → cria cliente (se `isAdhesionOffer` e `payment.total`), senão pendência `SPLIT_PAYMENT`.                                                           |
| sem oferta ou sem CPF                                                       | `IGNORED`      | —                                                                                                                                                                                                                                     |

`PlanType`: oferta ∈ `GURU_RESIDENT_PLAN_IDS` → `RESIDENT`, senão `NORMAL`.

**Assinatura (`subscription.last_status`)** — `guruSubscriptionStatus.ts`, `subscriptionPaymentRules.ts`:

| `last_status`                 | `SubscriptionPaymentStatus` (tela Mensalidades) | Webhook dedicado `/subscriptions`                               |
| ----------------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| `active`                      | `UP_TO_DATE`                                    | salvo, não processado                                           |
| `pastdue`                     | `OVERDUE`                                       | salvo, não processado                                           |
| `canceled`                    | `CANCELED`                                      | `ExitType.ACOMPANHAMENTO`, cliente `INACTIVE`, tasks canceladas |
| `inactive`                    | `CANCELED`                                      | salvo, não processado                                           |
| cliente ACTIVE sem assinatura | `NO_SUBSCRIPTION`                               | —                                                               |

O status de mensalidade **não é persistido**: é derivado na leitura por
`DISTINCT ON (payload->'subscription'->>'id') … ORDER BY created_at DESC`
(`src/modules/subscription/subscriptionQueryService.ts`). Regras completas em
`docs/regras-tela-mensalidades.md` e `docs/regras-tela-reembolsos.md`.

### 1.6 Chamadas à API do Guru

`src/modules/subscription/guruApiService.ts` + `guruApiConfig.ts` + `guruApiErrorMapper.ts`.

- Base URL: `GURU_API_BASE_URL` (default `https://digitalmanager.guru/api/v2`)
- Auth: `Authorization: Bearer <GURU_API_TOKEN>` (token de API, diferente do Account Token do webhook)
- Timeout 30 s (AbortController); erro HTTP → `502`, timeout → `504`, rede → `503`

| Método/endpoint               | Para quê                                                                                                                                                                | Chamado por                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `GET /contacts?email=<email>` | Localizar o contato do cliente (resposta `{ data: GuruContact[] }`)                                                                                                     | `src/modules/client/clientEmailChangeService.ts` → `propagate` |
| `PUT /contacts/{id}`          | Trocar o e-mail do contato quando o CRM edita o e-mail do cliente. Body: `{ name, email, doc, phone_local_code, phone_number, address_country }` (country default `BR`) | idem                                                           |

Só isso — o CRM **não** consulta vendas/assinaturas na API; tudo vem por webhook.

### 1.7 Variáveis de ambiente (Guru)

| Env                  | Uso                                                                    |
| -------------------- | ---------------------------------------------------------------------- |
| `GURU_ACCOUNT_TOKEN` | Account Token que o Guru envia em `api_token`; valida os dois webhooks |
| `GURU_API_TOKEN`     | Bearer da API v2 (troca de e-mail do contato)                          |
| `GURU_API_BASE_URL`  | Opcional; default `https://digitalmanager.guru/api/v2`                 |

Listas de ofertas (adesão, acompanhamento individual/casal, residente) estão **hardcoded** em
`guruWebhookConfig.ts` e `src/modules/contract/zapsignConfig.ts` — outro projeto precisa dos
próprios IDs de oferta.

---

## 2. ZapSign

### 2.1 Criação do contrato

Modelo: **template + variáveis** (não há upload de PDF). Serviço:
`src/modules/contract/zapsignService.ts`; builder do payload: `zapsignCreateDocRequest.ts`;
tipos: `zapsign.types.ts`; template e ofertas elegíveis: `zapsignConfig.ts`.

`POST https://api.zapsign.com.br/api/v1/models/create-doc/`, header
`Authorization: Bearer <ZAPSIGN_API_TOKEN>`, timeout 15 s:

```jsonc
{
  "template_id": "<ZAPSIGN_CONTRACT_TEMPLATE_ID>", // constante em zapsignConfig.ts
  "sandbox": false, // ZAPSIGN_SANDBOX = false (constante, não env)
  "signer_name": "Ana Lima",
  "signer_email": "ana.lima@exemplo.com",
  "send_automatic_email": true, // ZapSign envia o link por e-mail
  "send_automatic_whatsapp": false,
  "lang": "pt-br",
  "external_id": "crm:<template_id>:<cpf só dígitos | email>", // buildExternalId — chave de recuperação
  "data": [
    { "de": "{{name}}", "para": "Ana Lima" },
    { "de": "{{email}}", "para": "ana.lima@exemplo.com" },
    { "de": "{{phone}}", "para": "11999990000" },
    { "de": "{{address}}", "para": "Rua das Flores" },
    { "de": "{{addressNumber}}", "para": "100" },
    { "de": "{{addressComplement}}", "para": "Apto 12" },
    { "de": "{{neighborhood}}", "para": "Centro" },
    { "de": "{{cep}}", "para": "01000-000" },
    { "de": "{{municipality}}", "para": "São Paulo" },
    { "de": "{{state}}", "para": "SP" },
    { "de": "{{cpf}}", "para": "123.456.789-09" },
    { "de": "{{contractValue}}", "para": "3.000,00" },
    { "de": "{{contractValueText}}", "para": "três mil reais" },
    { "de": "{{monthlyValue}}", "para": "299,90" },
    { "de": "{{monthlyValueText}}", "para": "duzentos e noventa e nove reais e noventa centavos" },
    { "de": "{{installmentsText}}", "para": "em 5 parcelas" },
    { "de": "{{signatureDate}}", "para": "13 de setembro de 2026" }, // pt-BR, America/Sao_Paulo
  ],
}
```

Fontes dos valores: `contractValue` = `payment.total` da adesão; `installments` =
`payment.installments.qty` (default 1); `monthlyValue` vem do plano de acompanhamento
(`followUpPlanConfig.ts`: `INDIVIDUAL` = 299,90, `COUPLE` = 499,90); contato mapeado do
`contact` do Guru por `guruContactMapper.ts`. Formatação em
`src/shared/utils/currencyUtils.ts` e `installmentsUtils.ts`.

**Retry.** `MAX_CREATE_RETRIES = 2`, backoff `min(1000·2^n, 4000)` ms, só para status
`408/429/500/502/503/504` ou erro de rede (`zapsignFailure.ts`). Antes de cada retry, lista a
página 1 de `GET /api/v1/docs/?page=1&sort_order=desc` e procura `external_id` igual — se o doc
já foi criado, devolve-o em vez de duplicar.

**Como o signatário recebe o link.** Pelo e-mail automático do ZapSign
(`send_automatic_email: true`). O CRM também monta a URL de assinatura por conta própria:
`https://app.zapsign.com.br/verificar/<signerToken>` (`externalContractController.ts`), onde
`signerToken` = `signers[0].token` (vem na resposta de criação/no webhook; se faltar, busca em
`GET /api/v1/docs/{token}/` e grava — `ContractService.fetchAndSaveSignerToken`).

Outras chamadas:

| Endpoint                                                                 | Para quê                                                                                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/docs/{docToken}/`                                           | Detalhe do documento (signers, status); reparo de `signer_email = unknown` (`contractSignerRepairService.ts`) |
| `GET /api/v1/docs/?page=N&sort_order=desc`                               | Listagem (recuperação por `external_id`)                                                                      |
| `POST /api/v1/signers/{signerToken}/` `{ "send_automatic_email": true }` | Reenviar e-mail ao signatário pendente (`POST /api/contracts/resend-email` e `/mine/resend-email`)            |

### 2.2 Webhook

Rota `POST /api/webhooks/zapsign` (`zapsignWebhookRouter.ts` → `zapsignWebhookController.ts`).
Sem Zod.

**Validação da origem:** header customizado `x-webhook-secret`, configurado no painel do
ZapSign, comparado com `ZAPSIGN_WEBHOOK_SECRET` via `matchesSecret`
(`src/shared/utils/secretComparison.ts`: SHA-256 dos dois lados + `timingSafeEqual`). Falha → `401`.

**Eventos:** `doc_created`, `doc_signed`, `doc_refused`, `doc_deleted`, `doc_expired` são
processados; qualquer outro `event_type` → `200 "Evento ignorado."`; sem `event_type` → `400`.
Erro interno → `500`.

Exemplo de `doc_signed` (campos lidos por `zapsignContractRecord.ts`):

```jsonc
{
  "event_type": "doc_signed",
  "token": "a1b2c3d4-0000-4000-8000-1234567890ab", // zapsign_token (chave única)
  "open_id": 12345,
  "name": "Contrato de Consultoria - Ana Lima",
  "status": "signed", // pending | signed | refused | …
  "original_file": "https://zapsign.s3.amazonaws.com/.../original.pdf",
  "signed_file": "https://zapsign.s3.amazonaws.com/.../signed.pdf",
  "created_at": "2026-09-01T12:00:00.000Z",
  "last_update_at": "2026-09-02T09:30:00.000Z",
  "deleted": false,
  "deleted_at": null,
  "signers": [
    {
      "token": "s1s2s3s4-0000-4000-8000-0987654321ba", // signer_token → URL /verificar/
      "name": "Ana Lima",
      "email": "ana.lima@exemplo.com", // signer_email → vínculo com o cliente
      "status": "signed",
      "signed_at": "2026-09-02T09:30:00.000Z",
    },
  ],
  "signer_who_signed": { "signed_at": "2026-09-02T09:30:00.000Z" }, // preferido para signed_at
}
```

Processamento: `ContractService.upsertFromZapSignPayload(payload, 'ZAPSIGN_WEBHOOK')` — upsert
por `zapsignToken`; resolve o cliente por `signers[0].email` (e-mail principal ou secundário,
`ClientSecondaryEmailService.findClientByAnyEmail`). Naturalmente idempotente; corrida de
`P2002` cai em `update`.

### 2.3 Estado no banco e exibição

Tabela `contracts` (model `Contract`):

| Coluna                                  | Origem                                                                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `zapsign_token`                         | `token` (único)                                                                                                                                                                   |
| `zapsign_open_id`                       | `open_id`                                                                                                                                                                         |
| `signer_token`                          | `signers[0].token`                                                                                                                                                                |
| `name`                                  | `name`                                                                                                                                                                            |
| `signer_email`                          | `signers[0].email` ou `signer_email`; `'unknown'` se vazio (reparado depois via API)                                                                                              |
| `signer_name`                           | `signers[0].name`                                                                                                                                                                 |
| `status`                                | `'deleted'` se `deleted`, senão `status` (default `'pending'`) — enum `ZapSignContractStatus` em `zapSignContractStatus.ts`: `pending`, `signed`, `refused`, `deleted`, `expired` |
| `original_file_url` / `signed_file_url` | `original_file` / `signed_file`                                                                                                                                                   |
| `signed_at`                             | `signer_who_signed.signed_at` → `signers[].signed_at` (status signed); só quando `status = signed`                                                                                |
| `source`                                | `'GURU_WEBHOOK'` (fluxo de venda), `'ZAPSIGN_WEBHOOK'` (webhook), `'MANUAL_ONBOARDING'` (form de pendência)                                                                       |
| `payload`                               | Json do último evento                                                                                                                                                             |
| `client_id`                             | FK opcional para `clients`, resolvida por e-mail                                                                                                                                  |

Exibição:

- **CRM (admin/backoffice)** — `GET /api/contracts/overview` (`ContractService.getContractsOverview`):
  lista com badge por status; labels em `crm_frontend/src/modules/contract/contractStatusPresentation.ts`
  (`Assinado`, `Pendente`, `Recusado`, `Expirado`, `Excluído`), link do `signedFileUrl`, stats
  e resumo por consultor. Contratos órfãos (sem `client_id`) são religados por e-mail a cada
  leitura (`orphanContractMatcher.ts`).
- **Por cliente** — `determineClientContractStatus` (`src/modules/client/clientContractStatusResolver.ts`):
  `NONE` (sem contrato) / `SIGNED` (algum `signed`) / `PENDING` (resto).
- **Consultor** — `GET /api/contracts/unsigned-clients/:consultantId` e
  `/no-contract-clients/:consultantId`; botão de reenvio (`POST /api/contracts/mine/resend-email`,
  bloqueado se já assinado).
- **App do cliente (arko)** — ver §3.

### 2.4 Variáveis de ambiente (ZapSign)

| Env                      | Uso                                                    |
| ------------------------ | ------------------------------------------------------ |
| `ZAPSIGN_API_TOKEN`      | Bearer de todas as chamadas à API                      |
| `ZAPSIGN_WEBHOOK_SECRET` | Valor esperado no header `x-webhook-secret` do webhook |

**Sandbox:** não é usado. `ZAPSIGN_SANDBOX = false` é constante em `zapsignCreateDocRequest.ts`;
o `template_id` também é constante (`ZAPSIGN_CONTRACT_TEMPLATE_ID`). Para replicar com sandbox
é preciso parametrizar os dois.

---

## 3. Fluxo ponta a ponta

```
Guru: venda de ADESÃO aprovada
  └─ POST /api/webhooks/sells  ──►  guruWebhookService.saveWebhook
       1. assertGuruAccountToken            (guruAccountToken.ts)
       2. upsert guru_webhooks por guru_id  (guruWebhookStoreService.ts)
       3. processExit? não                  (resolveExitType → null)
       4. classifyGuruSale → ADHESION       (guruSaleRouting.ts)
       5. cliente existe por CPF?
            sim → atualiza cep/endereço; se INACTIVE, reativa, restaura tasks, marca saídas revertidas
            não → hasRequiredContractData? (oferta ∈ ADHESION_OFFER_IDS && payment.total)
                    não → OnboardingPendency SPLIT_PAYMENT (admin resolve depois num form)
                    sim → ClientService.createClient (clientService.ts)
                            • financialStatus ACTIVE, planType por oferta, userId = admin padrão
                            • reuniões da jornada (meeting.createMany)
                            • LIBERAÇÃO DE ACESSO: ExternalApiService.allowEmailForClientCreation
                                → arko_backend POST /api/external/allowed-emails/clients {email, role:'CLIENT'}
                                  (header X-API-Key = EXTERNAL_API_KEY; base EXTERNAL_API_BASE_URL)
                                  → o cadastro no app Arko (arko_backend/src/modules/onboarding/registerController.ts)
                                    só aceita e-mail presente nessa lista
                          resolve pendência aberta pelo mesmo email/CPF
                          Slack: anúncio "cliente fechado" com link de atribuição de consultor
                          ContractDispatchService.tryDispatchContract(email)
       6. markProcessed

Guru: venda de ACOMPANHAMENTO (1ª mensalidade) aprovada
  └─ mesmo caminho → FOLLOW_UP → cliente existe? → tryDispatchContract(email)
                                      não existe → OnboardingPendency DIRECT_PIX_FOLLOWUP

ContractDispatchService.tryDispatchContract   (src/modules/contract/contractDispatchService.ts)
  • busca guru_webhooks approved do mesmo contact_email
  • precisa de um PAR: 1 adesão (oferta ∈ ADHESION_OFFER_IDS, invoice paid/null) + 1 acompanhamento (plano INDIVIDUAL|COUPLE)
  • sem par por e-mail → fallback por CPF (payload->contact->doc), só se inequívoco (guruWebhookPairing.ts)
  • já existe contract (status ∉ deleted/expired) para qualquer e-mail do par ou client_id → sai
  • ZapSignService.createContractFromGuruWebhook(adesão, mensalidade do plano)
        └─ POST models/create-doc (§2.1) → resposta com token/signers
  • persiste: ContractService.upsertFromZapSignPayload(buildZapSignDocPayload(...), 'GURU_WEBHOOK')  → status 'pending'
  • falha → SlackService.notifyContractNotSent na thread do cliente

ZapSign envia e-mail ao signatário (send_automatic_email)
  └─ cliente assina → POST /api/webhooks/zapsign  event_type=doc_signed
       → upsert contracts: status 'signed', signed_at, signed_file_url, client_id por e-mail

App Arko (cliente)
  arko_frontend Home → GET /crm/contract-status (arko_backend/src/modules/crm/crmRouter.ts)
    → arko_backend CrmService.getContractStatus
        → crm_backend GET /api/external/clients/:email/contract-status (X-API-Key)
            (src/modules/contract/externalContractController.ts)
            → { hasSigned, hasContract, signingUrl: "https://app.zapsign.com.br/verificar/<signerToken>" | null }
    → se !hasSigned e há signingUrl: ContractSigningModal (arko_frontend/src/modules/contract/) com botão que abre o link
```

**Importante para quem replica:** o acesso ao app **não é bloqueado pelo contrato**. A liberação
acontece na criação do cliente (allowed-email no `arko_backend`); o contrato pendente só gera um
modal dispensável no app (`ContractSigningModal` tem botão "Fechar"), e a cobrança de assinatura
é feita pelo CRM (lista de não assinados por consultor + reenvio de e-mail).

**Saídas (churn):** reembolso/chargeback da adesão (`/sells`) ou cancelamento da assinatura
(`subscription.last_status` no `/sells` ou evento "Cancelada" no `/subscriptions`) → cliente
`INACTIVE`, tasks pendentes canceladas, linha no painel de Reembolsos (`src/modules/refund/`).
Recompra aprovada de cliente `INACTIVE` reverte tudo (`processExistingClientSale`).

### Arquivos-chave

| Camada                   | Arquivo                                                                                                                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Montagem das rotas       | `src/index.ts`                                                                                                                                                                                                                                       |
| Guru — router/schemas    | `src/modules/subscription/guruWebhookRouter.ts`, `guruWebhookSchema.ts`, `guruSubscriptionWebhookSchema.ts`                                                                                                                                          |
| Guru — controllers       | `guruSellWebhookController.ts`, `guruSubscriptionWebhookController.ts`                                                                                                                                                                               |
| Guru — services          | `guruWebhookService.ts`, `guruSubscriptionWebhookService.ts`, `guruWebhookStoreService.ts`                                                                                                                                                           |
| Guru — regras puras      | `guruSaleRouting.ts`, `guruWebhookPayload.ts`, `guruWebhookConfig.ts`, `guruSubscriptionCancellationResolver.ts`, `existingClientSaleUpdate.ts`, `guruSaleClientData.ts`                                                                             |
| Guru — API               | `guruApiService.ts`, `guruApiConfig.ts`, `guruApiErrorMapper.ts`, `guruContact.types.ts`                                                                                                                                                             |
| Guru — leitura de status | `subscriptionQueryService.ts`, `subscriptionPaymentRules.ts`, `clientSubscriptionStatusResolver.ts`                                                                                                                                                  |
| ZapSign — criação        | `src/modules/contract/zapsignService.ts`, `zapsignCreateDocRequest.ts`, `zapsignConfig.ts`, `zapsignFailure.ts`, `guruContactMapper.ts`, `followUpPlanConfig.ts`                                                                                     |
| ZapSign — webhook        | `zapsignWebhookRouter.ts`, `zapsignWebhookController.ts`, `zapsignContractRecord.ts`, `zapsignDocPayloadBuilder.ts`, `zapSignContractStatus.ts`                                                                                                      |
| Orquestração do contrato | `contractDispatchService.ts`, `guruWebhookPairing.ts`, `contractService.ts`, `contractSignerRepairService.ts`                                                                                                                                        |
| Pendências de onboarding | `src/modules/onboarding/onboardingPendencyService.ts`, `onboardingContractDataBuilder.ts`                                                                                                                                                            |
| Liberação no app         | `src/modules/client/clientService.ts` (`tryAllowEmailInArko`), `src/modules/arkoApp/externalApiService.ts`                                                                                                                                           |
| Status para o app        | `src/modules/contract/externalContractRouter.ts`, `externalContractController.ts`; `arko_backend/src/modules/crm/crmService.ts`                                                                                                                      |
| Schema                   | `prisma/schema.prisma` — `GuruWebhook`, `Contract`, `OnboardingPendency`, enums `ExitType`, `FinancialStatus`, `PlanType`, `OnboardingPendencyOrigin`                                                                                                |
| Auth                     | `src/modules/auth/externalApiAuthMiddleware.ts`, `src/shared/utils/secretComparison.ts`                                                                                                                                                              |
| Decisões                 | `docs/decisions/2026-08-13-webhook-dedicado-de-assinaturas-do-guru.md`, `2026-08-16-status-de-mensalidade-vem-do-snapshot-de-assinatura.md`, `2026-09-04-pareamento-de-webhooks-por-cpf.md`, `2026-09-07-body-json-sem-inflate-e-limite-por-rota.md` |

### Checklist de env para outro projeto

```
GURU_ACCOUNT_TOKEN=<account token do painel do Guru>
GURU_API_TOKEN=<token da API v2 do Guru>
GURU_API_BASE_URL=https://digitalmanager.guru/api/v2
ZAPSIGN_API_TOKEN=<token de API do ZapSign>
ZAPSIGN_WEBHOOK_SECRET=<valor do header x-webhook-secret configurado no ZapSign>
EXTERNAL_API_BASE_URL=<url do backend do app que recebe a liberação de acesso>
EXTERNAL_API_KEY=<X-API-Key compartilhada entre CRM e app>
```

Mais: `template_id` do ZapSign e as listas de IDs de oferta do Guru (adesão, acompanhamento
individual, casal, residente) — hoje constantes no código.
