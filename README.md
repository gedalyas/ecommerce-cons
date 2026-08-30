# E-commerce Insights

Protótipo de dashboard web para um sistema de consultoria de e-commerce.
Interface em português, dados fictícios fixos no código — é um protótipo visual
para apresentação, sem login. Um único cliente de exemplo: **Loja Aurora**.

O produto reúne indicadores de **Dinheiro**, **Marketing**, **Logística** e
**Gestão** em um painel só, com um assistente de IA acoplado e um "marco de
maturidade" que destrava áreas conforme o cliente evolui.

## Stack

- **React 19 + TypeScript** com **TanStack Start** (SSR, roteamento por arquivo)
- **Tailwind CSS 4** com design system próprio (`src/design-system`)
- **Prisma 7 + PostgreSQL** (schema e seed prontos; a UI ainda lê mocks — ver
  [specs/data-layer-migration.md](specs/data-layer-migration.md))
- **Docker + docker compose** para o banco e para a imagem de produção
- **Vite 8 + Nitro** para build

## Como rodar

Pré-requisitos: Docker (compose v2), Node.js ≥ 22 e GNU make.

```sh
make ecom
```

Esse alvo faz tudo: cria o `.env`, instala dependências, sobe o Postgres em
Docker, aplica as migrações, roda o seed e inicia o dev server em
<http://localhost:8080>.

Outros alvos úteis (`make help` lista todos):

| Comando                        | O que faz                                          |
| ------------------------------ | -------------------------------------------------- |
| `make up`                      | Postgres + app buildado, tudo em Docker            |
| `make down`                    | Derruba os containers (preserva o volume do banco) |
| `make studio`                  | Abre o Prisma Studio                               |
| `make db-reset`                | Recria e re-seeda o banco (destrutivo)             |
| `make lint` / `make typecheck` | Qualidade de código                                |
| `make build` / `make preview`  | Build de produção e preview                        |

## Estrutura

```
src/
  routes/          rotas (arquivos em inglês; URLs em português via src/routes.ts)
  features/        uma pasta por área: dashboard, money, marketing, ...
  design-system/   tokens, primitivos e patterns — fonte única de estilo
  layout/          AppShell, Sidebar, AssistantPanel, BottomNav
  lib/             formatação pt-BR, tratamento de erro
  generated/       Prisma Client (gerado, fora do git)
prisma/            schema, migrações e seed
specs/             especificações do produto e convenções
```

As especificações completas estão em [specs/](specs/) e as regras de trabalho no
[CLAUDE.md](CLAUDE.md).
