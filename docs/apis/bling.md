# Bling (ERP) — API v3

Categoria: ERP. Alimenta pedidos de venda, produtos, estoque, contatos; para lojas que
vendem em vários canais o Bling costuma ser a fonte mais completa.

## Registro

- Usuário com permissão "Cadastro de aplicativos" → **Área do integrador** (Central de
  extensões) → "Criar aplicativo": visibilidade **privado** (só contas autorizadas) ou
  público (aparece na central), logo, nome, categoria, descrição, **escopos** e a **URL de
  redirecionamento**.
- Recebe `client_id` e `client_secret`.

## Autenticação (OAuth 2.0, authorization code)

1. Redirecionar o usuário para o endpoint de autorização do Bling com `client_id`,
   `response_type=code`, `state`.
2. Volta com `code` na URL de redirecionamento — o code vale **1 minuto** (trocar na hora).
3. `POST https://www.bling.com.br/Api/v3/oauth/token` com `Authorization: Basic
base64(client_id:client_secret)` e corpo `grant_type=authorization_code&code=…`.
4. Resposta com `access_token` (expira em horas — `expires_in` na resposta) e
   `refresh_token` (**30 dias**). Renovar com `grant_type=refresh_token` antes de expirar;
   se o refresh expirar, o cliente precisa reautorizar (avisar na tela de Conexões).

Chamadas: `Authorization: Bearer {access_token}`.

## Dados que usamos

Base: `https://www.bling.com.br/Api/v3`.

| Recurso           | Endpoint                      | Campos                                                                                                                                                                                                                                        | Incremental / paginação                                 |
| ----------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Pedidos de venda  | `GET /pedidos/vendas`         | `id`, `numero`, `data`, `dataSaida`, `total`, `totalProdutos`, `desconto`, `transporte.frete`, `situacao.id`, `loja.id` (canal), `contato{id,nome}`, `itens[]{codigo, descricao, quantidade, valor, produto.id}`, `parcelas[].formaPagamento` | `dataAlteracaoInicial/Final`, `pagina` + `limite` (100) |
| Detalhe do pedido | `GET /pedidos/vendas/{id}`    | itens completos e pagamentos (a listagem vem resumida)                                                                                                                                                                                        | —                                                       |
| Produtos          | `GET /produtos`               | `id`, `codigo` (SKU), `nome`, `preco`, `precoCusto`, `estoque.saldoVirtualTotal`, `categoria`                                                                                                                                                 | `dataAlteracaoInicial`                                  |
| Contatos          | `GET /contatos`               | `id`, `nome`, `email`, `celular`, `endereco{municipio, uf}`                                                                                                                                                                                   | `dataAlteracaoInicial`                                  |
| Situações         | `GET /situacoes/modulos/{id}` | situações do módulo Vendas — base da **tela de mapeamento** (Pago / Pendente / Cancelado)                                                                                                                                                     | —                                                       |
| Canais            | `GET /canais-venda`           | nome do canal por `loja.id`                                                                                                                                                                                                                   | —                                                       |

O Bling não traz o e-mail do cliente no pedido resumido: buscar o contato por `contato.id`
(ou o detalhe do pedido) e manter um cache local.

## Limites

Limite por segundo e por dia por aplicativo (a doc pública não lista os valores — confirmar
no painel; tratar 429 com backoff). O detalhe por pedido é o gargalo: usar
`dataAlteracao` e paralelismo baixo.

## Webhooks

O Bling v3 tem "Notificações" (callbacks) por evento de pedido/estoque configuráveis no app —
confirmar formato e assinatura. Não obrigatório: o sync incremental resolve.

## A confirmar

- URL exata do endpoint de autorização e a lista de escopos.
- Rate limits.
- Formato das notificações.
- Se o app privado pode ser autorizado por qualquer conta Bling ou só pelas liberadas pelo
  integrador.

## Fontes

- <https://developer.bling.com.br/bling-api>
- <https://developer.bling.com.br/aplicativos>
- <https://developer.bling.com.br/referencia>

## No código

Implementado em `blingProvider.ts` (K3): token com Basic, refresh 10 min antes de expirar, lista por `dataAlteracaoInicial/Final` + detalhe por pedido, contatos em cache no `raw_record`, mapeamento de situações em `Connection.settings.statusMap` (tela "Configurar" em Conexões); salvar o mapeamento re-mapeia os pedidos guardados.
