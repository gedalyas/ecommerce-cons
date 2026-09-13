# ZapSign (assinatura eletrônica do contrato)

Implementação em `apps/api/src/modules/contracts` (plano `specs/commercial-plan.md`);
comportamento levantado do CRM do Arko.

## Registro

- Conta ZapSign → **API token** (`ZAPSIGN_API_TOKEN`), um **modelo (template)** do contrato
  com variáveis `{{name}}`, `{{email}}`, `{{contractValue}}`… (`ZAPSIGN_TEMPLATE_ID`).
- **Webhook** em Configurações → Webhooks: URL `POST {API}/api/v1/webhooks/zapsign`,
  eventos `doc_signed`, `doc_refused`, `doc_created`, `doc_deleted`, `email_bounce`;
  **header customizado** `x-webhook-secret: {ZAPSIGN_WEBHOOK_SECRET}` (a validação compara
  com `timingSafeEqual`).
- Sandbox: `sandbox: true` no payload de criação (`ZAPSIGN_SANDBOX`).

## API

Base `https://api.zapsign.com.br/api/v1`, `Authorization: Bearer {token}`.

| Chamada                                                       | Uso                                                                                                                                                                                                                        |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /models/create-doc/`                                    | cria o documento a partir do template (`template_id`, `signer_name`, `signer_email`, `send_automatic_email: true`, `lang: "pt-br"`, `external_id`, `data: [{de: "{{var}}", para: "valor"}]`) → `token`, `signers[0].token` |
| `GET /docs/{token}/`                                          | detalhe (status, signers)                                                                                                                                                                                                  |
| `GET /docs/?page=1&sort_order=desc`                           | recuperar por `external_id` antes de um retry                                                                                                                                                                              |
| `POST /signers/{signerToken}/` `{send_automatic_email: true}` | reenviar o e-mail ao signatário                                                                                                                                                                                            |

Link de assinatura: `https://app.zapsign.com.br/verificar/{signerToken}`.

## Webhook

`{ event_type, token, open_id, name, status (pending|signed|refused…), original_file,
signed_file, signers[]{token, name, email, status, signed_at}, signer_who_signed{signed_at},
deleted }`. Upsert por `token`; responder 200 sempre (senão o ZapSign reenvia).

## Fontes

- <https://docs.zapsign.com.br/webhooks/como-funciona>
- <https://docs.zapsign.com.br/webhooks/criar-webhook>
- <https://docs.zapsign.com.br/webhooks/eventos>
