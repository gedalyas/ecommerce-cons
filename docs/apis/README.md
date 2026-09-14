# APIs das plataformas que o produto conecta

Uma ficha por plataforma: como autenticar, o que registrar, os endpoints que vamos usar, os
limites e o que ainda precisa ser confirmado com a conta. As fichas alimentam o plano de
conectores (`specs/connectors-plan.md`) e devem ser atualizadas quando a integração for
construída (o que foi confirmado no código vale mais do que o que a doc pública diz).

| Plataforma                      | Categoria     | Autenticação               | Ficha                                |
| ------------------------------- | ------------- | -------------------------- | ------------------------------------ |
| Nuvemshop                       | E-commerce    | OAuth (parceiro)           | [nuvemshop.md](nuvemshop.md)         |
| Bling                           | ERP           | OAuth (área do integrador) | [bling.md](bling.md)                 |
| Shopify                         | E-commerce    | OAuth (app público)        | [shopify.md](shopify.md)             |
| Mercado Livre                   | Marketplace   | OAuth (aplicação)          | [mercado-livre.md](mercado-livre.md) |
| Amazon                          | Marketplace   | Login with Amazon (SP-API) | [amazon.md](amazon.md)               |
| Meta Ads (Facebook / Instagram) | Mídia paga    | OAuth (Facebook Login)     | [meta-ads.md](meta-ads.md)           |
| Instagram e Facebook (orgânico) | Redes sociais | OAuth (mesmo app Meta)     | [instagram.md](instagram.md)         |
| Google Ads                      | Mídia paga    | OAuth (Google Cloud)       | [google-ads.md](google-ads.md)       |
| Google Analytics 4              | Analytics     | OAuth (Google Cloud)       | [ga4.md](ga4.md)                     |
| TikTok Ads                      | Mídia paga    | OAuth                      | [tiktok-ads.md](tiktok-ads.md)       |
| Digital Manager Guru            | Pagamento     | Webhook (token no corpo)   | [guru.md](guru.md)                   |
| ZapSign                         | Contrato      | Bearer + webhook (header)  | [zapsign.md](zapsign.md)             |

Convenção das fichas: **Registro** (o que criar e onde) · **Autenticação** (fluxo, URLs,
vida dos tokens) · **Dados que usamos** (endpoints, campos, paginação, incremental) ·
**Limites** · **Webhooks** · **A confirmar** · **Fontes**. Nada de segredo real nos arquivos.
