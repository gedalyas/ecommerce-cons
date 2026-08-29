# E-commerce Insights

Crie um protótipo de dashboard web (React + Tailwind) para um sistema de

consultoria de e-commerce. É um protótipo visual para apresentação: sem backend,

sem login, todos os dados são fictícios e fixos no código. Interface em português.

## Layout global — três colunas

- Sidebar esquerda (240px): navegação.

- Área central: conteúdo da seção, com rolagem.

- Painel direito (360px): chat de IA, sempre visível e fixo, com botão para recolher.

## Sidebar

Topo: nome do sistema "Nome Provisório" e, abaixo, o cliente selecionado

("Loja Aurora").

Grupo principal:

1. Dashboard

2. Dinheiro

3. Marketing

4. Logística

5. Gestão

Separador e, mais abaixo, um segundo grupo visualmente destacado do primeiro:

6. Conexões — com um ponto laranja ao lado indicando que há problema.

Rodapé da sidebar: barra de progresso "Maturidade: 2 de 4 critérios".

## Dashboard

Ordem dos blocos:

1. Linha de 4 KPIs principais:

   Faturamento (R$ 487.300, +8%, nível A)

   Margem de contribuição (19,2%, -3,4pp, nível B)

   CAC (R$ 62, +21%, nível A)

   Recompra 90 dias (14%, +1pp, nível A)

2. Bloco "Precisa da sua atenção" — 3 alertas, cada um com ícone, título,

   uma linha de explicação e a seção de origem:

   - "Margem do SKU AUR-114 ficou negativa" — Dinheiro

   - "CAC do Google Ads acima do limite há 12 dias" — Marketing

   - "78% da receita vem de um único canal" — Gestão

3. Bloco "Marco de maturidade" em destaque, com borda mais marcada.

   Título, uma linha explicando que ele libera as áreas bloqueadas, e os

   4 critérios lado a lado, cada um com barra de progresso e status:

   - Margem previsível — atingido

   - CAC menor que 1/3 do LTV — não atingido ("CAC R$ 62 · meta R$ 41")

   - Caixa de 90 dias — atingido

   - Empresa roda sem o dono — não atingido

4. Bloco "Recomendações em aberto" — 4 itens com texto, prazo e responsável.

5. Gráfico de linha: faturamento e margem % nos últimos 12 meses, com a

   margem caindo nos últimos 3 meses.

## Seções Dinheiro, Marketing, Logística e Gestão — mesma anatomia

Cada seção é composta por "pilares" empilhados como cards. Cada card tem:

- Título do pilar + badge de estado: Concluído (verde), Em andamento (azul),

  Não iniciado (cinza) ou Bloqueado (cinza com cadeado).

- Grid de 2 a 4 KPIs.

- Lista de recomendações em aberto do pilar (texto, prazo, responsável).

- Rodapé "Pendências de dado" quando houver.

Pilares por seção:

- Dinheiro: "Organização" (em andamento), "Custos e taxas" (concluído)

- Marketing: "Conversão" (concluído), "Aquisição" (em andamento),

  "Retenção" (não iniciado), "Canais paralelos" (bloqueado)

- Logística: "Estoque e fulfillment" (não iniciado), "Frete e entrega"

  (não iniciado), "SAC e pós-venda" (não iniciado)

- Gestão: "Blindagem" (não iniciado), "Delegação" (não iniciado),

  "Tecnologia" (bloqueado)

Cards bloqueados aparecem esmaecidos, com a mensagem "Disponível após o marco

de maturidade" e um link "ver o que falta" que leva ao dashboard.

No topo da seção Marketing, mostrar uma faixa de aviso laranja:

"Meta Ads não sincroniza há 6 dias — os dados de aquisição podem estar

desatualizados." com um link "Ir para Conexões".

## KPI — componente central do sistema

Cada KPI mostra rótulo, valor grande, variação vs mês anterior (verde/vermelho)

e um selo pequeno de fidelidade do dado no canto: "A", "B" ou "C".

- A = medido (selo sólido)

- B = aproximado (selo contornado)

- C = indicativo (selo cinza claro)

Tooltip ao passar o mouse no selo, por exemplo:

"Nível B — CMV médio por categoria, informado pelo cliente em março."

Valores de nível B e C aparecem com o número em peso mais leve que os de nível A.

## Seção Conexões

Lista de fontes conectadas, uma por linha, cada uma com: nome, tipo, status

(conectado / com erro / não conectado), data e hora da última sincronização

e um botão "Reconectar" ou "Conectar".

- Bling (ERP) — conectado — hoje às 03:12

- Loja (plataforma) — conectado — hoje às 03:14

- Meta Ads — erro de autenticação — há 6 dias

- Google Ads — conectado — hoje às 03:20

- Google Analytics — conectado — hoje às 03:20

- Instagram — não conectado

- Extrato do adquirente — importação manual — enviado em 02/08

No topo, uma linha resumo: "5 de 7 fontes ativas".

Abaixo da lista, um bloco "Importação manual" com uma área de upload de

planilha (apenas visual, não precisa funcionar).

## Painel de IA (direita)

- Cabeçalho: "Assistente" e, abaixo, o contexto atual em texto menor

  ("Vendo: Aquisição").

- Estado inicial: 3 perguntas sugeridas em botões, que mudam conforme a seção:

  "Por que meu CAC subiu?", "Qual canal está pior?", "O que fazer primeiro?"

- Histórico com 2 mensagens de exemplo já preenchidas: pergunta do usuário e

  resposta da IA citando números concretos e mencionando o pilar de origem.

- Uma das respostas termina com o botão "Levar para a reunião com o consultor".

- Campo de digitação embaixo. Ao enviar, apenas adiciona a mensagem e responde

  com um texto fixo — não precisa integrar IA de verdade.

## Estilo

Visual limpo e profissional, tipo ferramenta de análise financeira. Fundo claro,

cards brancos com borda sutil, cantos levemente arredondados, sem sombras

pesadas, sem gradientes. Uma cor de destaque só (verde escuro), laranja apenas

para avisos. Tipografia sem serifa, números grandes e legíveis. Densidade média.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e8245623-7d0e-4be3-890c-1e82558c2419).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
