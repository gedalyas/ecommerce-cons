# Design system

Camada transversal ao produto. O **Dashboard** é a referência oficial de layout,
espaçamento e responsividade: tudo aqui foi extraído dele.

## Estrutura

- `tokens/` — cor, tipografia, espaçamento, raio, sombra e breakpoints.
- `primitives/` — Button, Badge, Card, Divider, Tooltip, Input, Skeleton.
- `patterns/` — composições reutilizadas por mais de uma feature.
- `hooks/` — `useBreakpoint`, `useScrollShadow`.

## Pode

- Importar tokens e componentes por `@/design-system` ou pelo caminho da pasta.
- Compor patterns dentro de uma feature.
- Usar `layout.page`, `layout.blockStack`, `layout.cardPadding` para o ritmo da tela.

## Não pode

- Declarar cor, espaçamento, raio, sombra, tamanho de fonte ou breakpoint fora de
  `tokens/`. Nenhuma tela sobrescreve isso localmente.
- Criar breakpoint novo. Apenas `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`.
- Formatar número, moeda, percentual ou data na tela — use `@/lib/format`.
- Importar de dentro de uma feature. O fluxo é sempre feature → design system.

## Layout de referência (Dashboard)

| Item | Valor |
| --- | --- |
| Contêiner | `max-w-5xl`, padding 16 / 24 (sm) / 32 (xl) |
| Entre blocos | 24px no mobile, 32px a partir de sm |
| Entre cards do mesmo grupo | 16px |
| Padding de card | 20px |
| Metric tile group | 2 colunas até lg, 4 (ou 3) a partir de lg |
| Listas e tabelas | empilham em card abaixo de `md` |
| Botão flutuante | 16px das bordas no mobile, 24px a partir de md |
