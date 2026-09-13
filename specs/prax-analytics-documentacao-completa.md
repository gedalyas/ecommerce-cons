# Prax Analytics — Documentação completa da plataforma

**Objetivo deste documento:** mapear, seção por seção, tudo o que a plataforma Prax Analytics (`app.prax.ai`) oferece — telas, métricas, filtros, tabelas, formulários e endpoints — para servir de referência na construção de uma plataforma equivalente.

**Como a pesquisa foi feita:** navegação completa pelo app autenticado (loja de referência `7230 — Casa dos Parafusos`), leitura do DOM de cada tela, abertura de todos os filtros/dropdowns/modais e inspeção das chamadas de rede para inferir os endpoints e os campos que alimentam cada componente. A conta usada **não tem fonte de dados conectada**, então os números aparecem vazios — o que foi documentado é a **estrutura** (quais métricas existem, como são calculadas, quais filtros e colunas), que é justamente o que interessa para replicar.

**Nenhuma alteração foi feita na conta:** nenhum dado salvo ou excluído, nenhuma integração conectada, nenhuma credencial digitada, nenhum plano alterado, nenhuma mensagem enviada.

---

## Índice

1. [O que é a Prax, em uma frase](#1-o-que-é-a-prax-em-uma-frase)
2. [Mapa completo de seções](#2-mapa-completo-de-seções)
3. [Padrões transversais (valem para todas as telas)](#3-padrões-transversais)
4. [Módulo DADOS — Painel de Controle](#4-painel-de-controle)
5. [Módulo DADOS — Marketing](#5-marketing)
6. [Módulo DADOS — Pedidos](#6-pedidos)
7. [Módulo DADOS — Recompra](#7-recompra)
8. [Módulo DADOS — Clientes (RFM)](#8-clientes-rfm)
9. [Módulo DADOS — Produtos](#9-produtos)
10. [Módulo DADOS — Financeiro](#10-financeiro)
11. [Módulo ANÁLISE — Métricas (análise narrativa por IA)](#11-métricas--análise-narrativa-por-ia)
12. [Módulo ANÁLISE — Metas](#12-metas)
13. [Módulo ANÁLISE — Benchmark](#13-benchmark)
14. [Módulo ANÁLISE — Planos de ação](#14-planos-de-ação)
15. [Módulo AUTOMAÇÕES — WhatsApp](#15-automações--whatsapp)
16. [Conexões (integrações)](#16-conexões-integrações)
17. [MCP / Agentes de IA](#17-mcp--agentes-de-ia)
18. [Configurações, Contexto do Negócio, Usuários e Faturamento](#18-configurações-contexto-do-negócio-usuários-e-faturamento)
19. [Camada de IA e Alertas](#19-camada-de-ia-e-alertas)
20. [Modelo de dados necessário para replicar](#20-modelo-de-dados-necessário-para-replicar)
21. [Catálogo de métricas e fórmulas](#21-catálogo-de-métricas-e-fórmulas)
22. [Roteiro de construção sugerido](#22-roteiro-de-construção-sugerido)

---

## 1. O que é a Prax, em uma frase

É um **BI vertical para e-commerce** que conecta as fontes de dados da loja (plataforma de e-commerce ou ERP), as plataformas de mídia paga e o analytics, normaliza tudo em um modelo único, e entrega três camadas em cima disso:

| Camada               | O que faz                                                             | Onde aparece                                                                     |
| -------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Descritiva**       | Dashboards e tabelas — o que aconteceu                                | Painel de Controle, Marketing, Pedidos, Recompra, Clientes, Produtos, Financeiro |
| **Prescritiva / IA** | Interpreta os números, compara com benchmark de mercado e sugere ação | Métricas, Benchmark, Planos de ação, "Perguntar à IA", Alertas                   |
| **Acionamento**      | Executa a ação sobre a base de clientes                               | Automações › WhatsApp (campanhas, carrinho abandonado, cashback)                 |

A grande diferença para um BI genérico é que o **modelo de dados já vem pronto para e-commerce**: pedido, item, cliente, produto, estoque, investimento de mídia e estrutura de custos são entidades de primeira classe, e todas as métricas (ROAS, CAC, LTV, taxa de recompra, curva ABC, RFM, DRE) são derivadas delas automaticamente.

---

## 2. Mapa completo de seções

A navegação lateral é dividida em 4 grupos. Rotas no padrão `/store/{storeId}/...`.

### AUTOMAÇÕES

| Seção     | Rota                                                    | Status                                  |
| --------- | ------------------------------------------------------- | --------------------------------------- |
| WhatsApp  | `/whatsapp/home`, `/whatsapp/main`, `/whatsapp/history` | Ativo mediante ativação comercial       |
| Email     | —                                                       | Em breve (botão desabilitado, sem rota) |
| Anúncios  | —                                                       | Em breve                                |
| Criativos | —                                                       | Em breve                                |

### ANÁLISE

| Seção                   | Rota                     |
| ----------------------- | ------------------------ |
| Planos de ação          | `/action-plans`          |
| Métricas                | `/analysis`              |
| Metas                   | `/goals` e `/goals/edit` |
| Benchmark               | `/benchmark`             |
| Planejamento de Estoque | Em breve                 |

### DADOS

| Seção              | Sub-seções                                                         | Rotas                                                                             |
| ------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Painel de Controle | —                                                                  | `/dashboard`                                                                      |
| Marketing          | Resumo · Campanhas · Descontos · Influenciadores · ROAS por Região | `/marketing/summary`, `/campaigns`, `/discount-codes`, `/influencers`, `/regions` |
| Pedidos            | Resumo · Aprovação · Regiões · Lista                               | `/orders/summary`, `/approval`, `/regions`, `/list`                               |
| Recompra           | Resumo · LTV e CAC                                                 | `/repurchase/summary`, `/ltv-and-cac`                                             |
| Clientes           | —                                                                  | `/customers`                                                                      |
| Produtos           | Resumo · Lista · Estoque                                           | `/products/summary`, `/list`, `/inventory`                                        |
| Financeiro         | Resumo · Custos                                                    | `/finance/summary`, `/finance/costs`                                              |

### PLATAFORMA

| Seção                        | Rota                                                |
| ---------------------------- | --------------------------------------------------- |
| Conexões                     | `/connections`, `/connections/create/{connectorId}` |
| MCP / Agentes de IA          | `/mcp`                                              |
| Pixel                        | Em breve                                            |
| Educação                     | Em breve                                            |
| Configurações                | `/settings`                                         |
| Contexto do negócio          | `/settings/business-context`                        |
| Usuários                     | `/users`, `/users/add`                              |
| Faturamento                  | `/billing`                                          |
| Assistente IA (página cheia) | `/ai`                                               |
| Configurações do usuário     | `/user-settings`                                    |
| Suas lojas                   | `/home`                                             |
| Criar loja                   | `/store/create`                                     |

**Total: 24 telas funcionais + 6 placeholders de roadmap.**

---

## 3. Padrões transversais

Estes padrões se repetem em quase todas as telas. Replicá-los uma vez economiza trabalho em todo o resto do produto.

### 3.1 Os quatro parâmetros globais

Praticamente todo endpoint analítico recebe:

| Parâmetro               | Valores                                                                          | Função                             |
| ----------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| `startDate` / `endDate` | ISO-8601 (`2026-09-01T00:00:00.000Z`); na URL do front aparece como `YYYY-MM-DD` | Janela de análise                  |
| `groupBy`               | `day` · `week` · `month` · `year`                                                | Granularidade das séries temporais |
| `comparing`             | `none` · `previousPeriod` · `previousMonth` · `previousYear`                     | Período de comparação              |

Esses 4 params vivem na **URL do front-end**, o que torna qualquer tela compartilhável por link com o contexto preservado. Vale muito a pena copiar essa decisão.

### 3.2 Envelope de resposta com comparação embutida

```json
{ "current": <payload>, "previous": <payload | null> }
```

O backend calcula o período comparativo; o front só renderiza a variação. Métricas escalares normalmente vêm como **objeto** (`{ value, currency/percentage, variation }`), não como número puro. Padronizar isso desde o início evita retrabalho.

### 3.3 Seletor de período (componente único)

- Dropdown **"por:"** → Dia · Semana · Mês · Ano
- Dropdown **"Comparar com:"** → Desabilitado · Mês anterior · Ano anterior · Período anterior
- Presets: Hoje · Ontem · Esta semana · Semana passada · Este mês · Mês passado · Últimos 14 dias · Últimos 30 dias · Últimos 90 dias · Últimos 12 meses · Janeiro até hoje
- Calendário duplo (2 meses lado a lado) para intervalo customizado

**Exceções (telas sem seletor de período):** Clientes e Produtos › Estoque — ambas trabalham sobre a base acumulada / snapshot atual.

### 3.4 Endpoints de filtro dinâmicos

Cada dimensão filtrável tem seu próprio endpoint `/Filters/{Dimensao}`, que devolve **apenas os valores que existem dentro do período selecionado**. Isso evita mostrar ao usuário opções de filtro que resultariam em zero linhas. Exemplos: `Filters/Channels`, `Filters/Sources`, `Filters/FinancialStatus`, `Filters/PaymentGateway`, `Filters/ProcessingMethod`, `Filters/DiscountCodes`, `Filters/CountryCodes`, `Filters/Provinces`, `Filters/Cities`, `Filters/Categories`, `Filters/Brands`, `Filters/Collections`, `Filters/ProductNames`.

Há também endpoints `Range*` (ex.: `RangeTotalSoldPerClient`, `RangeNumberOfOrdersPerClient`) que devolvem o mínimo e o máximo para alimentar sliders.

### 3.5 Padrões de UI reutilizados

| Padrão                                  | Descrição                                                                                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tabela seleciona → gráfico desenha**  | Tabelas com checkbox por linha alimentam um gráfico abaixo. Estado vazio explícito: _"Para visualizar o gráfico, selecione pelo menos um item na tabela"_ |
| **Carrossel de indicadores**            | Chips horizontais roláveis; o escolhido vira o big number + a série temporal do card                                                                      |
| **Toggle de canal**                     | Chips `Marketplace` / `E-commerce` presentes em Dashboard, Marketing, Pedidos, Recompra, Clientes, Produtos, Custos                                       |
| **Toggle "Incluir taxa da plataforma"** | Aparece em 5 pontos diferentes do Marketing — exige guardar a taxa de serviço **separada** do investimento bruto                                          |
| **Paginação**                           | Anterior/Próximo · "Página X de Y" · seletor por página (10/20/50/100)                                                                                    |
| **Linha TOTAL**                         | Tabelas analíticas trazem uma linha de totais agregada (flag `isTotalRow` na API)                                                                         |
| **Exportar CSV**                        | Presente em ~10 tabelas: Resumo Financeiro, Campanhas, Descontos, Regiões, Pedidos Lista, Clientes, Produtos (todas as 3 abas), Custos, DRE               |
| **Multi-select com busca**              | Campo "Pesquisar…", ação "Selecionar todos", estado vazio "Nenhum resultado encontrado :("                                                                |
| **Guarda de navegação**                 | Formulários sujos disparam "Descartar alterações não salvas?" → Continuar editando / Sair sem salvar                                                      |
| **Ícone (i)**                           | Abre modal explicando a regra de negócio da métrica                                                                                                       |
| **Ícone ✨**                            | Dispara análise de IA daquele bloco específico                                                                                                            |

### 3.6 Gating por prontidão de dados

Quando a loja não tem fonte conectada, um endpoint `/stores/{id}/data-readiness` controla:

1. **Banner fixo** no topo de todas as telas: _"Conecte uma fonte de dados da loja"_ + botão "Ver conexões"
2. **Bloqueio de tela cheia** nas páginas de dados, com três saídas: **Ver conexões** · **Atualizar status** · **Acessar mesmo assim** (bypass que renderiza o esqueleto da UI zerado)

Essa decisão de UX é boa: o usuário sempre enxerga o que a plataforma faria por ele, o que reduz abandono no onboarding.

### 3.7 Estados vazios e de erro (3 variantes distintas)

| Variante         | Mensagem                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tabela sem dados | "Não há dados disponíveis para os filtros selecionados."                                                                                          |
| Erro de parsing  | **Falha na Construção** — "Não foi possível montar o gráfico / Os dados recebidos não puderam ser processados corretamente." + _Contatar Suporte_ |
| Erro de fetch    | **Falha na Requisição** — "Não foi possível carregar os dados / Ocorreu um erro ao tentar buscar as informações." + _Contatar Suporte_            |

### 3.8 Convenções de API observadas

- Base: `https://api.prax.ai`, autenticação por **Bearer token** (não usa cookie de sessão)
- Dois estilos de rota convivem: `/Stores/{id}/Pascal/Case` (endpoints analíticos, provavelmente API legada .NET) e `/stores/{id}/kebab-case` (endpoints mais novos: costs, goals, action-plans, business-context)
- **Um endpoint por bloco visual** — cada página faz de 5 a 9 chamadas. Consultas "de total" e "por data" são endpoints separados (`X` e `XByDate`)
- Tabelas com filtros complexos usam **POST** com os filtros no body e paginação/ordenação na query string

**Endpoints de bootstrap (chamados em toda navegação):**

```
GET /stores
GET /stores/permissions
GET /users/me
GET /stores/{id}
GET /stores/{id}/settings
GET /stores/{id}/data-readiness
GET /stores/{id}/plan-summary
GET /stores/{id}/subscription-context
GET /stores/{id}/connections
GET /stores/{id}/business-context
GET /Stores/{id}/Alerts/UnreadCount
```

### 3.9 Internacionalização

4 locales: `pt-BR`, `pt-PT`, `es-AR`, `en`. Dicionários embutidos no bundle com fallback inline. O idioma escolhido no cadastro da loja também define a **região fiscal padrão**.

---

## 4. Painel de Controle

**Rota:** `/store/{id}/dashboard`

**Objetivo:** visão executiva única — quanto vendeu, quanto gastou em marketing, qual o retorno e de onde vieram as vendas. É a tela de abertura e responde "como a loja foi no período e o que está puxando o resultado".

### 4.1 Bloco "Resumo" — carrossel de 10 indicadores

O usuário escolhe um indicador nos chips; o card mostra o big number e a série temporal correspondente.

| Indicador                 | Endpoint (`/Stores/{id}/Dashboard/…`) | Unidade                 |
| ------------------------- | ------------------------------------- | ----------------------- |
| Total Vendido             | `TotalSoldByDate`                     | R$                      |
| Taxa de Conversão         | `ConversionRateByDate`                | %                       |
| ROI                       | `ROIByDate`                           | multiplicador (`0.00x`) |
| CAC                       | `CustomerAcquisitionCostByDate`       | R$                      |
| Número de Pedidos         | `NumberOfOrdersByDate`                | un.                     |
| Ticket Médio do Pedido    | `AverageTicketPriceByDate`            | R$                      |
| Investimento em Marketing | `InvestmentInMarketingByDate`         | R$                      |
| Lucro Líquido             | `ResultsByDate`                       | R$                      |
| CPA                       | `CostPerAcquisitionByDate`            | R$                      |
| Clientes                  | `ClientsByDate`                       | un.                     |

O endpoint agregado `GET /Stores/{id}/Dashboard` devolve todos de uma vez: `totalSold`, `averageTicketPrice`, `investmentInMarketing`, `customerAcquisitionCost`, `results`, `numberOfOrders`, `sessions`, `conversionRate`, `roi`, `costPerAcquisition`, `clients`.

### 4.2 Bloco "Vendas por [UTM | GA4]"

Gráfico de barras com a receita por origem de tráfego. Select alterna a fonte de atribuição entre **UTM** (dados próprios) e **GA4** (integração externa) — parâmetro `trafficDataSource`.

### 4.3 Bloco "Investimento por Desempenho de Campanha"

Gráfico **donut** com o investimento distribuído em 3 faixas de qualidade:

| Faixa    | Regra        |
| -------- | ------------ |
| 🔴 Baixo | ROAS < 2     |
| 🟡 Médio | 2 ≤ ROAS ≤ 5 |
| 🟢 Alto  | ROAS > 5     |

Modal (i): _"A performance das campanhas é calculada usando valores médios de mercado e campanhas com objetivos de conversão. Caso seus objetivos e referências sejam outros, os resultados podem variar."_

Essa classificação por faixa de ROAS é uma **regra de negócio fixa reutilizada em várias telas** — vale centralizá-la em um único lugar do código.

### 4.4 Bloco "Resumo Financeiro"

Tabela em formato **matriz métrica × tempo**: primeira coluna fixa "Métricas", demais colunas geradas dinamicamente conforme o `groupBy` (um bucket por dia/semana/mês). Paginada, exportável em CSV.

### 4.5 Filtros

- Período global
- Toggles `Marketplace` / `E-commerce`. Ao ativar Marketplace, abre sub-filtro com os marketplaces que tiveram pedidos no período (endpoint `Orders/Filters/MarketplaceSources`)
- `Vendas por`: UTM ou GA4

### 4.6 Endpoints

```
GET /Stores/{id}/Dashboard                          [startDate,endDate,groupBy,comparing,salesPlatforms]
GET /Stores/{id}/Dashboard/SalesPerChannel          [+ trafficDataSource]
GET /Stores/{id}/Dashboard/CampaignPerformance      [+ salesPlatforms]
GET /Stores/{id}/Dashboard/FinancialOverview        [+ page,limit,sortField,sortOrder]
GET /Stores/{id}/Dashboard/{Metrica}ByDate          (10 variantes)
GET /Stores/{id}/Orders/Filters/MarketplaceSources
```

### 4.7 Para replicar

Precisa de: pedidos (data, valor, frete, status de pagamento, cliente novo/recorrente, plataforma de venda), sessões (GA ou pixel próprio), atribuição UTM por pedido, gasto de anúncios por dia/campanha e a tabela de despesas para o Resumo Financeiro.

---

## 5. Marketing

Cinco abas: **Resumo · Campanhas · Descontos · Influenciadores · ROAS por Região**.

### 5.1 Marketing › Resumo

**Rota:** `/marketing/summary`
**Objetivo:** consolidar a eficiência do marketing — investimento por canal, retorno, funil de conversão comparado a benchmarks de mercado e receita por origem de tráfego.

#### Tabela "Desempenho por Canal"

Toggle **"Incluir taxa da plataforma"** — _"Quando ativado, as taxas de serviço da plataforma serão incluídas nos cálculos."_

| Coluna            | Definição                                                  |
| ----------------- | ---------------------------------------------------------- |
| Canal             | E-commerce · Marketplace · Total                           |
| Investimento      | Gasto de marketing no canal (R$)                           |
| Receita           | Total vendido no canal (R$)                                |
| ROI               | (Receita − Investimento) ÷ Investimento (`0.00x`)          |
| ROAS              | Receita ÷ Investimento — _Não disponível_ para Marketplace |
| CPA               | Investimento ÷ pedidos (R$)                                |
| Taxa de Conversão | Pedidos ÷ sessões — _Não disponível_ para Marketplace      |

#### "Despesas de Marketing"

Composição do investimento, com estas categorias vindas da API: campanhas, taxa da plataforma, comissão de vendas (total / e-commerce / marketplaces), salários, plataforma de e-mail, apps, agência, material, outros (total / e-commerce / marketplaces).

#### "Investimento em Marketing vs [métrica]"

Gráfico combinado: **barras** = investimento, **linha** = métrica escolhida.
Opções de métrica: Total Vendido · Investimento em Anúncios · ROAS · ROI · CPA · CAC.

#### "Sessões vs [métrica]"

Mesmo padrão: barras = sessões, linha = métrica.
Opções: Total Vendido · Taxa de Conversão · Receita por Sessão · Custo por Sessão.

#### "Funil de Marketing" ⭐

Gráfico de funil com 6 etapas. Select de base: **Sessões** ou **Usuários**.

```
Sessões → Visualizar Item → Adicionado ao Carrinho → Checkouts → Pedidos → Pedidos Pagos
```

Abaixo, uma tabela de conversão que compara **a taxa do período × a média histórica da própria loja × o benchmark de mercado**:

| Etapa                            | Benchmark de mercado |
| -------------------------------- | -------------------- |
| Sessões → Visualizar Item        | 15,0 – 40,0%         |
| Visualizar Item → Carrinho       | 35,0 – 55,0%         |
| Sessões → Carrinho               | 6,0 – 17,1%          |
| Sessões → Checkout               | 1,6 – 3,5%           |
| Sessões → Pedidos Pagos          | 0,5 – 1,4%           |
| Carrinho → Checkouts             | 16,1 – 35,4%         |
| Checkouts → Pedidos Captados     | 32,2 – 62,8%         |
| Pedidos Captados → Pedidos Pagos | 81,1 – 91,8%         |

> **Vale copiar:** esses benchmarks são constantes de mercado guardadas na aplicação. Mostrar a faixa esperada ao lado da taxa real é o que transforma um número solto em diagnóstico. Você pode começar com faixas públicas do seu setor e depois substituí-las pela média da sua própria base.

#### "Vendas por [UTMs | Google Analytics 4]"

Dois selects encadeados — fonte (UTMs ou GA4) e dimensão: **Canal** · **Origem** · **Origem/Meio** · **Campanha**.

**Colunas no modo UTMs:** Origem/Meio · Total Vendido · Pedidos Pagos · Clientes · Ticket Médio · % Vendas Novos Clientes · % Vendas Clientes Recorrentes

**Colunas no modo GA4:** Origem/Meio · Usuários · Pedidos · Total Vendido · Taxa de Conversão · Ticket Médio · Valor Médio do Usuário

#### Endpoints

```
GET  /Stores/{id}/Marketing/Summary/Overview
GET  /Stores/{id}/Marketing/Summary/InvestmentBreakdown
GET  /Stores/{id}/Marketing/Summary/InvestmentVsMetrics    [+ metric]
GET  /Stores/{id}/Marketing/Summary/SessionsVsMetrics      [+ metric]
GET  /Stores/{id}/Marketing/Summary/SalesFunnelChart       [+ viewType]
GET  /Stores/{id}/Marketing/Summary/SalesFunnelTable       [+ viewType, includeHistorical]
POST /Stores/{id}/Marketing/Summary/UTMSalesTable          body: {utmBreakdown, salesPlatforms}
POST /Stores/{id}/Marketing/Summary/GA4SalesTable          body: {utmBreakdown}
GET  /Stores/{id}/Marketing/GA4/Properties
```

---

### 5.2 Marketing › Campanhas

**Rota:** `/marketing/campaigns`
**Objetivo:** comparar performance de mídia paga entre plataformas e fazer drilldown campanha → conjunto de anúncios → anúncio.

#### "Desempenho por Plataforma"

Tabela com checkbox por linha (cada linha é um conector de mídia; há linha Total). A seleção alimenta o gráfico abaixo.

Colunas: **Total Investido · Total Vendido · ROAS · Pedidos · CPA · Impressões · CPM · Link Cliques · CPC · CTR**

#### "Desempenho de Marketing Pago"

Dois grupos de abas independentes:

- **Nível:** Campanhas | Conjunto de Anúncios | Anúncio (param `adGroupLevel`)
- **Plataforma:** Facebook Ads | Google Ads | TikTok Ads

Mostra a distribuição por qualidade (Alto/Médio/Baixo, mesma regra de ROAS da seção 4.3) e duas tabelas lado a lado:

- **Melhores Campanhas** (cabeçalho verde) — Nome · Gasto · Receita · ROAS
- **Piores Campanhas** (cabeçalho vermelho) — mesmas colunas

#### "Métricas por Nível de Grupo de Anúncios"

Tabela completa com checkbox por linha, ordenável, paginada, exportável em CSV. Colunas: Nome · Total Investido · Total Vendido · ROAS · Pedidos · CPA · Impressões · CPM · Link Cliques · CPC · CTR.

Abaixo, select da métrica do gráfico: Total Vendido · Total Investido · Pedidos · Link Cliques · Impressões · CPM · CTR · CPC · CPA · ROAS.

#### Endpoints

```
GET /Stores/{id}/Marketing/Campaigns/MetricsByPlatform
GET /Stores/{id}/Marketing/Campaigns/NumberOfAdGroupLevelsByQuality  [+ adGroupLevel]
GET /Stores/{id}/Marketing/Campaigns/AdsSummaryByLevel               [+ adGroupLevel, limit, sortOrder]
GET /Stores/{id}/Marketing/Campaigns/AdsByLevelTable                 [+ adGroupLevel, page, limit, sortField, sortOrder]
```

#### Para replicar

Ingestão das APIs de Meta, Google e TikTok Ads com a hierarquia campanha → ad set → ad, métricas de spend/impressões/cliques/conversões, taxa de serviço da plataforma armazenada separadamente, e receita atribuída por campanha (via UTM ou API de conversões).

---

### 5.3 Marketing › Descontos

**Rota:** `/marketing/discount-codes`
**Objetivo:** medir o impacto financeiro dos cupons — quanto de receita passa por desconto, qual o custo disso e se cupom traz cliente novo ou só subsidia recorrente.

#### KPIs

| KPI                           | Definição                              |
| ----------------------------- | -------------------------------------- |
| Pedidos com Desconto          | Pedidos com qualquer desconto aplicado |
| Total Vendido com Desconto    | Receita dos pedidos com desconto (R$)  |
| Total de Descontos            | Soma dos valores descontados (R$)      |
| Pedidos com Cupom de Desconto | Pedidos que usaram código de cupom     |

#### Tabela de cupons

| Coluna                    | Campo API                 |
| ------------------------- | ------------------------- |
| Cupom                     | `coupon`                  |
| Receita de Produtos       | `productRevenue`          |
| Receita de Frete          | `shippingRevenue`         |
| Total Vendido             | `totalSold`               |
| Total de Descontos        | `totalDiscount`           |
| Número de Pedidos         | `numberOfOrders`          |
| Percentual de Desconto    | `discountPercentage`      |
| Desconto Médio por Pedido | `averageDiscountPerOrder` |
| Ticket Médio do Pedido    | `averageTicket`           |
| Número de Novos Clientes  | `numberOfNewCustomers`    |
| % Recompra                | `repurchasePercentage`    |

Controles: busca por nome, multi-select de cupons com "Selecionar todos", checkbox por linha alimentando o gráfico, CSV.

#### Endpoints

```
GET /Stores/{id}/Marketing/DiscountCodes/Overview
GET /Stores/{id}/Marketing/DiscountCodes/Codes
GET /Stores/{id}/Marketing/DiscountCodes/Table   [+ page, limit, sortField, sortOrder]
```

---

### 5.4 Marketing › Influenciadores

**Rota:** `/marketing/influencers` — "Hub de Influenciadores"
**Objetivo:** cadastrar influenciadores, suas regras de remuneração e cupons associados, e medir o ROI de cada parceria.

#### Tabela

Abas de status: **Ativo | Pausado | Arquivado**. Busca por nome ou identificador. Botão **Adicionar**.

Colunas: Nome · Total de Vendas · Receita Total · Custo Total · ROI · Receita de Frete · Receita de Produtos · Clientes · Novos Clientes · Taxa de Recompra.

#### Formulário "Adicionar Influenciador"

**Informações básicas:** Nome* (máx. 120) · Identificador (`@username`) · Status (Ativo/Pausado/Arquivado) · Observações.

**Remuneração** — N regras empilháveis, cada uma com Tipo, Valor, Data de Início, Data de Término, Limite por Período e Observações. Tipos disponíveis:

| Tipo de remuneração         |
| --------------------------- |
| Taxa Fixa                   |
| Recorrente Diária           |
| Recorrente Semanal          |
| Recorrente Mensal           |
| Por Pedido (Fixo)           |
| Por Pedido (% dos Produtos) |
| Por Pedido (% do Total)     |

**Códigos de desconto** — N itens, cada um com Código*, Ativo Desde, Ativo Até.

#### Endpoint

```
GET /Stores/{id}/Marketing/Influencers/analytics [+ page, limit, sortField, sortOrder]
→ { data: [...], totals: { totalSales, totalRevenue, totalCost, totalShippingRevenue,
      revenueFromProducts, numberOfCustomers, numberOfNewCustomers, avgRoi, repurchaseRate } }
```

#### Para replicar

Entidade **Influenciador** + **regras de remuneração** (tipo, valor, vigência, teto) + **cupons vinculados com janela de vigência**. A receita vem do cruzamento cupom → pedidos dentro da janela; o custo é calculado aplicando as regras sobre o período.

---

### 5.5 Marketing › ROAS por Região

**Rota:** `/marketing/regions`
**Objetivo:** mostrar onde, geograficamente, o investimento em mídia converte melhor.

- **Mapa coroplético do Brasil por estado**, colorido pela intensidade do ROAS
- Bloco de cards de desempenho regional
- Tabela "Desempenho Regional" com CSV

| Coluna                | Campo API                  |
| --------------------- | -------------------------- |
| Estado                | `regionKey` (UF)           |
| Investimento Facebook | `facebookSpend`            |
| Investimento Google   | `googleSpend`              |
| Gasto Total           | `totalSpend`               |
| Total Vendido         | `totalRevenue`             |
| ROAS                  | `roas`                     |
| CPM · CPC · CPA · CAC | `cpm`, `cpc`, `cpa`, `cac` |
| Clientes              | `numberOfCustomers`        |
| Ticket Médio          | `averageTicket`            |
| Taxa de Recompra      | `repurchaseRate`           |

```
GET /Stores/{id}/Marketing/Regions/Performance
GET /Stores/{id}/Marketing/Regions/BigNumbers
```

**Para replicar:** Meta e Google entregam spend/impressões/cliques com breakdown geográfico; do lado dos pedidos é preciso normalizar o endereço de entrega para UF. O mapa precisa de um GeoJSON dos estados brasileiros.

---

## 6. Pedidos

Quatro abas: **Resumo · Aprovação · Regiões · Lista**.

### 6.1 Pedidos › Resumo

**Rota:** `/orders/summary`
**Objetivo:** quanto foi capturado vs. efetivamente pago, qualidade da aprovação e de onde vem a receita.

#### Indicadores (carrossel de chips)

| Indicador           | Definição                                                    |
| ------------------- | ------------------------------------------------------------ |
| Receita Capturada   | Valor de todos os pedidos criados, independente de aprovação |
| Receita Paga        | Valor dos pedidos com pagamento aprovado                     |
| Taxa de Aprovação   | Receita Paga ÷ Receita Capturada                             |
| Número de Pedidos   | Contagem no período                                          |
| Ticket Médio        | Receita Paga ÷ pedidos pagos                                 |
| Itens por Pedido    | Itens vendidos ÷ pedidos                                     |
| Total de Descontos  | Soma dos descontos                                           |
| Desconto por Pedido | Total de descontos ÷ pedidos                                 |
| Frete               | Soma do valor de frete                                       |

#### "De onde vem as minhas vendas?"

Donut + tabela: **Canal · Origem · Total Capturado · Total Pago · Taxa de Aprovação · Pedidos Pagos · Ticket Médio · Itens Vendidos · Total de Descontos · Desconto Médio por Pedido**

```
GET /Stores/{id}/Orders/Summary/Overview
GET /Stores/{id}/Orders/Summary/TotalBilledByDate
GET /Stores/{id}/Orders/Summary/TotalSoldBySource
GET /Stores/{id}/Orders/Summary/TotalSoldBySourceByDate
GET /Stores/{id}/Orders/Summary/SalesMetrics
```

---

### 6.2 Pedidos › Aprovação ⭐

**Rota:** `/orders/approval`
**Objetivo:** entender onde o faturamento fica preso — responde "onde estou perdendo venda por recusa ou pendência de pagamento?".

Estrutura muito simples e replicável: **três seções idênticas**, cada uma com um donut (share do total vendido) + uma série temporal:

1. **Status de Pagamento** (pago, pendente, reembolsado, cancelado, autorizado…)
2. **Método de Pagamento** (cartão, pix, boleto…)
3. **Gateway de Pagamento**

Filtros: multi-selects de Status, Gateways e Métodos, carregados dinamicamente da base.

```
GET /Stores/{id}/Orders/Filters/{FinancialStatus|PaymentGateway|ProcessingMethod}
GET /Stores/{id}/Orders/Approval/TotalSoldBy{FinancialStatus|ProcessingMethod|PaymentGateway}
GET /Stores/{id}/Orders/Approval/TotalSoldBy{...}ByDate
```

> Para e-commerce brasileiro, esta é uma das telas de maior valor prático — taxa de aprovação por gateway e por método costuma esconder perdas relevantes.

---

### 6.3 Pedidos › Regiões

**Rota:** `/orders/regions`

- **Mapa de Pedidos por Estado** (coroplético)
- **Visão Geral Regional**
- **Tabela "Pedidos por Estado"** e **Tabela "Pedidos por Cidade"**, ambas com CSV

Colunas (as duas tabelas compartilham a mesma família de métricas):
Estado/Cidade · Total Pago · Porcentagem do Total Pago · Total Capturado · Taxa de Aprovação · Pedidos Pagos · Pedidos Capturados · Ticket Médio · Clientes · Itens · Itens por Pedido · Total de Descontos · Desconto por Pedido Pago

Filtros: País, Estados, Cidades (multi-select) + toggles de canal.

```
GET  /Stores/{id}/Orders/Filters/{CountryCodes|Provinces|Cities}
POST /Stores/{id}/Orders/Regions/SalesPerProvince        [sortField=totalBilled, sortOrder=desc]
POST /Stores/{id}/Orders/Regions/SalesPerCityComparison
```

---

### 6.4 Pedidos › Lista

**Rota:** `/orders/list`
**Objetivo:** nível transacional — busca, auditoria e rentabilidade pedido a pedido.

| Coluna                                  | Observação                                               |
| --------------------------------------- | -------------------------------------------------------- |
| Pedido · Data · Canal · Origem · Status | Identificação e contexto                                 |
| Cliente · Email · Telefone              | Dados do comprador                                       |
| Total Vendido · Itens                   | Valores                                                  |
| **Custo**                               | CMV dos itens (depende do cadastro de custo por produto) |
| **Lucro Bruto**                         | Total Vendido − Custo                                    |
| **Margem**                              | Lucro Bruto ÷ Total Vendido                              |

Busca: "Buscar por pedido, cliente ou email". Filtros: Canal, Origem, Status, Gateways, Métodos, Cupom, País, Estados, Cidades. Paginação 10/20/50/100. CSV.

```
POST /Stores/{id}/Orders/Table [page, limit, sortField=orderName, sortOrder=desc, startDate, endDate, groupBy]
```

---

## 7. Recompra

Duas abas: **Resumo · LTV e CAC**.

### 7.1 Recompra › Resumo

**Rota:** `/repurchase/summary`
**Objetivo:** medir dependência de nova aquisição vs. base recorrente.

Detalhe de UX interessante: **os KPIs são rotulados como perguntas de negócio**, não como nomes técnicos.

#### Bloco Receita

- Quanto é o total vendido?
- Quanto é o total vendido em pedidos de recompra?
- Qual é a taxa de pedidos de recompra em relação ao total vendido?

#### Bloco Pedidos

- Quantos pedidos eu fiz neste período?
- Quantos pedidos de recompra eu fiz neste período?
- Qual é a taxa de pedidos de recompra em relação ao total de pedidos?

#### Bloco Intervalo entre compras (6 cards, em dias)

Dias entre o primeiro e o **segundo / terceiro / quarto / quinto / sexto / sétimo-ou-mais** pedido.

#### Bloco Clientes

- Total de Clientes
- Total de Clientes com Recompra
- Taxa de Clientes com Recompra
- Quantas vezes um cliente compra na minha loja ao longo da vida? (frequência de compra)

#### Gráficos

| Título                                            | Tipo           | Eixos                                |
| ------------------------------------------------- | -------------- | ------------------------------------ |
| Quanto eu vendi neste período?                    | Série temporal | X = data, Y = R$                     |
| Quanto do que eu vendi foi de Compra vs Recompra? | Donut          | 2 fatias                             |
| Quanto eu vendi em comparação ao total vendido?   | Barras         | X = ordem do pedido (1º, 2º, …, 7º+) |
| Quanto é o ticket médio do pedido?                | Barras         | X = ordem do pedido, Y = R$          |

> **Conceito-chave a copiar:** a **ordem de compra do cliente** ("order number") é cidadã de primeira classe, truncada em "7 ou mais". Praticamente todo o módulo se apoia nisso. Em SQL: `row_number() over (partition by customer_id order by created_at)`.

```
GET /Stores/{id}/Repurchases/Summary/TotalSoldVsRepurchases
GET /Stores/{id}/Repurchases/Summary/TotalSoldPerOrderNumberByDate
GET /Stores/{id}/Repurchases/Summary/NumberOfOrdersVsRepurchases
GET /Stores/{id}/Repurchases/Summary/NumberOfOrdersPerOrderNumberByDate
GET /Stores/{id}/Repurchases/Summary/DaysToRepurchase
GET /Stores/{id}/Repurchases/Summary/TotalSoldPerOrderNumber
GET /Stores/{id}/Repurchases/Summary/CustomersRepurchaseOverview
GET /Stores/{id}/Repurchases/Summary/AverageOrderValuePerOrderNumber
```

---

### 7.2 Recompra › LTV e CAC

**Rota:** `/repurchase/ltv-and-cac`
**Objetivo:** economia unitária da aquisição.

#### KPIs

| KPI                  | Definição                                        |
| -------------------- | ------------------------------------------------ |
| Lifetime Value       | Receita média total por cliente ao longo da vida |
| CAC                  | Investimento em mídia ÷ novos clientes           |
| LTV/CAC              | Razão (referência de mercado: saudável ≥ 3)      |
| Frequência de Compra | Pedidos médios por cliente                       |
| Novos Clientes       | Clientes em primeira compra no período           |

#### Gráficos

| Título                                             | Leitura                                                          |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| LTV x CAC no Tempo                                 | Evolução da relação                                              |
| CAC x Número de Novos Clientes no Tempo            | Eixo duplo — mostra se escalar aquisição encarece o CAC          |
| CAC x CPA no Tempo                                 | Diferença entre custo por _cliente novo_ e custo por _conversão_ |
| Taxa de Retenção de Clientes por Número de Pedidos | % que avança da compra n para n+1                                |

```
GET /Stores/{id}/Repurchases/LTVCAC/Overview
GET /Stores/{id}/Repurchases/LTVCAC/LifetimeValueVSCustomerAcquisitionCostByDate
GET /Stores/{id}/Repurchases/LTVCAC/CustomerAcquisitionCostVsNumberNewCustomersByDate
GET /Stores/{id}/Repurchases/LTVCAC/CustomerAcquisitionCostVSCostPerAcquisitionByDate
GET /Stores/{id}/Repurchases/LTVCAC/CustomerRetentionByPurchaseNumber
```

**Dependência dura:** este módulo só existe se houver conexão com Meta Ads / Google Ads, porque CAC e CPA dependem de `ad_spend` diário.

---

## 8. Clientes (RFM)

**Rota:** `/customers` — título interno "Analise RFM"
**Objetivo:** segmentar a base por **Recência, Frequência e valor Monetário** e extrair listas acionáveis para campanhas.

> Esta tela **não usa o seletor de período do header** — trabalha sobre a base acumulada. As janelas temporais ficam dentro do painel de filtros.

### Visualização

**Treemap de segmentos RFM** — _"Distribuição por segmento. O tamanho de cada área representa quantos clientes existem na base."_ Há dois endpoints (por número de clientes e por total vendido), o que indica que área e cor representam dimensões diferentes.

### Tabela

Nome · Email · Telefone · Segmento RFM · Pedidos · Total Vendido. Paginação 10/20/50/100. CSV.

### Painel de filtros (o mais rico da plataforma)

| Filtro                          | Tipo                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| Compras entre                   | Range de datas                                                                                   |
| Primeira Compra entre           | Range de datas (coorte de aquisição)                                                             |
| Última Compra entre             | Range de datas (recência)                                                                        |
| **Filtro de Produtos**          | Construtor de regras: `Comprou` / `Não comprou` + multi-select de produtos, N regras empilháveis |
| Segmentos RFM                   | Multi-select                                                                                     |
| Origem                          | Multi-select                                                                                     |
| Dias sem Comprar                | Multi-select de faixas                                                                           |
| Gateways / Métodos de Pagamento | Multi-select                                                                                     |
| Países / Estados / Cidades      | Multi-select                                                                                     |
| Cupons de Desconto              | Multi-select + toggle **Incluir** (inverte para incluir/excluir)                                 |
| Total Vendido                   | Range slider (min/max vindos da API)                                                             |
| Pedidos                         | Range slider                                                                                     |

```
GET  /Stores/{id}/Customers/RFM/NumberOfCustomers
GET  /Stores/{id}/Customers/RFM/TotalSold
POST /Stores/{id}/Customers/Table                      [page, limit, sortField, sortOrder; filtros no body]
GET  /Stores/{id}/Customers/Table/Filters/{Products|Sources|RFMSegments|DaysWithoutPurchase|
       Countries|Provinces|Cities|DiscountCodes|PaymentGateway|ProcessingMethod}
GET  /Stores/{id}/Customers/Table/Filters/RangeTotalSoldPerClient
GET  /Stores/{id}/Customers/Table/Filters/RangeNumberOfOrdersPerClient
```

### Para replicar

Uma tabela agregada **um registro por cliente**: identidade (nome, email, telefone), `first_order_at`, `last_order_at`, `orders_count`, `total_spent`, `days_since_last_purchase`, scores R/F/M (quintis) e `rfm_segment` (rótulo textual: Campeões, Leais, Em risco, Hibernando etc.), além de listas desnormalizadas para filtro (produtos comprados, cupons usados, gateways, métodos, geografia, origem).

> **Esta é a tela que conecta análise com ação:** o resultado filtrado alimenta as campanhas de WhatsApp/e-mail. Se você for construir só uma coisa além dos dashboards básicos, construa esta.

---

## 9. Produtos

Três abas: **Resumo · Lista · Estoque**.

### 9.1 Produtos › Resumo

**Rota:** `/products/summary`

#### KPIs

Receita Total de Produtos (exclui frete) · Total de Itens Vendidos · Valor Médio por Item · Média de Itens por Pedido

#### Cinco blocos tabulares

| Bloco                             | Colunas                                                                                                         |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Volume de Vendas de Produtos**  | Nome · Quantidade · Total Vendido · Margem (toggle Top 20 / Últimos 20)                                         |
| **Taxa de Conversão de Produtos** | Nome · Sessões · Quantidade · Pedidos · Taxa de Conversão (toggle Top/Últimos)                                  |
| **Risco de Estoque**              | Nome · Variante · Estoque Atual · Vendas Diárias Estimadas · Dias para Zerar o Estoque · Data Estimada de Falta |
| **Produtos Fora de Estoque**      | Nome · Variante · Estoque Atual · Dias Desde a Última Venda · Última Venda · **Receita Perdida**                |
| **Produtos Comprados Juntos**     | Produto 1 · Produto 2 · Vezes Comprados Juntos · Valor Médio do Pacote (CSV)                                    |

**Visualizar por:** Produtos · Categoria · Subcategoria (param `viewMode`)
**Filtros:** Categorias · Subcategorias · Produtos · Marcas · Coleções

```
GET /Stores/{id}/Products/Summary/BigNumbers
GET /Stores/{id}/Products/Summary/ProductsBySalesVolume       [+ limit, sortOrder, viewMode]
GET /Stores/{id}/Products/Summary/ProductsByConversionRate    [+ limit, sortOrder, viewMode]
GET /Stores/{id}/Products/Summary/ProductsAtInventoryRisk     [+ daysToZeroInventoryThreshold]
GET /Stores/{id}/Products/Summary/ProductsOutOfInventory
GET /Stores/{id}/Products/Summary/ProductsSoldTogether        [+ page, limit, sortField, sortOrder]
```

---

### 9.2 Produtos › Lista

**Rota:** `/products/list`

Dois blocos: **Análise ABC** (curva de Pareto por receita acumulada) e a tabela **Produtos**.

| Coluna                | Significado                                   |
| --------------------- | --------------------------------------------- |
| Nome                  | —                                             |
| Classificação         | Classe da curva ABC (A/B/C)                   |
| Categoria             | —                                             |
| Saúde do Estoque      | Status qualitativo (ok / risco / sem estoque) |
| Sessões               | Visitas à página do produto                   |
| Unidades Vendidas     | —                                             |
| Taxa de Conversão     | Pedidos ÷ sessões                             |
| Total Vendido         | Receita bruta                                 |
| Porcentagem de Vendas | Participação na receita total                 |
| Lucro Total           | Receita − custo                               |
| Preço Médio           | Receita ÷ unidades                            |
| Custo                 | CMV das unidades vendidas                     |
| Margem                | Lucro ÷ receita                               |

Filtros: Categorias, Subcategorias, Marcas, Coleções, Produtos, Cupom de Desconto, Origem + toggles de canal.

```
GET /Stores/{id}/Products/ProductTable   [+ page, limit, sortField, sortOrder]
GET /Stores/{id}/Products/ABCAnalysis
```

---

### 9.3 Produtos › Estoque ⭐

**Rota:** `/products/inventory` — **não tem seletor de período** (é snapshot + janelas fixas).

| Coluna                                             | Significado                                 |
| -------------------------------------------------- | ------------------------------------------- |
| Nome do Produto · Variante · SKU                   | Identificação                               |
| Estoque                                            | Saldo atual                                 |
| Vendas Desde o início / 90 dias / 30 dias / 7 dias | Janelas fixas de venda                      |
| **Velocidade de Produto**                          | Unidades vendidas por dia                   |
| **Dias para Zerar Estoque**                        | Estoque ÷ velocidade                        |
| **Data de Fim de Estoque**                         | Data projetada da ruptura                   |
| Última Venda                                       | Data                                        |
| **Valor do Estoque**                               | Estoque × custo (capital imobilizado)       |
| **Potencial de Receita**                           | Estoque × preço de venda                    |
| **Receita Perdida Desde Ruptura**                  | Receita não realizada desde que zerou       |
| **Custo de Ruptura/Dia**                           | Perda diária estimada por estar sem estoque |

Filtros por chips: **Estoque** (Risco de Estoque · Maior velocidade de venda · Sem Estoque) e **Mais Vendidos** (Todos os Tempos · 90 · 30 · 7 dias) + Categorias/Subcategorias/Marcas/Coleções.

```
GET /Stores/{id}/Products/Inventory/DetailsTable  [page, limit, sortField, sortOrder]
```

> As colunas "Receita Perdida Desde Ruptura" e "Custo de Ruptura/Dia" são o tipo de métrica que justifica a assinatura: transformam um problema operacional invisível em número em reais.

---

## 10. Financeiro

### 10.1 Financeiro › Resumo (DRE gerencial)

**Rota:** `/finance/summary`

Dois blocos: **Indicadores Gerenciais** (com CSV) e **Análise Financeira** — uma tabela em formato matriz onde a coluna 1 é "Métricas" e as demais são períodos conforme o `groupBy`. Tem botão **"Investigar Análise Financeira com IA"**.

#### Estrutura do DRE

```
Receita Total
  ├─ Receita de Produtos
  └─ Receita de Frete
Custos Totais                    (CMV + checkout + gateway + marketplace + impostos + frete)
= Lucro Bruto
Despesas Totais de Marketing     (ads + agência + comissões + ferramentas)
= Margem de Contribuição
Despesas Operacionais Totais     (aluguel, salários, software, ferramentas, PDV, outros)
= Lucro Líquido
```

```
GET /Stores/{id}/Finance/Summary/ManagerialIndicators
GET /Stores/{id}/Finance/Summary/FinancialAnalysis
```

---

### 10.2 Financeiro › Custos ⭐ (o motor do modelo financeiro)

**Rota:** `/finance/costs`
**Objetivo:** cadastrar a estrutura de custos e despesas que alimenta o DRE, as margens e o lucro em todas as outras telas.

#### Tabela

Nome · Descrição · Início · Fim · Canal · Categoria · Subcategoria · Frequência · Valor

#### Formulário "Adicionar Custo ou Despesa"

| Campo                  | Opções                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Nome                   | texto (máx. 75)                                                                                                                   |
| Descrição              | textarea (máx. 250)                                                                                                               |
| **Unidade de Negócio** | E-commerce · Marketplace · Ambos                                                                                                  |
| **Categoria**          | Custo de Mercadorias Vendidas · Vendas e Marketing · Operacional                                                                  |
| **Subcategoria**       | dependente da categoria (ver abaixo)                                                                                              |
| **Frequência**         | Diário · Semanal · Mensal · Anual · Não Recorrente · **Por Pedido** · **Percentual por Pedido** · **Percentual por Gasto em Ads** |
| Valor                  | moeda                                                                                                                             |
| Início / Fim           | datas (vigência)                                                                                                                  |

#### Subcategorias por categoria

| Categoria                         | Subcategorias                                                                                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Custo de Mercadorias Vendidas** | Anti-Fraude · Checkout · Frete · Gateway · Impostos · Matéria-Prima · Plataforma · Produto · Taxa de Marketplace                                                                    |
| **Vendas e Marketing**            | Agência · Comissão · Email Marketing · Facebook Ads · Google Ads · Imposto Facebook Ads · Imposto Google Ads · Imposto TikTok Ads · Retail Media · Taxa de Marketplace · TikTok Ads |
| **Operacional**                   | Aluguel · Aplicativos · Ferramentas · Outros · PDV · Salário · Software                                                                                                             |

```
GET /stores/{id}/costs  [limit, page, sortField, sortOrder, startDate, endDate]
```

> **Se você for replicar uma coisa com rigor, replique isto.** O motor precisa suportar as 8 frequências — incluindo os dois modos percentuais (por pedido e por gasto em ads) — com vigência por intervalo e segmentação por unidade de negócio. Sem esse cadastro, não existem margem, lucro, CAC real nem DRE em nenhuma outra tela.

---

## 11. Métricas — análise narrativa por IA ⭐

**Rota:** `/analysis` (menu: "Métricas") · param próprio `analysisMetric={slug}`
**Objetivo:** para **uma métrica escolhida**, gerar uma análise em linguagem natural com veredito, comparação com benchmark de mercado, KPI principal, série temporal e os drivers que explicam o resultado.

É, conceitualmente, a seção mais diferenciada da plataforma: transforma o dashboard em diagnóstico.

### 11.1 As 14 métricas disponíveis

| #   | Métrica                             | Slug conhecido |
| --- | ----------------------------------- | -------------- |
| 1   | Total Vendido _(padrão)_            | —              |
| 2   | Pedidos                             | —              |
| 3   | Sessões                             | —              |
| 4   | Conversão                           | `conversion`   |
| 5   | Ticket Médio do Pedido              | —              |
| 6   | Taxa de Recompra                    | `repeat_rate`  |
| 7   | Taxa de Desconto                    | —              |
| 8   | Taxa de Cancelamento e Reembolso    | —              |
| 9   | ROAS                                | `roas`         |
| 10  | ROI                                 | —              |
| 11  | CPA (Custo por Aquisição)           | —              |
| 12  | CAC (Custo de Aquisição de Cliente) | —              |
| 13  | CPS (Custo por Sessão)              | —              |
| 14  | CPC (Custo por Clique)              | —              |

### 11.2 Estrutura fixa da página

1. **Controles** — seletor de métrica + seletor de período
2. **Faixa de contexto** — "Período analisado: 01/09 – 10/09" · "Comparado ao período anterior: 22/08 – 31/08" (janela anterior do mesmo tamanho, calculada automaticamente) · botão **Baixar PDF**
3. **Nudge** — "Adicione o contexto do negócio para receber respostas e planos mais relevantes da IA" → link para `/settings/business-context`
4. **Card de análise (IA)**
   - **Veredito** — badge (Positivo / Neutro / Negativo)
   - **Selo de benchmark** — ex.: `BENCHMARK INDISPONÍVEL`
   - **Título gerado por IA**, específico da métrica e do período
   - **Corpo em 2 parágrafos**: (a) diagnóstico e contexto de mercado; (b) alavancas recomendadas
5. **KPI principal** — nome em caixa alta, valor grande, comparação "Mesmo período do ano anterior"
6. **Gráfico temporal** — "{Métrica} ao longo do tempo", com legenda _"Linha sólida é a sua loja. Linha tracejada é o período anterior."_ e uma terceira série de benchmark do setor quando disponível
7. **Drivers** — o título muda conforme a natureza da métrica:
   - **"O que impulsionou isso"** para métricas de resultado
   - **"Sinais relacionados"** para métricas de eficiência

### 11.3 Como os drivers mudam por métrica

| Métrica          | Seção                  | Drivers exibidos                                                                 |
| ---------------- | ---------------------- | -------------------------------------------------------------------------------- |
| Total Vendido    | O que impulsionou isso | Sessões · Conversão · Ticket Médio · Taxa de Desconto                            |
| Conversão        | Sinais relacionados    | Pedidos · Sessões · Proporção de Novas Sessões · Taxa de Desconto · Ticket Médio |
| ROAS             | Sinais relacionados    | Investimento em Anúncios · Total Vendido · Conversão · Ticket Médio              |
| Taxa de Recompra | Sinais relacionados    | Clientes Recorrentes · Novos Clientes · Clientes Compradores                     |

As recomendações também são específicas: para Receita fala em tráfego, checkout e bundles; para Conversão em UX, velocidade de página e clareza do PDP; para ROAS em alocação de orçamento e landing pages; para Recompra em fluxos de e-mail pós-venda, fidelidade e assinatura.

### 11.4 Endpoint

```
GET /Stores/{id}/Analysis  [startDate, endDate, groupBy, metric, language]
```

Um único endpoint devolve o pacote completo. O backend precisa: (1) resolver a janela de comparação automática; (2) calcular a métrica e seus drivers nos dois períodos; (3) buscar o benchmark setorial; (4) montar o prompt com o _contexto do negócio_ da loja; (5) gerar o texto; (6) permitir export em PDF.

> **Padrão de arquitetura a copiar:** para cada métrica existe uma **árvore de drivers** definida no código (Receita = Sessões × Conversão × Ticket Médio, ajustada por Desconto). A IA não "descobre" os drivers — ela recebe a árvore já calculada nos dois períodos e escreve o texto. Isso deixa a narrativa correta e barata.

---

## 12. Metas

**Rotas:** `/goals` (Resumo) e `/goals/edit` (Planejamento)
**Objetivo:** definir metas mensais por KPI e acompanhar Realizado × Meta com projeção.

### 12.1 Aba Resumo

Cada KPI é um card com: nome + **switch "Acumulado"** · **Realizado** · **Meta** · **Diferença** · barra **"Caminho para a meta"** (pacing).

Ações: **Adicionar/Editar** e **Planejar com IA**.

#### Os 15 KPIs, por grupo

| Grupo                  | KPIs                                                                              |
| ---------------------- | --------------------------------------------------------------------------------- |
| **Vendas**             | Total Vendido · Número de Pedidos · Ticket Médio                                  |
| **Marketing**          | Investimento em Tráfego Pago · ROAS · Investimento Total em Marketing · ROI · CPA |
| **Tráfego E-commerce** | Sessões · Taxa de Conversão · Custo por Sessão · Receita por Sessão               |
| **Recompra**           | % Recompra · Novos Clientes · CAC                                                 |

### 12.2 Aba Planejamento

Grade com **abas de ano** (2024–2027), linhas = métrica, colunas = os 12 meses.

**O usuário informa apenas 6 drivers por mês:**
Total Vendido (R$) · Ticket Médio (R$) · Taxa de Conversão (%) · Investimento em Tráfego Pago (R$) · Outros Investimentos em Marketing (R$) · % Recompra (%)

**O sistema deriva o resto (read-only):**

| Derivada                        | Fórmula                                                   |
| ------------------------------- | --------------------------------------------------------- |
| Pedidos                         | Total Vendido ÷ Ticket Médio                              |
| Sessões                         | Pedidos ÷ Taxa de Conversão                               |
| ROAS                            | Total Vendido ÷ Tráfego Pago                              |
| Investimento Total em Marketing | Tráfego Pago + Outros                                     |
| ROI                             | (Total Vendido − Investimento Total) ÷ Investimento Total |
| CPA                             | Investimento Total ÷ Pedidos                              |
| Novos Clientes                  | Pedidos × (1 − % Recompra)                                |
| CAC                             | Investimento Total ÷ Novos Clientes                       |

```
GET /stores/{id}/goals/actual-vs-goal  [startDate, endDate, groupBy, comparing, metric, isAccumulated]
```

O front chama esse endpoint **uma vez por KPI**. É preciso um motor de _pacing_ (meta proporcional aos dias decorridos) para a barra "Caminho para a meta".

> **Excelente decisão de produto:** pedir 6 números e derivar 8 reduz drasticamente o atrito de planejar o ano, e ainda educa o lojista sobre a relação entre as métricas.

---

## 13. Benchmark

**Rota:** `/benchmark` — "Benchmark de mercado"
**Objetivo:** comparar os indicadores da loja com o mercado.

**Grupos de comparação (abas):** **Mercado** · **Setor** · **Lojas similares**

Regra de liberação, exibida no tooltip (i): _"Setor e Lojas similares precisam de pelo menos 10 lojas comparáveis que usem a mesma moeda."_ Com o setor não configurado, essas duas abas ficam desabilitadas e aparece o aviso _"Exibindo o benchmark amplo de mercado — Informe o setor da loja para liberar comparações por setor e com lojas similares"_ + link para o Contexto do Negócio.

```
GET /Stores/{id}/Benchmark  [startDate, endDate, groupBy, comparing]
```

### Para replicar

Requer um pool agregado e **anonimizado** de lojas com setor/vertical, moeda e métricas normalizadas por período, com regra de k-anonimato (mínimo de 10 lojas comparáveis). É um recurso que só existe com escala — em uma plataforma nova, comece com benchmarks públicos de setor e a **média histórica da própria loja**, que já entrega 80% do valor.

---

## 14. Planos de ação

**Rota:** `/action-plans`
**Objetivo:** _"Transforme problemas da loja em trabalho claro que sua equipe pode assumir e acompanhar."_

### Onboarding em 3 passos (estado vazio)

| Passo | Título                               | Texto                                                                                                   |
| ----- | ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 1     | Descreva o problema                  | "Descreva o que não está funcionando, o que mudou ou qual resultado você quer melhorar."                |
| 2     | Revise o rascunho                    | "Crie o rascunho manualmente ou deixe a Prax investigar os dados disponíveis e sugerir ações práticas." |
| 3     | Acompanhe o trabalho e os resultados | "Atribua o trabalho, avance as ações pelo quadro e revise o que mudou depois da execução."              |

Dois caminhos de criação: **+ Criar manualmente** e **✨ Criar com IA**.

### Formulário "Criar plano de ação"

| Campo                   | Obrigatório | Placeholder                                                          |
| ----------------------- | ----------- | -------------------------------------------------------------------- |
| Título                  | ✱           | "Ex.: Recuperar a conversão no checkout mobile"                      |
| Problema                | ✱           | "O que está acontecendo, o que mudou ou o que não está funcionando?" |
| Objetivo                | ✱           | "Qual resultado este plano deve alcançar?"                           |
| Título da primeira ação | ✱           | "Ex.: Revisar o fluxo do checkout no celular"                        |

O caminho por IA abre o Assistente Prax com o chip de contexto _"Analisando: Criar um plano de ação"_ e a pergunta inicial: _"Qual é o principal desafio ou oportunidade que você gostaria de focar no seu plano de ação hoje?"_

### Modelo de dados

```
ActionPlan { id, storeId, title, problem, objective, status, createdBy, createdAt }
Action     { id, planId, title, instructions, assignee, boardColumn, resultMetric }
```

O passo 3 implica um **quadro kanban** com colunas de workflow e atribuição de responsável.

```
GET  /stores/{id}/action-plans
POST /stores/{id}/action-plans
```

---

## 15. Automações — WhatsApp

**Rotas:** `/whatsapp/home`, `/whatsapp/main`, `/whatsapp/history`

### 15.1 Como está hoje na conta observada

O módulo é **feature-flagged por loja** e só é liberado após ativação comercial. Sem ativação, as três rotas renderizam a mesma tela de teaser:

- Título: **"Transforme o WhatsApp em vendas"**
- Quatro cards de benefício: Campanhas para os clientes certos · Automações de vendas (incl. recuperação de carrinho) · Conversas em um só lugar · Suporte completo para o canal na Meta
- Bloco "Configuração guiada e suporte contínuo" em 3 passos: configurar Meta/360dialog/Prax → validar e liberar → suporte contínuo
- CTA: **"Agendar meu onboarding de WhatsApp"** → link `wa.me` direto para o time comercial

> **Observação de produto:** mesmo sem o recurso liberado, a tela vende o recurso e captura a intenção via WhatsApp humano. É um padrão barato e eficaz para lançar módulos.

### 15.2 O módulo completo (mapeado no código do app)

Provedor: **360dialog** sobre a WhatsApp Business Platform da Meta.

#### Telas existentes

| Área            | Telas                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Painel**      | Dashboard WhatsApp                                                                                                        |
| **Campanhas**   | Lista, Assistente de criação (wizard), Detalhes, Histórico, Filtros de audiência                                          |
| **Templates**   | Gerenciador, Detalhes, Criação simples, Editor de cabeçalho, Preview dinâmico                                             |
| **Contatos**    | Listas salvas, Detalhes da lista, Criação manual de lista, Contatos, Bloqueados, Opt-outs                                 |
| **Atendimento** | Inbox de conversas, mensagens interativas                                                                                 |
| **Automações**  | Hub, Carrinho Abandonado, Cashback (Shopify / Nuvemshop / genérico), Pedidos Pendentes, Rastreamento, Resposta Automática |
| **Flows**       | Lista de flows, Flow Builder                                                                                              |
| **Mídia**       | Galeria, seletor de imagem                                                                                                |
| **Config.**     | Integração, Configurações de mensageria, Calculadora de custo                                                             |

#### Painel WhatsApp — blocos

| Bloco                    | Conteúdo                                                                                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Informações da Conta** | Canal 360Dialog · ID do Canal · Telefone Conectado · Limite Diário (mensagens/dia)                                                                                                                                    |
| **Saldo da Conta**       | Saldo atual, granularidade Diário/Semanal/Mensal, última atualização                                                                                                                                                  |
| **Campanhas**            | Gráfico de volume + tabela: Campanha · Data Criação · Enviadas · Entregues · Lidas · Falhas · Entrega % · Leitura % · **Receita Influenciada** · **Custo (BRL)** · **ROI** · Detalhes. Botão "Calcular ROI e Receita" |
| **Templates**            | Template · Enviadas · Entregues · Lidas · Falhas · Entrega % · Leitura % · Conversões · Conversão % · Receita · Campanhas                                                                                             |
| **Atendimento**          | Lista de conversas, filtro ao vivo, contador de não lidas, nova conversa                                                                                                                                              |
| **Listas de contatos**   | Nome · tags · nº de contatos · ativo/inativo · aviso de contatos incompletos                                                                                                                                          |

#### Agendamento de campanha

Modal "Agendar Campanha" com Data e Horário do disparo em **BRT (Brasília)**, validação de mínimo 5 minutos no futuro.

#### Conexão do canal

Campo **API Key** da 360dialog (mín. 10 caracteres, obtida no painel da 360dialog) + telefone com seletor de país (Brasil +55, EUA +1) com validação de formato. Após confirmar: estado "Canal em Ativação".

### 15.3 Para replicar

O ponto mais importante é a **ligação entre segmentação e disparo**: as audiências de campanha vêm dos mesmos filtros da tela de Clientes (RFM). E o **ROI por campanha de WhatsApp** exige atribuir receita a mensagens enviadas — na prática, casar telefone do contato com pedidos posteriores dentro de uma janela de atribuição.

As automações são implementadas **por plataforma de e-commerce** (carrinho abandonado e cashback têm versões separadas para Shopify, Nuvemshop e Tray), porque dependem de webhooks específicos de cada uma.

---

## 16. Conexões (integrações)

**Rota:** `/connections` · criação em `/connections/create/{connectorId}`

### 16.1 Estrutura da tela

1. **Card de status principal** — badge Conectado/Não Conectado + "A Prax precisa de uma fonte de e-commerce ou ERP primeiro para importarmos produtos, pedidos, clientes e histórico de vendas." + botão **Atualizar status**
2. **Preparação dos dados** — stepper de 4 etapas:

| Etapa                   | Descrição                                             |
| ----------------------- | ----------------------------------------------------- |
| Fonte da loja conectada | "O acesso ao e-commerce ou ERP está autorizado."      |
| Importando dados        | "Os dados históricos da loja estão sendo importados." |
| Processando análises    | "A Prax está preparando tabelas de análise."          |
| Pronto para usar        | "Os dashboards podem usar os dados desta loja."       |

3. **Integrações conectadas**
4. **Conectores disponíveis**, agrupados por categoria, cada card com botão "+" que leva a uma rota dedicada de criação

> **Copie o stepper.** Importação de histórico de e-commerce leva horas; comunicar as 4 fases evita a sensação de produto quebrado durante o onboarding.

### 16.2 Catálogo completo de conectores

| Conector               | Categoria  | O que exige para conectar                                         |
| ---------------------- | ---------- | ----------------------------------------------------------------- |
| **Google Analytics 4** | Marketing  | OAuth                                                             |
| **Google Ads**         | Marketing  | OAuth                                                             |
| **Facebook Ads**       | Marketing  | OAuth                                                             |
| **TikTok Ads**         | Marketing  | OAuth                                                             |
| **Nuvemshop**          | E-commerce | Domínio da loja (`store.lojavirtualnuvem.com.br`) → OAuth         |
| **Tray**               | E-commerce | Domínio → OAuth                                                   |
| **Bagy**               | E-commerce | Código de Conexão (token) + domínio (`domain.dooca.store`)        |
| **Bagy 3.0**           | E-commerce | Apenas domínio → redirecionamento                                 |
| **Vnda**               | E-commerce | Código de Conexão + domínio                                       |
| **VTEX**               | E-commerce | Token da API + App Key + Nome da conta (auto-preenchido)          |
| **Wbuy**               | E-commerce | Client Secret (campo _user_) + Token de Acesso (campo _password_) |
| **Shopify**            | E-commerce | Instalação via Shopify App Store                                  |
| **Magazord**           | E-commerce | Usuário + Senha + URL base                                        |
| **Mercado Livre**      | E-commerce | OAuth                                                             |
| **Tiny**               | ERP        | Código de Conexão (token API v2)                                  |
| **Bling**              | ERP        | OAuth (+ mapeamento de canais e de situações de pagamento)        |

**Três padrões de autenticação** a suportar: OAuth puro · domínio + OAuth · credenciais manuais (token/usuário/senha). A tela de criação adapta o corpo conforme o padrão, mas o botão final é sempre "Conectar-se a {Conector}".

O Bling tem ainda um sub-recurso de **mapeamento de situações de pagamento** (associar os status do ERP aos estados Pago / Pendente / Cancelado da Prax) — algo que qualquer integração de ERP vai precisar.

```
GET /stores/{id}/connections
GET /stores/{id}/connections/available
GET /stores/{id}/data-readiness
```

---

## 17. MCP / Agentes de IA

**Rota:** `/mcp` — "MCP - Agentes de IA"
**Objetivo:** expor os dados da plataforma a agentes de IA externos (Claude, Codex) via servidor MCP remoto com OAuth.

- **URL do endpoint MCP:** `https://api.prax.ai/mcp` (com botão Copiar URL)
- Aviso: _"Conexões MCP usam suas permissões atuais na Prax. Se você perder acesso a uma loja, o agente também perde acesso."_
- **Clientes MCP conectados** — tabela: Cliente · Acesso solicitado · Último uso · Reconectar após · **Revogar**

### Escopos na tela de autorização

**Leitura padrão** (dashboards, pedidos, etc.) fica ligada. **Dados sensíveis e escrita ficam desligados por padrão:**

| Escopo                             | Descrição                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| Compartilhar PII de clientes       | Nomes, e-mails, telefones e outros identificadores                                          |
| Compartilhar conversas de WhatsApp | Mensagens e referências de mídia                                                            |
| Gerenciar custos financeiros       | Criar/atualizar/excluir regras de custo — "cada escrita ainda requer confirmação explícita" |
| Escrita no WhatsApp                | Criar templates e audiências, enviar campanhas, responder conversas                         |

> **Modelo de segurança em duas camadas, vale copiar:** a permissão da loja (ver seção 18) **e** o consentimento OAuth por agente. Nenhum dos dois sozinho libera acesso.

---

## 18. Configurações, Contexto do Negócio, Usuários e Faturamento

### 18.1 Suas lojas (`/home`) e Criar loja (`/store/create`)

Grid de cards de loja; cada card mostra o nome e **"Última sincronização"** como principal sinal de saúde, com menu Editar/Excluir. Busca por nome + paginação.

**Formulário de criação:**

| Campo                    | Ajuda                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Idioma de preferência    | "Define o idioma da plataforma e a região fiscal padrão da loja." — pt-BR, pt-PT, es-AR, en |
| Nome da Loja             | —                                                                                           |
| **Principal segmento**   | "Usaremos isso para comparar sua loja com negócios parecidos."                              |
| Fuso horário             | lista IANA                                                                                  |
| Moeda                    | —                                                                                           |
| **Plataforma Principal** | Nuvemshop · Tray · Bagy · Tiny · Bling · Vnda · Vtex · Wbuy · Shopify · Bagy 3.0 · Magazord |

**Lista de segmentos:** Moda e vestuário · Beleza e cuidados pessoais · Saúde e bem-estar · Casa, móveis e decoração · Alimentos e bebidas · Pet · Autopeças e motopeças · Eletrônicos e acessórios · Esportes, outdoor e hobbies · Bebês, crianças e brinquedos · Profissional, industrial e B2B · Multicategoria · Ainda não sei · Outro

### 18.2 Configurações da loja (`/settings`)

Fuso horário · Moeda · **Zona de Perigo** com Excluir Loja.

### 18.3 Configurações do usuário (`/user-settings`)

Idioma · **Preferências de Notificação** (Atualizações Diárias por Email · Semanais · Emails Promocionais · Atualizações de Funcionalidades) · bloco MCP · Excluir Conta.

### 18.4 Contexto do Negócio (`/settings/business-context`) ⭐

_"Conte à Prax o que seus dados não mostram para que análises e planos de ação respeitem como o negócio realmente funciona."_

É, na prática, o **system prompt da IA da plataforma**. Tem um indicador de **Cobertura do contexto** ("0 de 6 áreas prontas") e um aviso de privacidade explícito ("Adicione estratégia, nunca senhas, dados de clientes ou segredos").

#### Visão geral da loja

Segmento principal (select) · Site público (URL, "a Prax poderá usá-lo em pesquisas públicas") · O que a loja oferece? (textarea 1000)

#### 1 · Negócio e posicionamento

- O que torna a loja realmente diferente? (textarea 1500)
- **Posicionamento de preço**: Econômico · Intermediário · Premium · Luxo · Misto · Outro
- **Modelos de venda** (múltipla): DTC · Marketplace · Atacado/B2B · Loja física · Assinatura · Sob encomenda · Outro
- **Foco atual do negócio** (cards): **Validar a oferta** · **Criar repetibilidade** · **Escalar aquisição** · **Otimizar e defender**

#### 2 · Cliente pretendido

Cliente pretendido (textarea 1500) · Problemas dos clientes (tags) · Resultados desejados (tags) · Gatilhos de compra (tags) · Principais objeções (tags) · Mercados-alvo (tags) · Exclusões intencionais (tags)

> Nota fina de produto: _"A Prax vai comparar isso com os clientes observados nos dados, sem presumir que são iguais."_

#### 3 · Produtos importantes _(opcional, depende de dados conectados)_

Seleção dos produtos e categorias com papel estratégico, sugeridos a partir dos dados.

#### 4 · Posição no mercado _(opcional)_

- **Diferenciação competitiva** — até 3 afirmações, cada uma com "Diferencial" + "Por que isso é verdade?"
- **Principais concorrentes** — 3 a 5, cada um com Nome · Relação (Direto/Aspiracional/Substituto) · URL · "Por que essa comparação é relevante?"

#### 5 · Como o negócio funciona

- **O que a Prax deve ajudar a proteger?** — "decisões conscientes que não devem ser confundidas com problemas de desempenho"
- **O que limita o negócio hoje?** — capacidade, equipe, orçamento, região, entrega
- **O que a Prax nunca deve recomendar?** — "táticas que a Prax nunca deve sugerir, mesmo quando poderiam melhorar uma métrica"

#### 6 · Marca e marketing _(opcional)_

Voz e estilo · Termos preferidos (tags) · Termos ou alegações proibidos (tags) · Avisos obrigatórios (tags) · Diretrizes de marketing · Texto que combina com a marca · Texto que não combina com a marca

> **Esta é provavelmente a peça mais inteligente da plataforma.** Os três campos da seção 5 — proteger, limitar, nunca recomendar — resolvem o maior problema de IA aplicada a negócio: recomendações genéricas que ignoram restrições reais. Se você construir IA no seu produto, construa este formulário primeiro.

```
GET/PUT /stores/{id}/business-context
```

### 18.5 Usuários (`/users`)

Lista de usuários com busca e paginação; menu por usuário com **Gerenciar Permissões** e **Remover**. Adicionar usuário começa por um campo de e-mail com busca.

#### As 22 permissões

| Grupo              | Permissões                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| **Módulo**         | Usar MCP / Agentes de IA                                                                                |
| **Consolidado**    | Assistente de IA · Clientes · Painel de Controle · Marketing · Pedidos · Produtos · Recompra · Usuários |
| **Administrativo** | Gerenciar Usuários · Cobrança · Conexões · Custos · Financeiro · Metas · Configurações/Custos da Loja   |
| **Outro**          | Receber Resumo Diário por Email                                                                         |
| **MCP (sensível)** | Expor PII de clientes · Ler conversas do WhatsApp · Acessar mídias do WhatsApp                          |

Há ainda o toggle **Proprietário da Loja** (concede tudo automaticamente, exceto a autorização do e-mail diário). Aviso importante: _"As permissões disponíveis refletem o plano atual e os add-ons ativos da loja."_ — ou seja, **o plano filtra quais permissões sequer aparecem**.

### 18.6 Faturamento (`/billing`)

Plano Atual (plano, ciclo, data de renovação) · Métodos de pagamento · Histórico de Faturas (Data · Valor · Status · Visualizar) · Cancelamento. Lojas instaladas via Shopify têm a assinatura gerenciada lá.

---

## 19. Camada de IA e Alertas

### 19.1 Assistente Prax AI

Botão **"Perguntar à IA"** no topo de toda página. Abre um **drawer lateral** (ou a página cheia em `/ai`).

Elementos notáveis:

- **Chip de contexto de página**: `👁 Vendo: {NomeDaPágina}` com um "x" para **não compartilhar aquela página com a IA**. O assistente enxerga a tela atual por padrão.
- Placeholder do input: _"O que você quer investigar, planejar ou fazer?"_
- Mensagem de posicionamento registrada no app: _"Eu investigo seus números, planejo metas e preparo ações na Prax. Você confirma antes de qualquer mudança."_
- Sugestões prontas, ex.: _"Crie uma campanha de WhatsApp para clientes inativos há 60 dias"_
- Feedback 👍/👎 e copiar em cada resposta; histórico de conversas

> **Dois detalhes que valem ouro:** (1) o chip de contexto de página, que torna explícito e revogável o que a IA está vendo; (2) a promessa de confirmação antes de qualquer escrita. Juntos, resolvem a desconfiança que trava a adoção de IA agêntica em ferramentas de negócio.

A IA aparece em **5 pontos**: análise narrativa por métrica · "Investigar com IA" no DRE · "Planejar com IA" nas Metas · "Criar com IA" nos Planos de ação · assistente geral. Todos consomem o **Contexto do Negócio**.

### 19.2 Alertas da loja (sino)

Drawer com abas **ABERTOS · RESOLVIDOS · PREFERÊNCIAS** e filtros por chip: Todos · Precisa de atenção · Tratados · Revisão. Ação "Tudo lido".

**Seis alertas configuráveis (todos ligados por padrão):**

| Alerta                                                                                   |
| ---------------------------------------------------------------------------------------- |
| Queda de vendas                                                                          |
| Queda de tráfego                                                                         |
| Queda de vendas do produto                                                               |
| Queda de conversão do produto                                                            |
| Risco de baixo estoque ("quando a demanda continuar forte e o estoque estiver acabando") |
| Variantes importantes indisponíveis                                                      |

```
GET /Stores/{id}/Alerts/UnreadCount
```

> Alertas são o que fazem o usuário voltar ao produto sem precisar lembrar dele. Combinados com o resumo diário por e-mail, são o motor de retenção da plataforma.

### 19.3 Suporte

Widget flutuante no canto inferior direito é **Chatwoot** (suporte humano), separado da IA.

---

## 20. Modelo de dados necessário para replicar

Toda a plataforma se sustenta em **7 entidades de fato** e algumas dimensões. Se essas tabelas existirem e forem alimentadas corretamente, todas as 24 telas se tornam consultas em cima delas.

### 20.1 Entidades de fato

| #   | Entidade                             | Campos essenciais                                                                                                                                                                                                                                                                                                                                   | Alimenta                           |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 1   | **Pedido**                           | `id`, `created_at`, `channel`, `source`, `utm_source/medium/campaign`, `financial_status`, `payment_gateway`, `processing_method`, `customer_id`, `total_price`, `product_revenue`, `shipping_revenue`, `total_discounts`, `discount_codes[]`, `country`, `province`, `city`, `sales_platform` (ecommerce/marketplace), `order_number_for_customer` | Quase tudo                         |
| 2   | **Item do pedido**                   | `order_id`, `product_id`, `variant_id`, `sku`, `qty`, `unit_price`, `unit_cost`                                                                                                                                                                                                                                                                     | Produtos, margem, comprados juntos |
| 3   | **Cliente** (agregado)               | `id`, `name`, `email`, `phone`, `first_order_at`, `last_order_at`, `orders_count`, `total_spent`, `days_since_last_purchase`, `r_score`, `f_score`, `m_score`, `rfm_segment`                                                                                                                                                                        | Clientes, Recompra, LTV            |
| 4   | **Produto / Variante**               | `id`, `sku`, `name`, `variant`, `category`, `subcategory`, `brand`, `collection`, `price`, `cost`, `stock_qty`, `last_sale_at`                                                                                                                                                                                                                      | Produtos, Estoque                  |
| 5   | **Sessão / evento de comportamento** | `date`, `sessions`, `users`, `view_item`, `add_to_cart`, `begin_checkout`, dimensões de origem, `product_id` (quando aplicável)                                                                                                                                                                                                                     | Conversão, Funil, Produtos         |
| 6   | **Investimento de mídia**            | `date`, `platform`, `campaign_id/name`, `adset_id/name`, `ad_id/name`, `spend`, `platform_fee`, `impressions`, `clicks`, `conversions`, `attributed_revenue`, `region`                                                                                                                                                                              | Marketing, ROAS, CAC, CPA          |
| 7   | **Custo / Despesa**                  | `name`, `description`, `business_unit`, `category`, `subcategory`, `frequency`, `value`, `start_date`, `end_date`                                                                                                                                                                                                                                   | Financeiro, margem, lucro          |

### 20.2 Entidades de configuração

| Entidade                                                   | Função                                                                   |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Loja**                                                   | Idioma, fuso, moeda, segmento, plataforma principal                      |
| **Conexão**                                                | Conector, credenciais, status, última sincronização, estágio de ingestão |
| **Contexto do negócio**                                    | O documento estratégico que alimenta a IA (seção 18.4)                   |
| **Meta**                                                   | (loja, ano, mês, métrica, valor)                                         |
| **Plano de ação / Ação**                                   | Kanban de execução                                                       |
| **Influenciador / Regra de remuneração / Cupom vinculado** | Hub de influenciadores                                                   |
| **Usuário / Permissão**                                    | 22 toggles filtrados pelo plano                                          |
| **Benchmark de mercado**                                   | Pool agregado e anonimizado por setor e moeda                            |

### 20.3 Camadas recomendadas

```
Fontes (e-commerce/ERP, Ads, GA4)
   ↓ ingestão (OAuth ou credenciais) + backfill histórico
Camada bruta (raw, espelho das APIs de origem)
   ↓ normalização
Camada modelo (as 7 entidades acima, unificadas entre plataformas)
   ↓ pré-agregação
Camada analítica (fatos diários por dimensão; tabela cliente com RFM;
                  snapshot de estoque; matriz produto×produto)
   ↓
API (um endpoint por bloco visual, envelope current/previous)
   ↓
Front-end (4 params na URL, componentes reutilizáveis)
```

A pré-agregação é o que torna viável ter 5 a 9 chamadas por página com tempo de resposta aceitável. Não tente calcular ROAS por região em cima da tabela bruta de pedidos a cada request.

---

## 21. Catálogo de métricas e fórmulas

Todas as métricas usadas na plataforma, com a fórmula inferida. Este é o material de referência para implementar a camada analítica.

### 21.1 Vendas

| Métrica                          | Fórmula                                    |
| -------------------------------- | ------------------------------------------ |
| Total Vendido / Receita Paga     | Σ valor dos pedidos com pagamento aprovado |
| Receita Capturada                | Σ valor de todos os pedidos criados        |
| Taxa de Aprovação                | Receita Paga ÷ Receita Capturada           |
| Receita de Produtos              | Σ (qty × preço unitário)                   |
| Receita de Frete                 | Σ valor de frete                           |
| Número de Pedidos                | Contagem                                   |
| Ticket Médio do Pedido (AOV)     | Receita ÷ nº de pedidos                    |
| Itens por Pedido                 | Σ itens ÷ nº de pedidos                    |
| Total de Descontos               | Σ descontos                                |
| Taxa de Desconto                 | Total de Descontos ÷ (Receita + Descontos) |
| Desconto Médio por Pedido        | Total de Descontos ÷ nº de pedidos         |
| Taxa de Cancelamento e Reembolso | (cancelados + reembolsados) ÷ total        |

### 21.2 Tráfego e conversão

| Métrica                    | Fórmula                                          |
| -------------------------- | ------------------------------------------------ |
| Sessões / Usuários         | Da fonte de analytics                            |
| Taxa de Conversão          | Pedidos ÷ Sessões                                |
| Receita por Sessão         | Receita ÷ Sessões                                |
| Custo por Sessão (CPS)     | Investimento ÷ Sessões                           |
| Proporção de Novas Sessões | Sessões de novos visitantes ÷ total              |
| Conversões de funil        | Cada etapa ÷ etapa anterior (8 razões — ver 5.1) |

### 21.3 Mídia paga

| Métrica                    | Fórmula                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| Investimento em Marketing  | Σ spend + (taxa da plataforma, se o toggle estiver ligado) + demais despesas de marketing |
| ROAS                       | Receita atribuída ÷ Investimento em anúncios                                              |
| ROI                        | (Receita − Investimento total) ÷ Investimento total                                       |
| CPA                        | Investimento ÷ nº de pedidos                                                              |
| CAC                        | Investimento ÷ nº de novos clientes                                                       |
| CPM                        | (Investimento ÷ Impressões) × 1.000                                                       |
| CPC                        | Investimento ÷ Cliques                                                                    |
| CTR                        | Cliques ÷ Impressões                                                                      |
| Classificação de qualidade | ROAS > 5 = Alto · 2 a 5 = Médio · < 2 = Baixo                                             |

### 21.4 Clientes e recompra

| Métrica                        | Fórmula                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| Ordem de compra do cliente     | `row_number() over (partition by customer_id order by created_at)`, truncado em 7+ |
| Pedido de recompra             | Ordem de compra ≥ 2                                                                |
| Taxa de Recompra (pedidos)     | Pedidos de recompra ÷ total de pedidos                                             |
| Taxa de Recompra (receita)     | Receita de recompra ÷ receita total                                                |
| Taxa de Clientes com Recompra  | Clientes com ≥ 2 pedidos ÷ total de clientes                                       |
| Frequência de Compra           | Total de pedidos ÷ total de clientes                                               |
| Dias até a n-ésima compra      | Média de (data da n-ésima − data da 1ª)                                            |
| Novos Clientes                 | Clientes com primeira compra no período                                            |
| LTV                            | AOV × Frequência de Compra (ou receita acumulada por coorte)                       |
| LTV/CAC                        | LTV ÷ CAC — referência de mercado: ≥ 3                                             |
| Retenção por número de pedidos | Clientes com ≥ n+1 pedidos ÷ clientes com ≥ n pedidos                              |
| Scores RFM                     | Quintis de recência, frequência e valor; segmento = combinação dos 3               |

### 21.5 Produtos e estoque

| Métrica                       | Fórmula                                                 |
| ----------------------------- | ------------------------------------------------------- |
| Margem                        | (Receita − Custo) ÷ Receita                             |
| Lucro Bruto                   | Receita − CMV                                           |
| Porcentagem de Vendas         | Receita do produto ÷ receita total                      |
| Curva ABC                     | Pareto acumulado por receita (A ≈ 80%, B ≈ 15%, C ≈ 5%) |
| Velocidade de Produto         | Unidades vendidas ÷ dias do período                     |
| Dias para Zerar Estoque       | Estoque atual ÷ velocidade                              |
| Data de Fim de Estoque        | Hoje + dias para zerar                                  |
| Valor do Estoque              | Estoque × custo unitário                                |
| Potencial de Receita          | Estoque × preço de venda                                |
| Custo de Ruptura/Dia          | Velocidade histórica × margem unitária                  |
| Receita Perdida Desde Ruptura | Custo de ruptura/dia × dias desde que zerou             |
| Comprados Juntos              | Co-ocorrência de pares de produtos no mesmo pedido      |

### 21.6 Financeiro

| Linha do DRE           | Fórmula                                                                   |
| ---------------------- | ------------------------------------------------------------------------- |
| Receita Total          | Receita de Produtos + Receita de Frete                                    |
| Custos Totais          | CMV + checkout + gateway + taxa de marketplace + impostos + frete         |
| Lucro Bruto            | Receita Total − Custos Totais                                             |
| Despesas de Marketing  | Ads + taxa das plataformas + agência + comissões + ferramentas + salários |
| Margem de Contribuição | Lucro Bruto − Despesas de Marketing                                       |
| Despesas Operacionais  | Aluguel + salários + software + ferramentas + PDV + outros                |
| Lucro Líquido          | Margem de Contribuição − Despesas Operacionais                            |

---

## 22. Roteiro de construção sugerido

Ordem em que eu construiria, considerando que cada fase já entrega valor sozinha.

### Fase 1 — Fundação (sem a qual nada funciona)

1. **Modelo de dados** — as 7 entidades de fato da seção 20
2. **Uma conexão só** — a plataforma onde o seu negócio realmente vende. Resista à tentação de construir 16 conectores
3. **Pipeline de ingestão** com backfill histórico e o **stepper de 4 etapas** visível ao usuário
4. **Os 4 parâmetros globais na URL** (`startDate`, `endDate`, `groupBy`, `comparing`) e o envelope `current`/`previous` — decisões que ficam caras de mudar depois
5. **Componentes base:** seletor de período, tabela paginada com ordenação e CSV, card de KPI com variação, gráfico de série temporal com série de comparação

### Fase 2 — O núcleo analítico

6. **Painel de Controle** com os 10 indicadores
7. **Pedidos › Resumo** e **Pedidos › Lista**
8. **Produtos › Lista** com curva ABC
9. **Cadastro de Custos** (seção 10.2) — destrave margem, lucro e DRE
10. **Financeiro › Resumo** (DRE)

Neste ponto você já tem um produto útil. Tudo daqui para frente é diferenciação.

### Fase 3 — O que realmente diferencia

11. **Pedidos › Aprovação** — barato de construir, altíssimo valor no Brasil
12. **Produtos › Estoque** com velocidade, dias para zerar e custo de ruptura
13. **Clientes (RFM)** com o painel de filtros completo — é a ponte para acionamento
14. **Recompra** (Resumo + LTV/CAC) — exige a conexão de mídia paga
15. **Marketing** (Resumo com funil, Campanhas) — exige Meta/Google/TikTok Ads

### Fase 4 — Inteligência e ação

16. **Contexto do Negócio** — construa antes de qualquer recurso de IA
17. **Métricas (análise narrativa)** com a árvore de drivers por métrica
18. **Metas** com os 6 inputs e 8 derivadas
19. **Alertas** + resumo diário por e-mail (motor de retenção)
20. **Planos de ação** e o assistente geral
21. **Acionamento** (WhatsApp/e-mail) alimentado pelos filtros de Clientes
22. **Benchmark** — só quando houver base de lojas suficiente

### Decisões de arquitetura que valem copiar

| Decisão                                                               | Por quê                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------- |
| 4 params globais na URL                                               | Telas compartilháveis por link com contexto preservado  |
| Envelope `current`/`previous`                                         | Comparação calculada uma vez no backend, nunca no front |
| Um endpoint por bloco visual                                          | Cada card carrega e falha isoladamente                  |
| Endpoints `/Filters/{Dimensao}` por período                           | Nunca oferecer um filtro que retorna zero linhas        |
| Métrica como objeto, não número                                       | Valor + unidade + variação viajam juntos                |
| Taxa da plataforma separada do spend                                  | Permite o toggle "incluir taxa" em qualquer lugar       |
| Regras de negócio centralizadas (faixas de ROAS, benchmarks de funil) | Mudam com o mercado, não com o código de cada tela      |
| Pré-agregação na camada analítica                                     | Viabiliza 5–9 chamadas por página                       |
| Gating com bypass ("Acessar mesmo assim")                             | O usuário vê o que ganharia antes de conectar           |
| Permissões filtradas pelo plano                                       | Monetização de módulos sem duplicar telas               |
| Contexto do negócio como base da IA                                   | Recomendações que respeitam restrições reais            |

### O que eu faria diferente

- **Os itens "Em breve"** na navegação são botões desabilitados sem rota, sem tooltip e sem captura de interesse. Se for sinalizar roadmap, ao menos capture a lista de espera — ou siga o padrão do próprio WhatsApp, que tem tela de teaser com CTA.
- **Duas convenções de rota** (`/Stores/Pascal` e `/stores/kebab`) convivendo indicam migração incompleta. Escolha uma no dia zero.
- **Benchmark de mercado** é um recurso caro que só funciona com escala. Em uma plataforma nova, a média histórica da própria loja entrega a maior parte do valor diagnóstico sem depender de pool de terceiros.

---

_Documento gerado a partir de pesquisa direta na plataforma em 10–11 de setembro de 2026. Loja de referência: 7230. Toda a navegação foi somente leitura — nenhum dado foi criado, alterado ou excluído._
