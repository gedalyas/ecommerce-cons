# Digital Manager Guru (pagamento / assinatura)

Integração **por webhook** — o produto não consulta a API do Guru. Comportamento levantado
do CRM do Arko (`specs/reference/arko-integracoes-guru-zapsign.md`) e implementado em
`apps/api/src/modules/billing` (plano `specs/commercial-plan.md`).

## Registro

- No painel do Guru: **Webhooks** → um para "Vendas" (todas as transações) apontando para
  `POST {API}/api/v1/webhooks/guru/sells` e um para "Assinaturas" (evento "Cancelada") para
  `POST {API}/api/v1/webhooks/guru/subscriptions`.
- O **Account Token** da conta vai em `GURU_ACCOUNT_TOKEN`; o Guru envia o mesmo valor no
  campo `api_token` do corpo.
- IDs das ofertas que representam o plano em `GURU_OFFER_IDS` (vazio aceita qualquer
  oferta).

## Formato

Corpo "cru" ou envelope `{ attempts, request_id, payload, … }`. Campos lidos (venda):
`id`, `status` (`approved | refunded | chargeback | waiting_payment | refused…`),
`contact{name,email}`, `items[0].offer.id` / `product.offer.id`, `payment{total,
installments.qty}`, `invoice{status: paid|waiting_payment|pastdue, cycle, charge_at,
period_end}`, `subscription{id (sub_…), name, last_status: active|pastdue|canceled|inactive,
started_at}`, `dates{created_at, canceled_at}`. Assinatura (cancelada): `id` (sub_…),
`last_status`, `dates.canceled_at`, `subscriber.email`, `last_transaction.contact.email`.

## Regras

`approved` + fatura `paid`/ausente + oferta conhecida → assinatura **ATIVA** (e convite
automático se o e-mail não tem usuário); `pastdue` → **EM ATRASO**;
`refunded`/`chargeback`/`last_status = canceled` → **ENCERRADA**. Toda entrega é guardada em
`guru_webhook` pelo id (retry não duplica). Respostas: 200 gravado, 422 corpo sem `id`,
401 token, 500 inesperado (o Guru reenvia em 500 e desativa o webhook após falhas
repetidas — nunca responder 4xx por regra de negócio).

## A confirmar com a conta

- Se o painel permite selecionar os status por webhook (o CRM usa "Cancelada" apenas).
- A documentação de developers estava fora do ar em 13/09/2026
  (<https://docs.digitalmanager.guru/>).
