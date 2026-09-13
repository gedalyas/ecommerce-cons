# E-commerce Insights

Dashboard de consultoria de e-commerce: indicadores de **Dinheiro**, **Marketing**,
**Logística** e **Gestão** em um painel só, mais o módulo de dados (Pedidos, Produtos,
Clientes, DRE, Metas, Métricas, Influenciadores), um assistente de IA acoplado e um "marco de
maturidade" que destrava áreas conforme o cliente evolui. É um SaaS: cada loja é um cliente
com seus dados, seus usuários e suas conexões; a consultoria libera e-mails, acompanha as lojas
que atende e edita o acompanhamento. Interface em português.

## Stack

Monorepo com npm workspaces:

| Workspace            | O que é                                                                             |
| -------------------- | ----------------------------------------------------------------------------------- |
| `apps/web`           | React 19 + TypeScript + **TanStack Start** (SSR), Tailwind 4, design system próprio |
| `apps/api`           | **Express 4 + Zod + Prisma 7** — a API (`/api/v1`, JWT) que web e app mobile usam   |
| `packages/contracts` | Tipos, schemas zod, conjuntos fechados e formatação compartilhados pelos clientes   |
| `packages/database`  | Schema Prisma, migrações, seed e o client do PostgreSQL                             |

Docker + docker compose para o Postgres e para as imagens de produção; Vite 8 + Nitro no build
do web, esbuild no da API.

## Como rodar

Pré-requisitos: Docker (compose v2), Node.js ≥ 22 e GNU make.

```sh
make ecom
```

Esse alvo faz tudo: cria o `.env`, instala dependências, sobe o Postgres em Docker, aplica as
migrações, roda o seed e inicia os dois dev servers — API em <http://localhost:3001/api/v1> e
web em <http://localhost:8080>. O seed cria só o administrador (`ADMIN_EMAIL` /
`ADMIN_PASSWORD` no `.env`, padrão `admin@ecommerce-insights.dev` / `admin2026`). Para uma
loja de desenvolvimento com 18 meses de dados sintéticos, rode `npm run db:seed:dev` (loja
"Loja Exemplo", usuários `cliente@lojaexemplo.dev` e `consultor@ecommerce-insights.dev`,
senha `SEED_USER_PASSWORD`) e mantenha `DEMO_TODAY=2026-09-10` no `.env`.

Outros alvos úteis (`make help` lista todos):

| Comando                        | O que faz                                          |
| ------------------------------ | -------------------------------------------------- |
| `make up`                      | Postgres + api + web buildados, tudo em Docker     |
| `make down`                    | Derruba os containers (preserva o volume do banco) |
| `make studio`                  | Abre o Prisma Studio                               |
| `make db-reset`                | Recria e re-seeda o banco (destrutivo)             |
| `make lint` / `make typecheck` | Qualidade de código em todos os workspaces         |
| `make build` / `make preview`  | Build de produção e preview do web                 |

## Estrutura

```
apps/web/src/
  routes/          rotas (arquivos em inglês; URLs em português via routes.ts)
  modules/         um módulo por domínio: telas, hooks e o controller que chama a API
  shared/          kernel sem domínio: ui, styles, layout, hooks, utils, dependencies
apps/api/src/
  modules/         um módulo por domínio: router, controller, service e regras puras
  shared/          config (env), http (erros, validação, auth)
packages/contracts/src/   <domínio>/ tipos, schemas, conjuntos fechados; shared/ período, métricas, formatação
packages/database/        prisma/ (schema, migrações, seed, fixtures) e o client
specs/                    especificações do produto, planos, decisões e convenções
```

As especificações estão em [specs/](specs/), o plano do backend em
[specs/backend-plan.md](specs/backend-plan.md), a arquitetura em
[specs/architecture.md](specs/architecture.md) e as regras de trabalho no [CLAUDE.md](CLAUDE.md).
