# ARQUITETURA-REFERENCIA — arko_frontend + arko_backend

Documento autossuficiente para replicar a arquitetura de pastas e as regras de dependência do
par `arko_frontend` (React 19 SPA) + `arko_backend` (Express + Prisma/PostgreSQL) num projeto
React 19 + TanStack Start SSR + Prisma/PostgreSQL. Tudo aqui foi lido do código e das configs em
2026-09-12; onde uma regra é só convenção, está marcado **convenção, não enforced**. Trechos de
código são colados na íntegra ou com o recorte indicado.

Legenda de evidência: `FE:` = `arko_frontend/`, `BE:` = `arko_backend/`.

---

## 1. Visão geral

**Stack:** frontend React 19 + Vite 7 + TypeScript 5 + Tailwind 4 + React Router 7 + Axios +
Vitest; backend Node 22 + Express 4 + Prisma 6 (PostgreSQL) + Zod 3 + Vitest. Lint com ESLint 9
flat config (`typescript-eslint`, `eslint-plugin-unused-imports`, `eslint-plugin-react-hooks` no
front), Prettier 3, `dependency-cruiser` 18 só como extrator de grafo de imports, e um script
Tarjan próprio (`scripts/checkCycles.ts`) como ratchet de ciclos no CI.

**A regra de ouro (idêntica nos dois repos, do `CLAUDE.md`):**

> **The folder is the business domain. The layer is the file.** A file either belongs to a
> domain (`src/modules/<domain>/`) or belongs to none (`src/shared/`). There is no third option.

Não há pasta `controllers/`, `services/`, `components/`, `hooks/` na raiz — essas são "camadas",
e camada aqui é sufixo/prefixo de **arquivo**, não pasta. Um módulo é uma capacidade de negócio
(`objective`, `budget`, `statement`), não uma entidade (`client`).

### 1.1 Árvore — arko_backend (até 3 níveis)

```
arko_backend/
├── .dependency-cruiser.cjs      # só opções de resolução do grafo; SEM regra no-circular (de propósito)
├── eslint.config.mjs            # regras de fronteira (no-restricted-imports) — ver §7
├── tsconfig.json                # paths "@/*" → src/*; inclui src/ e scripts/
├── tsconfig.build.json          # rootDir src/, exclui scripts/ e *.test.ts
├── vitest.config.ts             # coverage thresholds (ratchet, autoUpdate:false)
├── .github/workflows/           # ci.yml, claude-review.yml, pr-card-check.yml, trello-notify.yml
├── docs/
│   ├── decisions/               # ADRs: AAAA-MM-DD-titulo.md (Contexto/Decisão/Por quê/Alternativas)
│   └── plans/                   # planos de tarefa (PT-BR)
├── prisma/
│   ├── schema.prisma            # única fonte dos enums de banco — nunca redeclarar no backend
│   └── migrations/              # sempre via `prisma migrate dev`; só DDL, nunca seed/dados
├── scripts/                     # checkCycles.ts + cyclicFiles.ts(+test) + scripts operacionais
└── src/
    ├── index.ts                 # COMPOSITION ROOT: o único arquivo que conhece todos os módulos
    ├── modules/<dominio>/       # PLANO (MAX_MODULE_DEPTH=0: subpasta é proibida pelo lint)
    │   ├── contract.ts          # a única porta pública do módulo (lista manual de `export … from`)
    │   ├── <x>Router.ts         # factory createXRouter(): tabela de rotas
    │   ├── <x>Controller.ts     # traduz HTTP; sem Prisma, sem regra
    │   ├── <x>Service.ts        # ORQUESTRADOR: o único que toca Prisma/fetch/SDK
    │   ├── <x>Schema.ts         # Zod de entrada
    │   ├── <x>.types.ts         # tipos exportados do domínio
    │   ├── <regra>.ts + .test.ts# NÚCLEO PURO: calcula/decide, sem I/O, teste colado
    │   └── <enum>.ts            # um enum TS por arquivo quando não vem do Prisma
    └── shared/                  # KERNEL: nada aqui sabe o que é um domínio
        ├── dependencies/        # prismaClient, anthropicClient, websocketService — só *Service.ts importa
        ├── middlewares/         # validateForm(zod), upload, rate limit, json body, withErrorResponse
        ├── models/              # mappedException.ts, emailSchema.ts
        │   ├── enums/           # enums SEM dono de domínio (aiFeature, multerErrorCode…)
        │   └── types/           # pagination.types.ts, pdfWorker.types.ts, *.d.ts
        └── utils/               # puros sem domínio: envUtils, fileSniff, buildPagination…
```

O que **não** pode ficar em cada lugar (enforced por `eslint.config.mjs`, ver §3/§7):

| Pasta                                | Não pode                                                                                          | Quem barra                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/` raiz                          | qualquer pasta além de `index.ts`, `modules/`, `shared/` (`controllers/`, `services/`, `utils/`…) | regra `extinct` (no-restricted-imports)                                |
| `src/modules/<x>/`                   | subpastas; import de outro módulo que não `…/contract`; import relativo que sobe (`../`)          | `MAX_MODULE_DEPTH=0`, `moduleExposesOnlyContract`, `crossingUsesAlias` |
| `src/modules/<x>/*.ts` (não-Service) | importar `@/shared/dependencies/*` (Prisma, SDKs)                                                 | `dependenciesOnlyInService`                                            |
| `src/shared/`                        | importar qualquer coisa de `modules/`                                                             | `sharedKnowsNoDomain`                                                  |
| `contract.ts`                        | lógica; export "por via das dúvidas" sem consumidor hoje                                          | convenção, não enforced                                                |

### 1.2 Árvore — arko_frontend (até 3 níveis)

```
arko_frontend/
├── .dependency-cruiser.cjs      # idem backend (extensões .tsx, conditionNames browser)
├── eslint.config.mjs            # mesmas regras de fronteira + staticImportsOnly + react-hooks
├── tsconfig.json                # paths "@/*" → src/*; noEmit; moduleResolution Bundler
├── tsconfig.node.json           # só vite.config.ts
├── vite.config.ts               # alias @, manualChunks, e o bloco `test.coverage` que o CI usa
├── index.html
├── .github/workflows/           # mesmos 4 workflows do backend
├── docs/decisions/              # ADRs
├── scripts/                     # checkCycles.ts + cyclicFiles.ts (BYTE-IDÊNTICOS ao backend) + prerender.mjs
└── src/
    ├── main.tsx                 # COMPOSITION ROOT: registra o AuthPort e renderiza
    ├── App.tsx                  # tabela de rotas — importa só de @/modules/*/contract e @/shared
    ├── entry-prerender.tsx      # entrada SSR de prerender (nome kebab exigido pela config de build)
    ├── modules/<dominio>/       # plano (só `landing/constants/` tem subpasta; lint permite até 3)
    │   ├── contract.ts          # porta pública: página, hook, tipo/enum/função pura que cruza a fronteira
    │   ├── <Page>.tsx           # ENTRADA: renderiza (PascalCase só quando exporta componente)
    │   ├── use<X>.ts            # ORQUESTRADOR: fetch/estado/notifica — único que chama o api client
    │   ├── <x>Service.ts        # wrapper fino do `api` (axios) por endpoint
    │   ├── <x>.types.ts         # tipos de request/response
    │   ├── <enum>.ts            # enum TS espelhando o enum do banco (o front não vê o Prisma)
    │   └── <regra>.ts + .test.ts# núcleo puro: payload builders, validações, cálculos
    └── shared/
        ├── ui/                  # design system plano (atoms/molecules/organisms é classificação, não pasta)
        ├── layout/              # AppLayout, Sidebar, Topbar, sidebarItems (só rotas/labels/ícones)
        ├── hooks/               # hooks sem domínio (useDebounce, useIsMobile, useAsyncTask…)
        ├── utils/               # puros: currencyUtils, dateUtils, cn, fileTypeGuard…
        │   └── api/             # client.ts (axios+interceptors) + authPort.ts (DIP p/ auth)
        ├── models/enums/ types/ # sem dono de domínio (toastStatus, pagination.types…)
        ├── styles/global.css    # tokens Tailwind v4 @theme
        └── assets/              # imagens/vídeos
```

| Pasta                 | Não pode                                                                      | Quem barra                                                                 |
| --------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/`                | `@/assets`, `@/components`, `@/styles`, `@/types` (pastas pré-migração)       | `extinct`                                                                  |
| `src/**` (fora teste) | `import()` dinâmico / `React.lazy`                                            | `staticImportsOnly` (no-restricted-syntax)                                 |
| `src/modules/<x>/`    | `@/modules/<y>/<arquivo>` que não seja `contract`; relativo que sai do módulo | `moduleExposesOnlyContract`, `insideModuleIsRelative`, `crossingUsesAlias` |
| `src/shared/`         | importar `modules/`                                                           | `sharedKnowsNoDomain`                                                      |
| componente/página     | chamar o api client (I/O é do hook); regra de negócio (é do arquivo puro)     | convenção + review (REVIEW.md), não enforced                               |
| `shared/ui/`          | widget de um único módulo; hex inline (`bg-[#…]`)                             | convenção + review, não enforced                                           |

---

## 2. Camadas e direção de dependência

Não existe pasta por camada. As camadas são **papéis de arquivo dentro do módulo**, e a única
fronteira enforced por tooling é **módulo ↔ módulo** e **módulo → shared**.

### 2.1 Diagrama

```
                 ┌──────────────────────────────────────────────┐
                 │  BOOTSTRAP / COMPOSITION ROOT                 │
                 │  BE: src/index.ts   FE: src/main.tsx, App.tsx │
                 │  (o único lugar que conhece TODOS os módulos) │
                 └───────┬──────────────────────────┬───────────┘
                         │ importa só                │
                         ▼                          ▼
       ┌──────────────────────────────┐   ┌──────────────────────────────┐
       │ modules/A/contract.ts        │◄──┤ modules/B/contract.ts        │  A ↔ B: só via contract,
       │  (porta pública, lista manual)│──►│                              │  nunca arquivo interno.
       └──────────────┬───────────────┘   └──────────────┬───────────────┘  Ciclo A→B→A: permitido
                      │ re-exporta                        │                 pelo lint, MEDIDO pelo
                      ▼                                   ▼                 ratchet (só desce).
   ┌───────────────────────────────────────────────────────────────────┐
   │ dentro do módulo (imports RELATIVOS ./x):                          │
   │   Entry  → Orquestrador → Núcleo puro                              │
   │   BE: xRouter → xController → xService → regra.ts (+ .test.ts)     │
   │   FE: Page.tsx → useX.ts → xService.ts(api) | regra.ts (+ .test.ts)│
   │   tipos/enums/schemas: arquivo próprio no mesmo módulo             │
   └──────────────────────────────┬────────────────────────────────────┘
                                  │ alias @/shared/...
                                  ▼
   ┌───────────────────────────────────────────────────────────────────┐
   │ shared/  (KERNEL — não conhece domínio; nunca importa modules/)    │
   │   BE: dependencies/ (Prisma, SDKs — só *Service.ts importa)        │
   │       middlewares/ models/ utils/                                  │
   │   FE: ui/ layout/ hooks/ utils/ (api/client.ts + authPort.ts)      │
   └───────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                     node_modules (@prisma/client, express, react, axios, zod…)
```

Regras de seta:

- **Bootstrap → contract de qualquer módulo, e → shared.** Nunca para dentro de um módulo.
- **Módulo → `@/modules/<outro>/contract`** (alias) e **→ `@/shared/...`** (alias). Dentro de si
  mesmo, `./arquivo` (relativo).
- **shared → shared** e **→ node_modules**. Nunca → modules.
- **Dentro do módulo, por papel** (convenção + review, não enforced pelo lint): Router/Page só
  monta; Controller/Hook orquestra; Service é o único que faz I/O; núcleo puro não importa nada de
  infra.
- **`shared/dependencies/*` (BE) só entra em `*Service.ts`** — enforced (`dependenciesOnlyInService`).

### 2.2 Cada camada: o que conhece, o que ignora, exemplo permitido/proibido

**Composition root** (`BE: src/index.ts`, `FE: src/main.tsx` + `src/App.tsx`)

- Conhece: todo `modules/*/contract.ts`, `shared/`.
- Ignora: qualquer arquivo interno de módulo.
- Permitido (real, `BE: src/index.ts`):
  ```ts
  import { createObjectiveRouter } from "@/modules/objective/contract";
  app.use("/api/objective", createObjectiveRouter());
  ```
- Proibido: `import { createObjectiveRouter } from '@/modules/objective/objectiveRouter';` →
  erro `moduleExposesOnlyContract`.

**Entrada** (`BE: *Router.ts`, `FE: <Page>.tsx`)

- Conhece: os arquivos do próprio módulo (relativo), middlewares/ui de `shared`, e o contract de
  `auth` (a única tolerância cross-módulo em tempo de import — ver §3.3).
- Ignora: Prisma, SDKs, regra de negócio.
- Permitido (real, `BE: src/modules/objective/objectiveRouter.ts`):
  ```ts
  import { authenticateClient } from "@/modules/auth/contract";
  import { validateForm } from "@/shared/middlewares/formValidationMiddleware";
  import { objectiveSchema, updateObjectiveSchema } from "./objectiveSchema";
  import {
    createObjective,
    deleteObjective,
    getObjectives,
    updateObjective,
  } from "./objectiveController";
  ```
- Proibido: `import { prismaClient } from '@/shared/dependencies/prismaClient';` num router →
  erro `dependenciesOnlyInService`.

**Orquestrador** (`BE: *Service.ts` — classes estáticas; `FE: use*.ts` hooks + `*Service.ts` wrappers de API)

- Conhece: `shared/dependencies` (BE), `api` client (FE), contracts de outros módulos, núcleo puro
  do próprio módulo.
- Ignora: HTTP (`req`/`res`), React (BE); DOM direto (FE hook).
- Permitido (real, `BE: src/modules/objective/objectiveService.ts`):
  ```ts
  import { prismaClient } from "@/shared/dependencies/prismaClient";
  import { BudgetService } from "@/modules/budget/contract";
  import type { BudgetData, BudgetEntry } from "@/modules/budget/contract";
  import { resolvePlan } from "./objectivePlan";
  ```
- Proibido: `import { BudgetService } from '../budget/budgetService';` → erros
  `moduleExposesOnlyContract` + `crossingUsesAlias`.

**Núcleo puro** (`BE: *Calculations/*Guard/*Resolver/*Parser/*Plan.ts`; `FE: *Rules/*Payload/*Calculations.ts`)

- Conhece: tipos do próprio módulo, `shared/utils` puros, `date-fns`, enums do Prisma (BE) — só
  valores/tipos.
- Ignora: Prisma client, fetch, React, relógio (`new Date()` chega como parâmetro `now`), env.
- Permitido (real, `BE: src/modules/objective/objectivePlan.ts`):
  ```ts
  import { ObjectivePlanningMode } from "@prisma/client";
  import {
    calculateMonthlyContribution,
    calculatePlanByContribution,
    calculateRemainingMonths,
  } from "./objectiveCalculations";
  ```
- Proibido (convenção, não enforced — review pega): `const now = new Date()` dentro de
  `objectiveCalculations.ts`, ou `await prismaClient…` dentro de uma função que calcula.

**Shared / kernel**

- Conhece: node_modules e a si mesmo.
- Ignora: qualquer domínio. Teste da regra (CLAUDE.md): _"To explain what this file does, do I
  have to name a domain?"_ Sim → módulo dono; não → `shared/`.
- Permitido (real, `BE: src/shared/utils/buildPagination.ts`):
  `import { Pagination } from '../models/types/pagination.types';`
- Proibido: `import { ObjectiveService } from '@/modules/objective/contract';` em qualquer
  arquivo de `shared/` → erro `sharedKnowsNoDomain`.

### 2.3 Onde vive o "shared" e a regra de entrada (CLAUDE.md, seção "The `shared/` rule")

> 1. **No domain owner** — decisive. If some module owns the concept, the file is that module's
>    and comes out through its `contract.ts`. A second consumer does not transfer ownership.
> 2. **Something outside the file already uses it** — never share speculatively. "Something"
>    means any consumer: another module, the bootstrap (`index.ts`, `App.tsx`), or another
>    `shared/` file.
>
> `shared/` is the _shared kernel_: small, stable and deliberately boring. Nothing in it knows
> what a client, a policy or a meeting is. Health metric: a module migration that produces many
> new `shared/` files has failed.

Decisão registrada de 2026-08-27 (a regra anterior "se dois módulos usam, sobe pro shared" foi
revogada): **tipo de domínio não sobe para `shared/`, sai pelo `contract.ts` do dono.** O motivo
é evitar o _shared folder anti-pattern_ (shared vira depósito de domínio, módulos viram cascas).
O preço aceito: ciclos entre módulos passam a ser possíveis — e por isso existe o ratchet (§3).

---

## 3. Prevenção de ciclos (prioridade máxima)

### 3.1 Mecanismos, em camadas

| Camada                                 | Mecanismo                                                                                                                                                                                | Onde                                                                                       | Enforced?                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Fronteira de módulo                    | ESLint `no-restricted-imports` com 6 padrões (`extinct`, `sharedKnowsNoDomain`, `moduleExposesOnlyContract`, `insideModuleIsRelative`, `crossingUsesAlias`, `dependenciesOnlyInService`) | `eslint.config.mjs` (ambos)                                                                | sim, `error`, CI `--max-warnings N`                           |
| Ciclo de import (ADP)                  | `dependency-cruiser` gera **só o grafo** (JSON); script Tarjan mede **arquivos dentro de componente fortemente conexa**; CI roda `--max-files N` (ratchet, só desce)                     | `scripts/checkCycles.ts` + `scripts/cyclicFiles.ts` + `.dependency-cruiser.cjs` + `ci.yml` | sim, CI                                                       |
| Ciclo que quebra em runtime (CommonJS) | routers são **factories** (`createXRouter()`), nunca `Router()` em top-level; guard opcional `check:module-load-order` carrega cada arquivo compilado isolado                            | CLAUDE.md; script existe no `crm_backend` (colado abaixo), **não** no arko_backend         | convenção no arko; enforced no crm                            |
| Tipo-only                              | `import type` some do build (`tsc`), mas **conta no grafo** porque `tsPreCompilationDeps: true`                                                                                          | `.dependency-cruiser.cjs`                                                                  | —                                                             |
| Barrels                                | `index.ts` re-export proibido; `contract.ts` é a única exceção, lista manual                                                                                                             | CLAUDE.md Code Quality #4                                                                  | convenção, não enforced (não há regra ESLint para `index.ts`) |

Estado medido em 2026-09-12 (rodando o mesmo Tarjan sobre o grafo do depcruise):

- **arko_backend:** 7 arquivos em ciclo, 8 arestas, 1 componente (`categorizationRule` ↔
  `transaction`: `categorizationRuleRouter.ts`, `categorizationRuleSchema.ts`,
  `categorizationRule/contract.ts`, `transaction/contract.ts`, `transactionController.ts`,
  `transactionManagementService.ts`, `transactionRouter.ts`). CI: `--max-files 7`.
- **arko_frontend:** 83 arquivos em ciclo, 192 arestas, 1 componente em 13 módulos
  (`allowedEmail, auth, balance, bankAccount, cashFlow, categorizationRule, consultant, nps,
onboarding, statement, survey, transaction, user`). CI: `--max-files 83`.

Ou seja: **ciclos existem e são tolerados como dívida herdada; o que é proibido é a componente
crescer.**

### 3.2 Configuração real

**`BE: eslint.config.mjs`** (íntegra; o do FE está em §7 — diferem em `MAX_MODULE_DEPTH`,
`EXTINCT`, `dependenciesOnlyInService`, react-hooks e `staticImportsOnly`):

```js
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";

const EXTINCT_UNAMBIGUOUS = ["controllers", "routers", "services", "exceptions"];

const EXTINCT_AMBIGUOUS = ["models", "types", "utils", "dependencies"];

const EXTINCT_FOLDERS = [
  ...EXTINCT_UNAMBIGUOUS.flatMap((folder) => [`**/${folder}/*`, `**/${folder}/**`]),
  ...EXTINCT_AMBIGUOUS.flatMap((folder) => [
    `./${folder}/*`,
    `../../${folder}/*`,
    `../../../${folder}/*`,
  ]),
];

const MAX_MODULE_DEPTH = 0;

const extinct = {
  group: EXTINCT_FOLDERS,
  message: "Estrutura pre-migracao. O codigo vive em src/modules/<dominio>/ ou src/shared/.",
};

const sharedKnowsNoDomain = {
  regex: "(^|/)modules/",
  message: "shared/ nao conhece dominio. Inverta a dependencia ou mova o arquivo para o modulo.",
};

const moduleExposesOnlyContract = {
  regex: "(^|/)modules/(?!\\w+/contract$)",
  message:
    "Modulo so expoe o contract.ts. Importe de @/modules/<dominio>/contract ou acrescente a linha la.",
};

const insideModuleIsRelative = {
  regex: "^@/modules/(?!\\w+/contract$)",
  message:
    "Dentro do modulo o import e relativo (./arquivo). De outro modulo, so @/modules/<dominio>/contract.",
};

const crossingUsesAlias = (depth) => ({
  regex: `^(\\.\\./){${depth + 1}}`,
  message:
    "Import relativo saiu do modulo. Atravessar fronteira e por alias: @/shared/... ou @/modules/<dominio>/contract.",
});

const dependenciesOnlyInService = {
  group: ["**/shared/dependencies/*"],
  message:
    "I/O so no orquestrador: cliente de SDK e importado por *Service.ts, nunca por controller, router ou nucleo puro.",
};

const restrictedImports = (patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

export default [
  { ignores: ["vitest.config.ts"] },
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": ["error", { allow: ["error"] }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "prefer-const": "error",
      "no-var": "error",
      "no-duplicate-imports": ["error", { allowSeparateTypeImports: true }],
      "object-shorthand": ["error", "always"],
      "no-trailing-spaces": "error",
      "sort-imports": [
        "error",
        {
          ignoreDeclarationSort: true,
          memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
        },
      ],
      "max-lines-per-function": [
        "warn",
        { max: 50, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      "max-params": ["warn", 5],
      "max-depth": ["warn", 4],
      "no-restricted-syntax": [
        "error",
        ...[
          "VariableDeclarator > Identifier.id",
          "FunctionDeclaration > Identifier.id",
          "ClassDeclaration > Identifier.id",
          "TSInterfaceDeclaration > Identifier.id",
          "TSTypeAliasDeclaration > Identifier.id",
          "TSEnumDeclaration > Identifier.id",
          ":function > Identifier.params",
        ].map((selector) => ({
          selector: `${selector}[name=/[\\u00C0-\\u024F]/]`,
          message:
            "Identificador com acento: variavel, parametro, funcao, classe, tipo ou enum vive em ingles. Chave de mapa de dados e string exibida ao usuario final podem ficar em portugues.",
        })),
      ],
      "max-lines": ["error", { max: 600, skipBlankLines: true, skipComments: true }],
      ...restrictedImports([extinct, moduleExposesOnlyContract]),
    },
  },
  {
    files: ["src/shared/**/*.ts"],
    rules: restrictedImports([extinct, sharedKnowsNoDomain]),
  },
  {
    files: ["src/**/*Router.ts"],
    rules: { "max-lines-per-function": "off" },
  },
  {
    files: ["**/*.test.ts"],
    rules: { "max-lines-per-function": "off" },
  },
  ...Array.from({ length: MAX_MODULE_DEPTH + 1 }, (_, depth) => depth).flatMap((depth) => [
    {
      files: [`src/modules/*/${"*/".repeat(depth)}*.ts`],
      rules: restrictedImports([
        extinct,
        moduleExposesOnlyContract,
        dependenciesOnlyInService,
        insideModuleIsRelative,
        crossingUsesAlias(depth),
      ]),
    },
    {
      files: [`src/modules/*/${"*/".repeat(depth)}*Service.ts`],
      rules: restrictedImports([
        extinct,
        moduleExposesOnlyContract,
        insideModuleIsRelative,
        crossingUsesAlias(depth),
      ]),
    },
  ]),
];
```

Como ler os padrões (`no-restricted-imports` avalia **a string do import**, um por vez):

- `moduleExposesOnlyContract` — regex `(^|/)modules/(?!\w+/contract$)`: qualquer import cujo
  caminho contenha `modules/` e **não** termine em `<nome>/contract` é erro. Vale para alias e
  relativo, e está no bloco base (todo arquivo) **e** repetido nos blocos por módulo — o CLAUDE.md
  explica: "or a module file could reach into another module through `@/modules/<x>/<file>` with
  nothing to stop it".
- `insideModuleIsRelative` — `^@/modules/(?!\w+/contract$)`: dentro de um módulo, o alias só
  serve para o contract de outro; para o próprio módulo, `./`.
- `crossingUsesAlias(depth)` — `^(\.\./){depth+1}`: num arquivo a `depth` subpastas da raiz do
  módulo, `depth+1` `../` sai do módulo → erro. No backend `MAX_MODULE_DEPTH = 0`, então qualquer
  `../` é erro (módulos são planos); no front é 3.
- `sharedKnowsNoDomain` — só no bloco `src/shared/**`.
- `dependenciesOnlyInService` — no bloco de `src/modules/*/*.ts`, **removido** no bloco mais
  específico `src/modules/*/*Service.ts` (a ordem dos objetos no array faz o bloco `*Service.ts`
  sobrescrever a regra inteira para esses arquivos).

**`.dependency-cruiser.cjs`** (BE; o FE difere só no `exclude` `\.test\.tsx?$` e em
`conditionNames: ['import','browser','default']` + `extensions: ['.ts','.tsx','.js','.jsx','.json']`):

```js
/**
 * Opções de resolução do grafo de imports para o `check:cycles` (`scripts/checkCycles.ts`).
 * O dependency-cruiser só monta o grafo; quem mede e trava é o script — arquivos dentro de
 * componente cíclica (Tarjan), com cap no `ci.yml` que só desce, igual ao `--max-warnings`.
 * Sem regra `no-circular` aqui de propósito: a baseline nativa casa ciclo pelo caminho e
 * re-roteia a cada mudança no miolo, acusando ciclo "novo" que é velho.
 * Ver docs/decisions/2026-08-28-ciclos-ratchet-por-scc.md.
 *
 * Config idêntica nos backends. Copie, não reescreva.
 */
module.exports = {
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "\\.test\\.ts$" },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["require", "node"],
    },
  },
};
```

**`scripts/checkCycles.ts`** (byte-idêntico nos dois repos):

```ts
import { spawnSync } from "node:child_process";
import path from "node:path";
import { type ImportGraph, summarizeCycles } from "./cyclicFiles";

// Mede quantos arquivos de src/ vivem dentro de uma componente cíclica de imports (Tarjan) e
// falha quando o número passa do cap (`--max-files N`), que só desce — o mesmo ratchet do
// `--max-warnings` do lint. `no-restricted-imports` não enxerga ciclo (lê um import por vez)
// e a baseline nativa do dependency-cruiser casa ciclo pelo caminho, que muda a cada mudança
// no miolo. Ver docs/decisions/2026-08-28-ciclos-ratchet-por-scc.md.

interface CruisedModule {
  readonly source: string;
  readonly dependencies: readonly { readonly resolved: string }[];
}

const MAX_FILES_FLAG = "--max-files";

const readMaxFiles = (argv: readonly string[]): number | null => {
  const position = argv.indexOf(MAX_FILES_FLAG);
  if (position < 0) return null;
  const value = Number(argv[position + 1]);
  if (!Number.isInteger(value) || value < 0) {
    console.error(`${MAX_FILES_FLAG} precisa de um inteiro >= 0.`);
    process.exit(1);
  }
  return value;
};

const readImportGraph = (): ImportGraph => {
  const depcruise = path.join("node_modules", ".bin", "depcruise");
  const result = spawnSync(
    depcruise,
    ["src", "--config", ".dependency-cruiser.cjs", "--output-type", "json"],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  if (result.error || result.stdout === "") {
    console.error(result.error ?? result.stderr);
    process.exit(1);
  }
  const { modules } = JSON.parse(result.stdout) as {
    modules: CruisedModule[];
  };
  const graph = new Map<string, string[]>();
  for (const module of modules) {
    if (!module.source.startsWith("src/")) continue;
    graph.set(
      module.source,
      module.dependencies
        .map((dependency) => dependency.resolved)
        .filter((target) => target.startsWith("src/")),
    );
  }
  return graph;
};

const moduleOf = (file: string): string => /^src\/modules\/([^/]+)\//.exec(file)?.[1] ?? "shared";

const describeLargest = (component: readonly string[]): string => {
  const modules = [...new Set(component.map(moduleOf))];
  return `  maior componente: ${component.length} arquivos em ${modules.length} módulo(s): ${modules.join(", ")}\n`;
};

const checkCycles = (): void => {
  const maxFiles = readMaxFiles(process.argv);
  const { components, files, edges } = summarizeCycles(readImportGraph());

  process.stdout.write(
    `check:cycles — ${files} arquivos em ciclo (${edges} arestas) em ${components.length} componente(s)\n`,
  );
  if (components.length > 0) process.stdout.write(describeLargest(components[0]));
  if (maxFiles === null) return;

  if (files > maxFiles) {
    console.error(
      `✗ ${files} arquivos em ciclo, cap ${maxFiles}: um arquivo entrou num ciclo. Desfaça a aresta (teste da aresta do CLAUDE.md) — o cap nunca sobe.`,
    );
    process.exit(1);
  }
  if (files < maxFiles) {
    process.stdout.write(
      `  ${maxFiles - files} a menos que o cap: desça ${MAX_FILES_FLAG} para ${files} no ci.yml neste PR.\n`,
    );
  }
};

checkCycles();
```

**`scripts/cyclicFiles.ts`** (núcleo puro, com `cyclicFiles.test.ts` ao lado; idêntico nos dois):

```ts
export type ImportGraph = ReadonlyMap<string, readonly string[]>;

export interface CyclicSummary {
  readonly components: readonly (readonly string[])[];
  readonly files: number;
  readonly edges: number;
}

export const findCyclicComponents = (graph: ImportGraph): string[][] => {
  let nextIndex = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const indexOf = new Map<string, number>();
  const lowLink = new Map<string, number>();
  const components: string[][] = [];

  const visit = (node: string): void => {
    indexOf.set(node, nextIndex);
    lowLink.set(node, nextIndex);
    nextIndex += 1;
    stack.push(node);
    onStack.add(node);

    for (const next of graph.get(node) ?? []) {
      if (!indexOf.has(next)) {
        visit(next);
        lowLink.set(node, Math.min(lowLink.get(node)!, lowLink.get(next)!));
      } else if (onStack.has(next)) {
        lowLink.set(node, Math.min(lowLink.get(node)!, indexOf.get(next)!));
      }
    }

    if (lowLink.get(node) !== indexOf.get(node)) return;

    const component: string[] = [];
    let popped: string;
    do {
      popped = stack.pop()!;
      onStack.delete(popped);
      component.push(popped);
    } while (popped !== node);
    if (component.length > 1) components.push(component.sort());
  };

  for (const node of graph.keys()) {
    if (!indexOf.has(node)) visit(node);
  }
  return components.sort((a, b) => b.length - a.length);
};

export const summarizeCycles = (graph: ImportGraph): CyclicSummary => {
  const components = findCyclicComponents(graph);
  const componentOf = new Map<string, number>();
  components.forEach((component, position) => {
    for (const file of component) componentOf.set(file, position);
  });

  let edges = 0;
  for (const [file, imports] of graph) {
    const own = componentOf.get(file);
    if (own === undefined) continue;
    for (const target of imports) {
      if (componentOf.get(target) === own) edges += 1;
    }
  }

  return { components, files: componentOf.size, edges };
};
```

**Guard de runtime — `scripts/checkModuleLoadOrder.ts`** (existe no `crm_backend`, referência
oficial do CLAUDE.md; **não está no arko_backend** — é a única peça citada no CLAUDE.md que não
está presente neste repo):

```ts
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Carrega cada arquivo compilado de src/modules em um processo Node limpo e falha se algum
// quebrar no load ou publicar export undefined. É o sintoma de ciclo de import em que um
// arquivo faz trabalho em tempo de import (tipicamente montar rota) lendo um símbolo de
// outro módulo ainda não inicializado — CommonJS resolve ciclo devolvendo módulo parcial.
// Cada arquivo é uma entrada possível: um teste importa o controller direto, um script importa
// um service. Por isso a varredura não para nos contracts.
// Ver docs/decisions/2026-08-27-composicao-por-prefixo-no-bootstrap.md.

const root = path.resolve(__dirname, "..");
const distModules = path.join(root, "dist", "modules");

const childScript = `
for (const key of ['ADMIN_ACCESS_KEY', 'CONSULTANT_ACCESS_KEY', 'REFRESH_PRIVATE_KEY', 'EXTERNAL_API_KEY']) {
  process.env[key] ||= 'stub';
}
process.env.DATABASE_URL ||= 'postgresql://stub:stub@localhost:5432/stub';
process.env.NODE_ENV ||= 'test';
const loaded = require(process.argv[1]);
const broken = Object.keys(loaded).filter(key => loaded[key] === undefined);
if (broken.length > 0) {
  console.error(broken.join(', '));
  process.exit(2);
}
`;

function listCompiledFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listCompiledFiles(full);
    return entry.name.endsWith(".js") ? [full] : [];
  });
}

function checkModuleLoadOrder(): void {
  if (!fs.existsSync(distModules)) {
    console.error("dist/modules não existe — rode `npm run build` antes.");
    process.exit(1);
  }

  const files = listCompiledFiles(distModules).sort();
  const failures: string[] = [];

  for (const file of files) {
    const label = path.relative(distModules, file);
    const result = spawnSync(process.execPath, ["-e", childScript, file], {
      encoding: "utf8",
      timeout: 60000,
    });
    if (result.status === 0) continue;

    const stderr = (result.stderr ?? "").trim();
    if (result.status === 2) {
      failures.push(`${label}: exports undefined → ${stderr}`);
    } else {
      const firstError =
        stderr.split("\n").find((line) => line.includes("Error:")) ??
        stderr.split("\n")[0] ??
        "falha desconhecida";
      failures.push(`${label}: quebrou no load → ${firstError.trim()}`);
    }
  }

  if (failures.length > 0) {
    console.error(
      `check:module-load-order — ${failures.length}/${files.length} arquivos não carregam isolados:\n`,
    );
    for (const failure of failures) {
      console.error(`  ✗ ${failure}`);
    }
    process.exit(1);
  }

  console.log(
    `check:module-load-order — ${files.length}/${files.length} arquivos carregam isolados.`,
  );
}

checkModuleLoadOrder();
```

(`crm_backend/package.json`: `"check:module-load-order": "ts-node -r tsconfig-paths/register scripts/checkModuleLoadOrder.ts"`.)

### 3.3 Convenção de `index.ts` / barrels

- **`index.ts` de re-export é proibido em qualquer lugar.** CLAUDE.md, Code Quality #4: _"No
  barrel files — always direct imports; never create `index.ts` re-exports. The one named
  exception is `modules/<domain>/contract.ts`"_. **Convenção, não enforced** (não há regra ESLint
  para o nome `index.ts`; o que existe é o `moduleExposesOnlyContract`, que torna um `index.ts`
  dentro de módulo inalcançável de fora).
- **`contract.ts` não é barrel** — é lista manual: _"A barrel is an `index.ts` that re-exports a
  whole directory by sweep. Here the list is written by hand, every line is a deliberate act, and
  what is not in the contract is private."_ Só entra o que tem consumidor **hoje**; sai quando o
  último consumidor some.
- Por que barrels são proibidos aqui: (a) fonte clássica de ciclo — um sweep importa o módulo
  inteiro, inclusive o arquivo que importa você de volta; (b) esconde a fronteira: o CLAUDE.md
  quer que "the module crossing is visible to the naked eye on the import line".
- No backend o `contract.ts` publica **factories** (`createXRouter`), nunca o router construído,
  justamente para que importar o contract não execute nada (§3.4).
- Único `index.ts` existente: `BE: src/index.ts`, que é o composition root, não um barrel.

### 3.4 Como o time resolve um ciclo — padrão de refatoração

Do CLAUDE.md, a regra de "quem vai junto" (o **teste da aresta**):

> **Which files go along: the direction of the dependency, not the name.**
> If moving the file forces the new module to import back from the origin module, the file was
> already in the right place.

E o boy-scout rule do ratchet: _"a file you touch that sits inside a cyclic component leaves the
PR with one edge fewer — undo the import that closes the cycle (the edge test above) rather than
adding to it; never mass-refactor cycles the PR doesn't touch. The cap only ever goes down."_

Ferramentas, em ordem de preferência:

1. **`import type`** — some do build e, como `consistent-type-imports` **não** está configurado
   (ver Apêndice), é convenção. **Atenção:** no grafo do `check:cycles` ele **continua contando**
   (`tsPreCompilationDeps: true`); resolve o ciclo de runtime CommonJS, não o ratchet.
2. **Inverter a dependência com uma porta declarada pelo consumidor + injeção no composition
   root.** Exemplo real (decisão `BE: docs/decisions/2026-09-01-orcamento-como-sinal-de-sugestao-de-regra.md`):
   `budget` já alcançava `categorizationRule` por `budget → transaction → categorizationRule`.
   Publicar `BudgetExpectation` pelo `budget/contract.ts` e importar em `categorizationRule`
   (mesmo `import type`) fechava o ciclo e levava a componente de 83 → 88 arquivos, acima do cap.
   Solução: `categorizationRule` **declara o formato que consome** e recebe a função por parâmetro;
   `index.ts` injeta `BudgetService.getBudgetExpectations`.

   `BE: src/modules/categorizationRule/ruleSuggestion.types.ts` (recorte):

   ```ts
   export interface BudgetExpectation {
     itemName: string;
     groupLabel: string;
     categoryId: string;
     subcategoryId: string | null;
     expected: number;
     minValue: number | null;
     maxValue: number | null;
   }

   export type LoadBudgetExpectations = (userId: string) => Promise<BudgetExpectation[]>;
   ```

   `BE: src/modules/categorizationRule/categorizationRuleRouter.ts` (recorte):

   ```ts
   import type { LoadBudgetExpectations } from "./ruleSuggestion.types";

   export const createCategorizationRuleRouter = ({
     loadBudgetExpectations,
   }: {
     loadBudgetExpectations: LoadBudgetExpectations;
   }): Router => {
     const router = Router();
     // …
     router.post(
       "/suggestions",
       authenticateClient,
       suggestCategorizationRules(loadBudgetExpectations),
     );
     // …
     return router;
   };
   ```

   `BE: src/index.ts` (recorte):

   ```ts
   import {
     BudgetService,
     createBudgetRouter,
     createExternalBudgetRouter,
   } from "@/modules/budget/contract";
   // …
   app.use(
     "/api/categorization-rule",
     createCategorizationRuleRouter({
       loadBudgetExpectations: BudgetService.getBudgetExpectations,
     }),
   );
   ```

   O produtor tem o **seu** tipo (`BE: src/modules/budget/budgetExpectation.ts`, com um campo a
   mais, `group: BudgetGroup`) e a compatibilidade é **estrutural** — o consumidor declara o
   subconjunto que precisa. A decisão registra as alternativas descartadas: ler a tabela direto
   (duplicaria a leitura do `BudgetService`), publicar o tipo pelo `budget/contract.ts` ("a
   modelagem mais óbvia, e foi ela que estourou o ratchet").

3. **Mover o mount, não o handler** (routers): _"When a route's handler legitimately belongs to
   another module, the mount moves, not the handler: the owner publishes its own router through
   its contract and `index.ts` composes by prefix — Express mounts any number of routers on the
   same path."_ Exemplo real no `index.ts`: `/api/transaction` recebe três routers de três
   módulos (`transactionSync`, `transaction`, `statement`); `/api/external` recebe sete.
4. **Mover o arquivo para o módulo dono** (via `git mv`, PR separado de mudança de lógica).
5. **Subir para `shared/`** — só se o arquivo **não nomeia domínio**. Nunca como atalho para
   quebrar ciclo (é o anti-pattern que a decisão de 2026-08-27 proibiu).

O histórico do porquê o ratchet é por arquivos-em-SCC e não pela baseline nativa está em
`docs/decisions/2026-08-28-ciclos-ratchet-por-scc.md` (existe nos dois repos), íntegra:

```markdown
# Ciclo de import travado por ratchet de arquivos em ciclo, não pela baseline do dependency-cruiser

## Contexto

Com as regras de fronteira ligadas nos 6 repos, o que sobrou de dívida estrutural foi ciclo
de import: medido em 2026-08-28, uma única componente fortemente conexa de 107 arquivos em 20
módulos no arko_backend, e o equivalente nos outros — 706 "ciclos" somados em 4 repos. Nenhum
quebra em runtime hoje (os routers são factory), então a decisão era só **como impedir que
cresça**.

A primeira tentativa foi a nativa: `dependency-cruiser` com `no-circular` como error e os
ciclos herdados numa baseline (`.dependency-cruiser-known-violations.json`, `--ignore-known`).
No primeiro corte real — `auth` deixando de importar `user` — a baseline "cresceu" de 86 para
104 sem nenhum ciclo novo, e a árvore nova contra a baseline antiga acusou **66 ciclos
"novos"**. A causa está em `is-same-violation.mjs`: para `no-circular`, um known violation
casa pelo **caminho do ciclo** (mesmo tamanho, mesmos arquivos), não por `from → to`; e o
dependency-cruiser grava em cada aresta "o primeiro ciclo que encontrou". Dentro de uma
componente grande, qualquer mudança re-roteia esses caminhos: PR sem ciclo novo fica vermelho,
e a regra "a baseline nunca cresce" perde o sentido porque a contagem oscila por artefato.

## Decisão

`npm run check:cycles` passa a ser `scripts/checkCycles.ts` (byte-idêntico nos 6): pede ao
dependency-cruiser só o **grafo** (`--output-type json`; o `.dependency-cruiser.cjs` guarda
apenas opções de resolução, sem regra), roda Tarjan (`scripts/cyclicFiles.ts`, núcleo puro com
teste colado) e mede **quantos arquivos de `src/` estão dentro de uma componente cíclica**. O
CI roda com `--max-files N`, o número medido no dia; a métrica é um ratchet igual ao
`--max-warnings` do lint: falha quando um arquivo entra num ciclo, e quem tira arquivos de um
ciclo desce o cap no mesmo PR. **O cap nunca sobe.** A baseline JSON foi apagada.

Nos backends o script roda pelo runner que o repo já usa (`ts-node`, ou `tsx` no
tools_backend); os frontends ganharam `tsx` como devDependency — era a única forma de rodar o
mesmo arquivo `.ts` sem reescrevê-lo em JS.

## Por quê

Arquivos-em-componente-cíclica é a medida canônica de "quanto do grafo é cíclico" e é
monotônica: acrescentar aresta só pode aumentar a componente, remover só pode diminuir. Não
depende de qual ciclo o detector enumerou primeiro, então não oscila. E é o mesmo mecanismo
que a casa já usa para warning de lint e para cobertura — um número no CI que só desce.

## Alternativas descartadas

- **Manter `--ignore-known` e regenerar a baseline quando "crescer"** — todo PR no miolo ganha
  um passo manual, e ninguém sabe mais se a regeneração escondeu ciclo novo.
- **`no-circular` como `warn`, sem baseline** — nunca falha, só imprime: teatro.
- **Cap em arestas dentro da componente, não em arquivos** — mais rígido, mas com 88 arquivos
  numa componente quase todo import novo entre eles cria "ciclo"; bloquearia trabalho comum
  sem reduzir a componente. Arquivos mede o que interessa: a região cíclica não se espalha.
- **`madge --circular`** — enumera ciclos elementares; mesma instabilidade de contagem.
```

### 3.5 Como roda no CI / pre-commit

**Não há pre-commit hook** (sem husky/lint-staged no `package.json` de nenhum dos dois). Tudo é
no CI, em PR para `main`. `BE: .github/workflows/ci.yml` (íntegra; o do FE é igual sem o passo
Prisma, com `--max-warnings 58` e `--max-files 83`):

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install deps
        run: npm install

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Lint
        run: npm run lint -- --max-warnings 41

      - name: Cycles
        run: npm run check:cycles -- --max-files 7
        env:
          NODE_OPTIONS: --max-old-space-size=4096

      - name: Tests
        run: npm test

      - name: Prettier check
        run: npm run format:check

      - name: Build
        run: npm run build
```

Três ratchets numéricos que **só descem**, todos no mesmo padrão: `--max-warnings` (lint),
`--max-files` (ciclos), `coverage.thresholds` com `autoUpdate: false` (`vitest.config.ts` no BE,
`vite.config.ts` no FE). Quem reduz o número, abaixa o cap no mesmo PR.

Além do `ci.yml`, o `claude-review.yml` roda um gate de tamanho de PR (700 linhas de produção /
1000 de teste, contadas ignorando vazias e só-pontuação) e um review por IA guiado pelo
`REVIEW.md` — o `REVIEW.md` manda **não** reportar o que o CI já pega (lint, tsc, prettier,
ratchets) e lista o que o lint não enxerga (I/O em função pura, `new Date()` em cálculo, enum
comparado com literal, função pura sem `.test.ts`).

Definition of done local (CLAUDE.md): `npm run build` + `npm run lint` + `npm run format:check` +
`npm test` verdes em cada repo tocado.

---

## 4. Contratos (prioridade máxima)

### 4.1 O que é "contract" aqui

A palavra tem **um** significado técnico: **`modules/<domain>/contract.ts`, a porta pública do
módulo**. Não é DTO, não é interface de port/adapter, não é evento. É um arquivo sem lógica com
linhas `export { X } from './x'` escritas à mão.

O que passa por ele (e portanto o que "contrato" cobre na prática):

| Tipo de coisa        | Backend                                                                    | Frontend                                                     |
| -------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Entrada do módulo    | `createXRouter` (factory)                                                  | página (`Objectives`), modais reutilizados                   |
| Orquestrador         | `XService` (classe estática)                                               | hook (`useEmergencyReserve`), `xService` (wrapper API)       |
| Tipos                | `export type { … } from './x.types'`                                       | `export type { ObjectiveResponse } from './objective.types'` |
| Enums de domínio     | vêm do `@prisma/client`, ou arquivo próprio (`retirementMeetingTarget.ts`) | espelho TS do enum do banco (`objectivePreset.ts`)           |
| Schemas Zod          | raramente (`user/contract.ts` exporta `invoiceSchema`)                     | não há Zod no front                                          |
| Funções puras        | `determineClientContractStatus`                                            | `objectiveProgressPercentage`                                |
| Middlewares de auth  | `auth/contract.ts` exporta `authenticate*`                                 | `auth/contract.ts` exporta `getUserRole`, `ProtectedRoute`…  |
| Constantes de limite | `RECONCILIATION_LIMITS`, `ACCESS_KEY_ENV_VARS`                             | —                                                            |

Além disso existem outras famílias de "contrato" com nome próprio:

- **`*Schema.ts`** — Zod de entrada HTTP, no módulo dono, consumido por `validateForm(schema)`.
- **`*.types.ts`** — tipos exportados; **nunca** dentro de service/controller/componente
  (CLAUDE.md "Types & Models").
- **Port** (DIP): `FE: src/shared/utils/api/authPort.ts` (`AuthPort` interface + `setAuthPort`) e
  `BE: LoadBudgetExpectations` (tipo-função declarado pelo consumidor). O CLAUDE.md é explícito
  que **não** é hexagonal: _"there is no port/adapter, no interface with a single implementation,
  and Prisma is not wrapped in a repository — Prisma is the adapter."_ Os dois ports existem
  porque resolveram um ciclo real, não por princípio.

Nomenclatura: `contract.ts` (sempre esse nome, um por módulo), `camelCase.types.ts`,
`camelCaseSchema.ts`, enums em arquivo próprio `camelCase.ts` com nome do enum.

### 4.2 Quem é dono; caminho completo A → B

**Dono = produtor.** _"Has a domain owner? It stays in the owning module and is published by its
`contract.ts`."_ O consumidor só importa do contract. Exceção deliberada: quando publicar pelo
produtor fecharia um ciclo, o **consumidor declara o formato** e o composition root liga (§3.4).

**Caminho real 1 — backend, `objective` consome `budget` e `crm`:**

1. `B` produz: `BE: src/modules/budget/budgetService.ts` exporta `class BudgetService` com
   `static async updateBudgets(userId, data)`, `createDefaultBudgets(userId)`;
   `BE: src/modules/budget/budget.types.ts` exporta `BudgetData`, `BudgetEntry`.
2. `B` publica — `BE: src/modules/budget/contract.ts` (íntegra):
   ```ts
   export type { BudgetData, BudgetEntry } from "./budget.types";
   export { createBudgetRouter } from "./budgetRouter";
   export { BudgetService } from "./budgetService";
   export { createExternalBudgetRouter } from "./externalBudgetRouter";
   ```
3. `A` consome — `BE: src/modules/objective/objectiveService.ts` (recorte dos imports):
   ```ts
   import { AchievementService } from "@/modules/achievement/contract";
   import { BudgetService } from "@/modules/budget/contract";
   import { CrmService } from "@/modules/crm/contract";
   import type { BudgetData, BudgetEntry } from "@/modules/budget/contract";
   ```
   e `BE: src/modules/objective/objectivePresets.ts`:
   ```ts
   import { RetirementMeetingTarget } from "@/modules/crm/contract";
   ```
4. `crm/contract.ts` (íntegra):
   ```ts
   export type { ClientFinancialStatusEntry, ClientPersonalDataResponse } from "./crm.types";
   export { CrmFinancialStatus } from "./crmFinancialStatus";
   export { RetirementMeetingTarget } from "./retirementMeetingTarget";
   export { createCrmRouter } from "./crmRouter";
   export { CrmService } from "./crmService";
   ```
   `BE: src/modules/crm/retirementMeetingTarget.ts` (íntegra):
   ```ts
   export enum RetirementMeetingTarget {
     REAL_ESTATE_FUNDS = "REAL_ESTATE_FUNDS",
     STOCKS = "STOCKS",
   }
   ```

**Caminho real 2 — frontend, `dashboard` consome `objective`:**

1. Produtor: `FE: src/modules/objective/objective.types.ts` (`ObjectiveResponse`),
   `objectiveCalculations.ts` (`objectiveProgressPercentage`), `objectiveService.ts`.
2. Publica — `FE: src/modules/objective/contract.ts` (íntegra):
   ```ts
   export { default as AddContributionModal } from "./AddContributionModal";
   export { default as CreateObjectiveModal } from "./CreateObjectiveModal";
   export { default as EditObjectiveModal } from "./EditObjectiveModal";
   export { default as EmergencyReserveTile } from "./EmergencyReserveTile";
   export type { ObjectiveResponse } from "./objective.types";
   export { objectiveProgressPercentage } from "./objectiveCalculations";
   export { ObjectivePlanningMode } from "./objectivePlanningMode";
   export { ObjectivePreset } from "./objectivePreset";
   export { objectiveService } from "./objectiveService";
   export { default as Objectives } from "./Objectives";
   export { useEmergencyReserve } from "./useEmergencyReserve";
   ```
3. Consome — `FE: src/modules/dashboard/dashboardObjectives.ts` (íntegra, núcleo puro):
   ```ts
   import type { ObjectiveResponse } from "@/modules/objective/contract";

   export const MAX_DASHBOARD_OBJECTIVES = 4;

   const isOpen = (objective: ObjectiveResponse): boolean =>
     objective.accumulated < objective.value;

   const byGoalDate = (first: ObjectiveResponse, second: ObjectiveResponse): number =>
     new Date(first.goalDate).getTime() - new Date(second.goalDate).getTime();

   export const selectDashboardObjectives = (
     objectives: ObjectiveResponse[],
     maxItems: number = MAX_DASHBOARD_OBJECTIVES,
   ): ObjectiveResponse[] => objectives.filter(isOpen).sort(byGoalDate).slice(0, maxItems);
   ```
   e `FE: src/modules/dashboard/FinancialObjectivesWidget.tsx` (recorte):
   ```ts
   import {
     type ObjectiveResponse,
     objectiveProgressPercentage,
     objectiveService,
   } from "@/modules/objective/contract";
   ```
   Consumidores reais do contract de `objective` no front: `App.tsx`, `dashboard` (3 arquivos),
   `designSystem`, `investment`, `pension`.

### 4.3 Como contratos evoluem sem quebrar consumidores

Não há versionamento explícito (sem `v1/`, sem sufixo de versão). Os mecanismos observados:

1. **Campos opcionais / nullable no schema Zod e no tipo.** `updateObjectiveSchema` tem todos os
   campos `.optional()` e um `.refine` exigindo ao menos um; o front manda só o diff
   (`buildObjectiveUpdatePayload` monta o objeto com spreads condicionais).
2. **Nova coluna com default no Prisma + enum de intenção.** Decisão
   `BE: docs/decisions/2026-07-28-modo-de-planejamento-do-objetivo.md`: em vez de "segunda coluna
   `fixedMonthlyContribution`", entrou `planningMode ObjectivePlanningMode @default(BY_DATE)`;
   `monthlyContribution` no schema de criação virou `.optional()`; consumidores antigos continuam
   mandando só `goalDate` e caem no default. O front ganhou o espelho `objectivePlanningMode.ts`.
3. **Mapeador na saída (`toObjectiveSummary`)** — a rota externa devolve um shape estável
   (`ObjectiveSummary`) e não o registro Prisma inteiro; adicionar coluna no banco não vaza.
4. **Tipagem estrutural no consumidor** — `categorizationRule.BudgetExpectation` é subconjunto de
   `budget.BudgetExpectation`; o produtor pode ganhar campos sem tocar o consumidor.
5. **`Omit`/`Pick`/`Partial` em vez de duplicar** (CLAUDE.md TypeScript): `ObjectiveResponse
extends Omit<Objective, 'goalDate' | 'assetIds'>`.
6. **Regra do contract: só o que tem consumidor hoje** — retirar export é seguro porque o lint
   quebra o build de quem ainda importava.
7. Fronteira externa (Arko ↔ CRM) tem uma "ADR" própria no CLAUDE.md: rotas `/api/external/*`
   autenticadas por API key, `try*` que nunca lançam — o contrato aí é a rota + o JSON, sem
   biblioteca compartilhada entre repos (tipos são duplicados à mão nos dois lados; ver
   `crm.types.ts`).

### 4.4 Dois contratos reais na íntegra + produtor + consumidor

**Contrato 1 — `BE: src/modules/objective/contract.ts`** (íntegra):

```ts
export { createExternalObjectiveRouter } from "./externalObjectiveRouter";
export { createObjectiveRouter } from "./objectiveRouter";
export { ObjectiveService } from "./objectiveService";
```

Produtor — `BE: src/modules/objective/objectiveRouter.ts` (íntegra):

```ts
import { Router } from "express";
import { authenticateClient } from "@/modules/auth/contract";
import { validateForm } from "@/shared/middlewares/formValidationMiddleware";
import { objectiveSchema, updateObjectiveSchema } from "./objectiveSchema";
import {
  createObjective,
  deleteObjective,
  getObjectives,
  updateObjective,
} from "./objectiveController";
import { GeneralValidationsMiddleware } from "@/shared/middlewares/paramsValidationMiddleware";

export const createObjectiveRouter = (): Router => {
  const router = Router();

  router.post("/", authenticateClient, validateForm(objectiveSchema), createObjective);
  router.get("/", authenticateClient, getObjectives);
  router.patch("/", authenticateClient, validateForm(updateObjectiveSchema), updateObjective);
  router.delete(
    "/",
    authenticateClient,
    GeneralValidationsMiddleware.validateIdParams({ id: "query" }),
    deleteObjective,
  );

  return router;
};
```

Consumidor — `BE: src/index.ts` (recorte):

```ts
import { createExternalObjectiveRouter, createObjectiveRouter } from "@/modules/objective/contract";
// …
app.use("/api/objective", createObjectiveRouter());
// …
app.use("/api/external", createExternalObjectiveRouter());
```

**Contrato 2 — `BE: src/modules/categorizationRule/contract.ts`** (íntegra) — mostra o export de
tipo junto com o service e a factory que recebe injeção:

```ts
export { createCategorizationRuleRouter } from "./categorizationRuleRouter";
export { CategorizationRuleService, type EvaluationRule } from "./categorizationRuleService";
```

Produtor e consumidor já estão em §3.4 (router recebe `loadBudgetExpectations`; `index.ts` injeta
`BudgetService.getBudgetExpectations`). Outros consumidores reais desse contract:
`transaction/transactionManagementService.ts`, `transactionSync/openFinanceTransactionsService.ts`,
`transactionSync/transactionCategorization.types.ts`, `transactionSync/transactionCategorizationService.ts`,
`transactionSync/transactionSync.types.ts`.

**Contrato 3 (front, para o par produtor/consumidor de tipo) — `FE: src/modules/crm/contract.ts`**
(íntegra):

```ts
export type { CrmInvestmentAsset } from "./crmInvestmentAsset.types";
export { crmService } from "./crmService";
export type { MedicalSpecialty } from "./crmService";
export {
  INVESTMENT_ASSET_CATEGORY_LABELS,
  InvestmentAssetCategory,
} from "./investmentAssetCategory";
```

Consumidor — `FE: src/modules/objective/assetSelectOptions.ts` (íntegra):

```ts
import { CrmInvestmentAsset, INVESTMENT_ASSET_CATEGORY_LABELS } from "@/modules/crm/contract";
import type { ObjectiveAssetLink } from "./objective.types";

interface AssetOption {
  value: string;
  label: string;
}

export const buildAssetOptions = (assets: CrmInvestmentAsset[]): AssetOption[] => {
  const nameCounts = new Map<string, number>();
  assets.forEach((asset) => nameCounts.set(asset.name, (nameCounts.get(asset.name) ?? 0) + 1));
  return assets.map((asset) => ({
    value: asset.id,
    label:
      (nameCounts.get(asset.name) ?? 0) > 1
        ? `${asset.name} (${INVESTMENT_ASSET_CATEGORY_LABELS[asset.category]})`
        : asset.name,
  }));
};

export const mergeMissingAssetOptions = (
  options: AssetOption[],
  links: readonly ObjectiveAssetLink[],
): AssetOption[] => {
  const missing = links.filter((link) => !options.some((option) => option.value === link.assetId));
  if (missing.length === 0) return options;
  return [...missing.map((link) => ({ value: link.assetId, label: link.assetName })), ...options];
};
```

### 4.5 Contratos na fronteira cliente/servidor

Não há pacote compartilhado entre `arko_frontend` e `arko_backend`. A fronteira é HTTP/JSON e
cada lado tem sua cópia dos tipos. O fluxo, com paths:

**Entrada (servidor):** `validateForm(schema)` — `BE: src/shared/middlewares/formValidationMiddleware.ts` (íntegra):

```ts
import { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const validateForm = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.is("application/json")) {
        res.status(400).json({ error: "Request body must be JSON" });
        return;
      }

      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errorMessages = err.errors.reduce(
          (acc, error) => {
            const field = error.path[0];
            if (!acc[field]) acc[field] = [];
            acc[field].push(error.message);
            return acc;
          },
          {} as Record<string, string[]>,
        );
        res.status(400).json({ errors: errorMessages });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
  };
};
```

Schema real — `BE: src/modules/objective/objectiveSchema.ts` (recorte do `objectiveSchema`; o
`updateObjectiveSchema` é o mesmo com tudo `.optional()` + `.refine` de "ao menos um campo"):

```ts
import { z } from "zod";
import { ObjectivePreset } from "@prisma/client";

export const objectiveSchema = z.object({
  name: z.string().max(100),
  preset: z.nativeEnum(ObjectivePreset).optional(),
  assetIds: z.array(z.string().uuid()).min(1),
  value: z.number().positive(),
  rentability: z.number().min(0),
  accumulated: z.number().min(0),
  monthlyContribution: z.number().positive().optional(),
  initialDate: z
    .string()
    .regex(/^\d{2}-\d{2}-\d{4}$/, "initialDate deve estar no formato dd-mm-yyyy")
    .refine(
      (date) => {
        const [day, month, year] = date.split("-").map(Number);
        const parsedDate = new Date(year, month - 1, day);
        return (
          parsedDate.getFullYear() === year &&
          parsedDate.getMonth() === month - 1 &&
          parsedDate.getDate() === day
        );
      },
      { message: "Parâmetro de data inválido" },
    ),
  goalDate: /* idêntico a initialDate */ z.string(),
});
```

Note `z.nativeEnum(ObjectivePreset)` importado de `@prisma/client`: **o enum do banco é a fonte
única no backend; nunca redeclarado** (CLAUDE.md BE: _"Prisma enums are imported from
`@prisma/client`, never redeclared"_). O tipo do schema **não** é exportado com `z.infer` — o
controller desestrutura `req.body` e o service tipa o parâmetro à mão (ver Apêndice).

**Enum banco → UI:** o front não vê o Prisma, então **espelha** o enum em arquivo próprio:

`prisma/schema.prisma` (recorte):

```prisma
enum ObjectivePlanningMode {
  BY_DATE
  BY_CONTRIBUTION
}

enum ObjectivePreset {
  HOUSE
  CAR
  WEDDING
  RETIREMENT_PRIVATE_PENSION
  RETIREMENT_REAL_ESTATE_FUNDS
  RETIREMENT_STOCKS
  EMERGENCY_RESERVE
  TRAVEL
}
```

`FE: src/modules/objective/objectivePreset.ts` (íntegra — enum + labels PT + ordem de exibição +
opção só-de-UI `CUSTOM` num enum separado, para não contaminar o enum do domínio):

```ts
export enum ObjectivePreset {
  EMERGENCY_RESERVE = "EMERGENCY_RESERVE",
  HOUSE = "HOUSE",
  CAR = "CAR",
  WEDDING = "WEDDING",
  TRAVEL = "TRAVEL",
  RETIREMENT_PRIVATE_PENSION = "RETIREMENT_PRIVATE_PENSION",
  RETIREMENT_REAL_ESTATE_FUNDS = "RETIREMENT_REAL_ESTATE_FUNDS",
  RETIREMENT_STOCKS = "RETIREMENT_STOCKS",
}

export const OBJECTIVE_PRESET_NAMES: Record<ObjectivePreset, string> = {
  [ObjectivePreset.EMERGENCY_RESERVE]: "Reserva de Emergência",
  [ObjectivePreset.HOUSE]: "Casa",
  [ObjectivePreset.CAR]: "Carro",
  [ObjectivePreset.WEDDING]: "Casamento",
  [ObjectivePreset.TRAVEL]: "Viagem",
  [ObjectivePreset.RETIREMENT_PRIVATE_PENSION]: "Aposentadoria - Previdência",
  [ObjectivePreset.RETIREMENT_REAL_ESTATE_FUNDS]: "Aposentadoria - Fundos Imobiliários",
  [ObjectivePreset.RETIREMENT_STOCKS]: "Aposentadoria - Ações",
};

export const OBJECTIVE_PRESET_ORDER: ObjectivePreset[] = [
  ObjectivePreset.EMERGENCY_RESERVE,
  ObjectivePreset.HOUSE,
  ObjectivePreset.CAR,
  ObjectivePreset.WEDDING,
  ObjectivePreset.TRAVEL,
  ObjectivePreset.RETIREMENT_PRIVATE_PENSION,
  ObjectivePreset.RETIREMENT_REAL_ESTATE_FUNDS,
  ObjectivePreset.RETIREMENT_STOCKS,
];

export enum ObjectiveTypeChoice {
  CUSTOM = "CUSTOM",
}

export type ObjectiveTypeSelection = ObjectivePreset | ObjectiveTypeChoice;
```

**Tipagem de resposta (cliente):** `FE: src/modules/objective/objective.types.ts` (íntegra):

```ts
import { ObjectivePlanningMode } from "./objectivePlanningMode";
import { ObjectivePreset } from "./objectivePreset";

export interface ObjectiveAssetLink {
  assetId: string;
  assetName: string;
}

export interface Objective {
  name: string;
  value: number;
  rentability: number;
  accumulated: number;
  goalDate: string;
  initialDate: string;
  preset?: ObjectivePreset | null;
  monthlyContribution?: number;
  assetIds: string[];
}

export interface ObjectiveUpdatePayload {
  id: string;
  name?: string;
  value?: number;
  rentability?: number;
  accumulated?: number;
  goalDate?: string;
  initialDate?: string;
  preset?: ObjectivePreset | null;
  monthlyContribution?: number;
  assetIds?: string[];
}

export interface ObjectiveResponse extends Omit<Objective, "goalDate" | "assetIds"> {
  id: string;
  userId: string;
  goalDate: string;
  assets: ObjectiveAssetLink[];
  initialDate: string;
  remainingMonths: number;
  monthlyContribution: number;
  planningMode: ObjectivePlanningMode;
  preset: ObjectivePreset | null;
  createdAt: string;
  updatedAt: string;
}
```

Wrapper de API — `FE: src/modules/objective/objectiveService.ts` (íntegra): o único arquivo do
módulo que toca a rede, e o `api` genérico tipa a resposta:

```ts
import api from "@/shared/utils/api/client";
import type { Objective, ObjectiveResponse, ObjectiveUpdatePayload } from "./objective.types";

export const objectiveService = {
  getObjectives: async (): Promise<ObjectiveResponse[]> => {
    const response = await api.get<ObjectiveResponse[]>("/objective");
    return response.data;
  },
  createObjective: async (payload: Objective): Promise<ObjectiveResponse> => {
    const response = await api.post<ObjectiveResponse>("/objective", payload);
    return response.data;
  },
  updateObjective: async (payload: ObjectiveUpdatePayload): Promise<void> => {
    await api.patch("/objective", payload);
  },
  addContribution: async (id: string, accumulated: number): Promise<void> => {
    await api.patch("/objective", { id, accumulated });
  },
  deleteObjective: async (id: string): Promise<void> => {
    await api.delete(`/objective?id=${id}`);
  },
};
```

**Mapeamento UI → payload** é núcleo puro com teste (`objectiveCreatePayload.ts`: centavos →
reais, `dd/MM/yyyy` → `dd-MM-yyyy`, spreads condicionais para omitir `preset`/`monthlyContribution`).

**Erro de servidor → UI:** o backend responde `{ message }` (MappedException) ou `{ errors: {campo: [msg]} }`
(Zod); o front tem `shared/models/types/api.types.ts` (`ApiError`) e
`shared/utils/apiErrorUtils.ts` (`extractApiErrorMessage`). Mensagens ao usuário são em PT;
identificadores em inglês (enforced pelo `no-restricted-syntax` de acentos).

**Mapeador de saída em rota externa** — `BE: src/modules/objective/objectiveSummary.ts` (íntegra):

```ts
import type { ObjectiveSummary } from "./objective.types";

export const toObjectiveSummary = (objective: ObjectiveSummary): ObjectiveSummary => ({
  id: objective.id,
  name: objective.name,
  value: objective.value,
  accumulated: objective.accumulated,
  rentability: objective.rentability,
  initialDate: objective.initialDate,
  goalDate: objective.goalDate,
  remainingMonths: objective.remainingMonths,
  monthlyContribution: objective.monthlyContribution,
  assets: objective.assets,
});
```

---

## 5. Anatomia de uma feature de ponta a ponta — `objective`

Escolhida por existir nos dois repos, ter schema Zod, cálculo puro com `now` injetado (citado
no CLAUDE.md como _reference implementation_ de DIP), rota interna + rota externa, e testes
colocados. **Não há template/generator de feature** (nenhum plop/hygen/scaffold nos `package.json`
nem em `scripts/`); a "receita" é a tabela de papéis do CLAUDE.md:

| Papel        | Backend                                     | Frontend                                       | Faz                                         |
| ------------ | ------------------------------------------- | ---------------------------------------------- | ------------------------------------------- |
| Entrada      | `xRouter.ts` + `xController.ts`             | `Page.tsx`                                     | traduz HTTP / renderiza                     |
| Orquestrador | `xService.ts`                               | `useX.ts` + `xService.ts`                      | busca, salva, notifica — toca o mundo       |
| Núcleo       | `xCalculations.ts`, `xPlan.ts`, `xGuard.ts` | `xRules.ts`, `xPayload.ts`, `xCalculations.ts` | decide, calcula, valida; `.test.ts` ao lado |
| Contrato     | `contract.ts`                               | `contract.ts`                                  | porta pública                               |
| Tipos        | `x.types.ts`, `xSchema.ts`, enums           | `x.types.ts`, enums espelho                    | —                                           |

### 5.1 Backend — `arko_backend/src/modules/objective/` (19 arquivos, plano)

Rotas montadas em `src/index.ts`: `app.use('/api/objective', createObjectiveRouter())` e
`app.use('/api/external', createExternalObjectiveRouter())`.

| Arquivo                          | Papel                                               | Imports                                                                                                                                                                                                                                                |
| -------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `contract.ts`                    | porta pública                                       | (só `export … from`)                                                                                                                                                                                                                                   |
| `objectiveRouter.ts`             | entrada (rota cliente)                              | `express`; `@/modules/auth/contract`; `@/shared/middlewares/formValidationMiddleware`; `@/shared/middlewares/paramsValidationMiddleware`; `./objectiveSchema`; `./objectiveController`                                                                 |
| `externalObjectiveRouter.ts`     | entrada (rota CRM, API key)                         | `express`; `@/modules/auth/contract` (`authenticateExternalApi`); `./externalObjectiveController`                                                                                                                                                      |
| `objectiveController.ts`         | entrada — traduz HTTP, try/catch MappedException    | `@/shared/models/mappedException`; `express`; `./objectiveService`                                                                                                                                                                                     |
| `externalObjectiveController.ts` | entrada externa (valida à mão, sem `req.body.user`) | `express`; `@/shared/models/mappedException`; `@/shared/utils/emailNormalization`; `./objectiveService`; `./objectiveSummary`; `./objectivesByEmail`                                                                                                   |
| `objectiveSchema.ts`             | contrato de entrada (Zod)                           | `zod`; `@prisma/client` (`ObjectivePreset`)                                                                                                                                                                                                            |
| `objective.types.ts`             | tipos exportados                                    | —                                                                                                                                                                                                                                                      |
| `objectiveService.ts`            | orquestrador (Prisma, CRM, budget, achievement)     | `@prisma/client`; `@/shared/dependencies/prismaClient`; `@/shared/models/mappedException`; `./objectivePresets`; `@/modules/achievement/contract`; `@/modules/budget/contract`; `@/modules/crm/contract`; `./objectiveNameMatchers`; `./objectivePlan` |
| `objectivePlan.ts`               | núcleo — decide o modo e resolve o plano            | `@prisma/client` (`ObjectivePlanningMode`); `./objectiveCalculations`                                                                                                                                                                                  |
| `objectivePlan.test.ts`          | teste do núcleo                                     | `vitest`; `./objectivePlan`                                                                                                                                                                                                                            |
| `objectiveCalculations.ts`       | núcleo — matemática financeira, `now` por parâmetro | `date-fns`                                                                                                                                                                                                                                             |
| `objectiveCalculations.test.ts`  | teste                                               | `vitest`; `./objectiveCalculations`                                                                                                                                                                                                                    |
| `objectivePresets.ts`            | núcleo — nomes dos presets e colisão de nome        | `@prisma/client`; `@/modules/crm/contract` (`RetirementMeetingTarget`)                                                                                                                                                                                 |
| `objectiveNameMatchers.ts`       | núcleo — heurística de nome                         | `@/shared/utils/utils` (`normalizeText`)                                                                                                                                                                                                               |
| `objectiveNameMatchers.test.ts`  | teste                                               | `vitest`; `./objectiveNameMatchers`                                                                                                                                                                                                                    |
| `objectiveSummary.ts`            | núcleo — mapeador de saída externa                  | `./objective.types` (type)                                                                                                                                                                                                                             |
| `objectiveSummary.test.ts`       | teste                                               | `vitest`; `./objectiveSummary`                                                                                                                                                                                                                         |
| `objectivesByEmail.ts`           | núcleo — agrupa por e-mail normalizado              | `@/shared/utils/emailNormalization`; `./objective.types` (type)                                                                                                                                                                                        |
| `objectivesByEmail.test.ts`      | teste                                               | `vitest`; `./objectivesByEmail`                                                                                                                                                                                                                        |

Não há fixtures em pasta — cada teste constrói seus valores literais inline (regra "core is tested
with literal values"; "if testing it requires a mock, it is in the wrong place").

**Núcleo puro com DIP do relógio — `objectiveCalculations.ts`** (íntegra):

```ts
import { addMonths, differenceInMonths } from "date-fns";

const MAX_PROJECTION_MONTHS = 1200;

export function calculateMonthlyContribution(
  value: number,
  accumulated: number,
  rentability: number,
  remainingMonths: number,
): number {
  if (remainingMonths <= 0) return Math.max(0, value - accumulated);
  if (rentability === 0) return Math.max(0, (value - accumulated) / remainingMonths);

  const i = Math.pow(1 + rentability / 100, 1 / 12) - 1;
  let sum = 0;

  for (let j = 0; j < remainingMonths; j++) {
    sum += Math.pow(1 + i, remainingMonths - j - 1);
  }

  return Math.max(0, (value - accumulated * Math.pow(1 + i, remainingMonths)) / sum);
}

export function calculateMonthsToReachGoal(
  value: number,
  accumulated: number,
  rentability: number,
  monthlyContribution: number,
): number {
  if (accumulated >= value) return 1;
  if (monthlyContribution <= 0) return MAX_PROJECTION_MONTHS;

  const i = Math.pow(1 + rentability / 100, 1 / 12) - 1;
  const months =
    i === 0
      ? (value - accumulated) / monthlyContribution
      : Math.log((value + monthlyContribution / i) / (accumulated + monthlyContribution / i)) /
        Math.log(1 + i);

  return Math.min(MAX_PROJECTION_MONTHS, Math.max(1, Math.ceil(months)));
}

function effectiveStartDate(initialDate: Date, now: Date): Date {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return initialDate > startOfToday ? initialDate : startOfToday;
}

export function calculatePlanByContribution(params: {
  value: number;
  accumulated: number;
  rentability: number;
  monthlyContribution: number;
  initialDate: Date;
  now: Date;
}): { remainingMonths: number; goalDate: Date } {
  const remainingMonths = calculateMonthsToReachGoal(
    params.value,
    params.accumulated,
    params.rentability,
    params.monthlyContribution,
  );
  return {
    remainingMonths,
    goalDate: addMonths(effectiveStartDate(params.initialDate, params.now), remainingMonths),
  };
}

export function calculateRemainingMonths(initialDate: Date, goalDate: Date, now: Date): number {
  const effectiveStart = effectiveStartDate(initialDate, now);
  const fullMonths = differenceInMonths(goalDate, effectiveStart);
  const hasPartialMonth = addMonths(effectiveStart, fullMonths) < goalDate;
  return Math.max(1, hasPartialMonth ? fullMonths + 1 : fullMonths);
}
```

**Teste colado — `objectiveCalculations.test.ts`** (íntegra):

```ts
import { describe, expect, it } from "vitest";
import {
  calculateMonthlyContribution,
  calculateMonthsToReachGoal,
  calculatePlanByContribution,
  calculateRemainingMonths,
} from "./objectiveCalculations";

describe("calculateMonthlyContribution", () => {
  it("divides the remaining amount evenly when rentability is zero", () => {
    expect(calculateMonthlyContribution(1200, 200, 0, 10)).toBe(100);
  });

  it("returns the missing amount when there are no months left", () => {
    expect(calculateMonthlyContribution(1000, 400, 5, 0)).toBe(600);
  });

  it("never returns a negative contribution", () => {
    expect(calculateMonthlyContribution(1000, 2000, 5, 12)).toBe(0);
  });
});

describe("calculateMonthsToReachGoal", () => {
  it("returns 1 when the goal is already reached", () => {
    expect(calculateMonthsToReachGoal(1000, 1000, 5, 100)).toBe(1);
  });

  it("caps at the projection ceiling when there is no contribution", () => {
    expect(calculateMonthsToReachGoal(1000, 0, 5, 0)).toBe(1200);
  });

  it("computes months by simple division when rentability is zero", () => {
    expect(calculateMonthsToReachGoal(1000, 0, 0, 100)).toBe(10);
  });
});

describe("calculatePlanByContribution", () => {
  const now = new Date(2026, 0, 15);

  it("projects the goal date from today when the start date is in the past", () => {
    const plan = calculatePlanByContribution({
      value: 1000,
      accumulated: 0,
      rentability: 0,
      monthlyContribution: 100,
      initialDate: new Date(2025, 0, 1),
      now,
    });
    expect(plan.remainingMonths).toBe(10);
    expect(plan.goalDate).toEqual(new Date(2026, 10, 15));
  });

  it("projects the goal date from the start date when it is in the future", () => {
    const plan = calculatePlanByContribution({
      value: 1000,
      accumulated: 0,
      rentability: 0,
      monthlyContribution: 100,
      initialDate: new Date(2026, 5, 1),
      now,
    });
    expect(plan.remainingMonths).toBe(10);
    expect(plan.goalDate).toEqual(new Date(2027, 3, 1));
  });
});

describe("calculateRemainingMonths", () => {
  const now = new Date(2026, 0, 15);

  it("counts whole months between start and goal", () => {
    const initialDate = new Date(2026, 0, 15);
    const goalDate = new Date(2026, 6, 15);
    expect(calculateRemainingMonths(initialDate, goalDate, now)).toBe(6);
  });

  it("rounds a partial month up", () => {
    const initialDate = new Date(2026, 0, 15);
    const goalDate = new Date(2026, 6, 20);
    expect(calculateRemainingMonths(initialDate, goalDate, now)).toBe(7);
  });
});
```

**Núcleo que decide — `objectivePlan.ts`** (íntegra):

```ts
import { ObjectivePlanningMode } from "@prisma/client";
import {
  calculateMonthlyContribution,
  calculatePlanByContribution,
  calculateRemainingMonths,
} from "./objectiveCalculations";

export type ObjectivePlan = {
  remainingMonths: number;
  goalDate: Date;
  monthlyContribution: number;
  planningMode: ObjectivePlanningMode;
};

export function resolvePlan(params: {
  value: number;
  accumulated: number;
  rentability: number;
  initialDate: Date;
  goalDate: Date;
  monthlyContribution: number | null;
  now: Date;
}): ObjectivePlan {
  const { value, accumulated, rentability, initialDate, now } = params;

  if (params.monthlyContribution != null) {
    const plan = calculatePlanByContribution({
      value,
      accumulated,
      rentability,
      monthlyContribution: params.monthlyContribution,
      initialDate,
      now,
    });
    return {
      ...plan,
      monthlyContribution: params.monthlyContribution,
      planningMode: ObjectivePlanningMode.BY_CONTRIBUTION,
    };
  }

  const remainingMonths =
    params.goalDate > now ? calculateRemainingMonths(initialDate, params.goalDate, now) : 0;

  return {
    remainingMonths,
    goalDate: params.goalDate,
    monthlyContribution: calculateMonthlyContribution(
      value,
      accumulated,
      rentability,
      remainingMonths,
    ),
    planningMode: ObjectivePlanningMode.BY_DATE,
  };
}
```

**Entrada — `objectiveController.ts`** (recorte de um handler; os quatro seguem o mesmo molde):

```ts
import { MappedException } from "@/shared/models/mappedException";
import { Request, Response } from "express";
import { ObjectiveService } from "./objectiveService";

export const getObjectives = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body.user;
    const objectives = await ObjectiveService.getObjectives(userId);
    res.status(200).json(objectives);
  } catch (err) {
    if (err instanceof MappedException) {
      res.status(err.statusCode).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};
```

(`req.body.user` é o payload JWT que o `authenticateClient` injeta. Módulos mais novos usam
`withErrorResponse(handler, fallback)` de `shared/middlewares/withErrorResponse.ts` em vez do
try/catch repetido — `categorizationRuleController`, `transactionSyncController`.)

**Orquestrador — `objectiveService.ts`** (recorte de `createObjective`; o arquivo inteiro tem
632 linhas brutas e mostra o padrão: lê tudo → chama núcleo puro → persiste → efeitos colaterais
em `try {} catch {}` para não derrubar a operação principal):

```ts
export class ObjectiveService {
  public static async createObjective(objectiveData: {
    userId: string;
    name: string;
    value: number;
    rentability: number;
    accumulated: number;
    initialDate: string;
    goalDate: string;
    preset?: ObjectivePreset | null;
    monthlyContribution?: number | null;
    assetIds: string[];
  }) {
    const { userId, value, rentability, accumulated, initialDate, goalDate } = objectiveData;
    const preset = objectiveData.preset ?? null;

    let name: string;
    if (preset) {
      name = OBJECTIVE_PRESET_NAMES[preset];
      const existingPreset = await prismaClient.objective.findFirst({
        where: { userId, preset },
        select: { id: true },
      });
      if (existingPreset) {
        throw new MappedException(`Você já tem o objetivo "${name}".`, 409);
      }
    } else {
      name = objectiveData.name;
      const collidingPreset = findCollidingPreset(name);
      if (collidingPreset) {
        throw new MappedException(
          `Esse nome corresponde ao objetivo pronto "${OBJECTIVE_PRESET_NAMES[collidingPreset]}". Escolha-o na lista de objetivos prontos.`,
          409,
        );
      }
    }

    const [initDay, initMonth, initYear] = initialDate.split("-").map(Number);
    const [goalDay, goalMonth, goalYear] = goalDate.split("-").map(Number);
    const formattedInitialDate = new Date(initYear, initMonth - 1, initDay);
    const formattedGoalDate = new Date(goalYear, goalMonth - 1, goalDay);

    if (formattedGoalDate <= formattedInitialDate) {
      throw new MappedException("A data do objetivo deve estar no futuro.", 400);
    }

    const now = new Date();

    if (formattedGoalDate <= now) {
      throw new MappedException("A data do objetivo deve estar no futuro.", 400);
    }

    const plan = resolvePlan({
      value,
      accumulated,
      rentability,
      initialDate: formattedInitialDate,
      goalDate: formattedGoalDate,
      monthlyContribution: objectiveData.monthlyContribution ?? null,
      now,
    });

    const assets = await CrmService.getInvestmentAssetsByIds(objectiveData.assetIds);

    const objective = await prismaClient.objective.create({
      data: {
        userId,
        name,
        preset,
        value,
        rentability,
        accumulated,
        initialDate: formattedInitialDate,
        goalDate: plan.goalDate,
        remainingMonths: plan.remainingMonths,
        monthlyContribution: plan.monthlyContribution,
        planningMode: plan.planningMode,
        assets: {
          create: assets.map((asset) => ({
            assetId: asset.id,
            assetName: asset.name,
          })),
        },
      },
      include: OBJECTIVE_ASSETS_INCLUDE,
    });

    await this.syncInvestmentBudgetEntry(userId, {
      id: objective.id,
      name: objective.name,
      monthlyContribution: objective.monthlyContribution,
    });

    try {
      await AchievementService.checkAndAddEmergencyReserveAchievement(
        userId,
        name,
        accumulated,
        value,
      );
    } catch {}

    // … notificações ao CRM (métodos try* nunca lançam) …

    return objective;
  }
}
```

**Modelo Prisma** (`prisma/schema.prisma`, recorte):

```prisma
model Objective {
  id                  String                @id @default(uuid()) @db.Uuid
  userId              String                @map("user_id") @db.Uuid
  name                String                @db.VarChar(100)
  value               Float
  rentability         Float
  accumulated         Float
  goalDate            DateTime              @map("goal_date") @db.Date
  remainingMonths     Int
  monthlyContribution Float
  createdAt           DateTime              @default(now()) @map("created_at")
  updatedAt           DateTime              @updatedAt @map("updated_at")
  initialDate         DateTime              @default(dbgenerated("CURRENT_DATE")) @map("initial_date") @db.Date
  preset              ObjectivePreset?
  planningMode        ObjectivePlanningMode @default(BY_DATE) @map("planning_mode")
  assets              ObjectiveAsset[]
  user                User                  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, preset])
  @@map("objectives")
}
```

Acesso a dados: **Prisma direto no `*Service.ts`**, sem repository. `BE: src/shared/dependencies/prismaClient.ts` (íntegra):

```ts
import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient({
  log: ["error"],
});

export { prismaClient };
```

### 5.2 Frontend — `arko_frontend/src/modules/objective/` (27 arquivos, plano)

Rota em `src/App.tsx`: `<Route path="/objetivos" element={<Objectives />} />` (import de
`@/modules/objective/contract`).

| Arquivo                          | Papel                                              | Imports                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contract.ts`                    | porta pública                                      | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `Objectives.tsx`                 | entrada (página) — estado de UI, busca via service | `react`; `framer-motion`; `@phosphor-icons/react`; `./CreateObjectiveModal`; `./ObjectiveCard`; `@/shared/ui/{FilterControl,ListToolbar,SnackbarContext,Spinner,Card,Text,SearchInput,Button,PageContainer,MetricTile,CardGroup,animations}`; `@/shared/layout/useTopbarTools`; `./objectiveService`; `./objective.types`; `./objectiveFilter`                                                                                                                         |
| `ObjectiveCard.tsx`              | componente                                         | `react`; `@phosphor-icons/react`; `./objective.types`; `./EditObjectiveModal`; `./AddContributionModal`; `@/shared/ui/{Badge,Button,IconButton,Progress,Text,Tooltip}`; `./objectiveCalculations`                                                                                                                                                                                                                                                                      |
| `CreateObjectiveModal.tsx`       | componente + orquestra submit                      | `react`; `date-fns`; `./objectiveService`; `@/shared/ui/Modal`; `./ObjectiveTypeSelector`; `./ObjectiveFormFields`; `./ObjectivePreviewTiles`; `@/modules/crm/contract`; `./assetSelectOptions`; `./objectivePlanningMode`; `./objective.types`; `./objectivePreset`; `@/shared/ui/SnackbarContext`; `@/shared/utils/{dateUtils,currencyUtils,apiErrorUtils}`; `@/shared/hooks/useAsyncTask`; `./useObjectiveForm`; `./objectiveFormRules`; `./objectiveCreatePayload` |
| `EditObjectiveModal.tsx`         | componente + orquestra submit                      | idem acima + `@/shared/ui/{Button,ConfirmDeleteModal,IconButton,Spinner}`; `@/shared/models/enums/spinnerTone`; `./objectiveUpdatePayload`                                                                                                                                                                                                                                                                                                                             |
| `AddContributionModal.tsx`       | componente                                         | `react`; `./objectiveService`; `@/shared/ui/{Modal,Input,Button,Spinner}`; `@/shared/models/enums/spinnerTone`; `./objective.types`; `@/shared/utils/currencyUtils`                                                                                                                                                                                                                                                                                                    |
| `ObjectiveFormFields.tsx`        | componente (form controlado)                       | `@/shared/ui/{Input,SearchableDropdown,SegmentedControl}`; `@/shared/utils/currencyUtils`; `./objectivePlanningMode`; `./objectiveFormRules` (types)                                                                                                                                                                                                                                                                                                                   |
| `ObjectivePreviewTiles.tsx`      | componente                                         | `react`; `@phosphor-icons/react`; `date-fns`; `@/shared/ui/Text`; `@/shared/utils/currencyUtils`; `./objectiveFormRules` (type)                                                                                                                                                                                                                                                                                                                                        |
| `ObjectiveTypeSelector.tsx`      | componente                                         | `react`; `@/shared/ui/Text`; `./objectivePreset`; `@/shared/utils/cn`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `EmergencyReserveTile.tsx`       | componente (usado por `pension` via contract)      | `react`; `@phosphor-icons/react`; `@/shared/ui/{IconButton,Progress,Text,MetricValue,Tooltip}`; `@/shared/hooks/useOverflowProbe`; `@/shared/utils/{currencyUtils,cn}`                                                                                                                                                                                                                                                                                                 |
| `useObjectiveForm.ts`            | orquestrador de estado de form                     | `react`; `date-fns`; `./objectiveFormRules`                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `useEmergencyReserve.ts`         | orquestrador (fetch + derivação)                   | `react`; `./objectiveService`; `./objectivePreset`; `@/shared/utils/textUtils`                                                                                                                                                                                                                                                                                                                                                                                         |
| `objectiveService.ts`            | wrapper de API (único ponto de rede)               | `@/shared/utils/api/client`; `./objective.types`                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `objective.types.ts`             | tipos request/response                             | `./objectivePlanningMode`; `./objectivePreset`                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `objectivePlanningMode.ts`       | enum espelho do banco                              | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `objectivePreset.ts`             | enum espelho + labels + ordem + enum só-UI         | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `objectiveFilter.ts`             | enum de UI (`all/ongoing/completed`)               | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `objectiveCalculations.ts`       | núcleo — matemática (versão front)                 | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `objectiveCalculations.test.ts`  | teste                                              | `vitest`; `./objectiveCalculations`                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `objectiveFormRules.ts`          | núcleo — sanitize/validate/preview/validity        | `date-fns`; `@/shared/utils/dateUtils`; `./objectivePlanningMode`; `./objectivePreset` (type); `./objective.types` (type); `./objectiveCalculations`                                                                                                                                                                                                                                                                                                                   |
| `objectiveFormRules.test.ts`     | teste                                              | `vitest`; `./objectiveFormRules`                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `objectiveCreatePayload.ts`      | núcleo — form → payload; duplicata                 | `date-fns`; `@/shared/utils/dateUtils`; `./objective.types` (type); `./objectiveFormRules` (type); `./objectivePreset` (type)                                                                                                                                                                                                                                                                                                                                          |
| `objectiveCreatePayload.test.ts` | teste                                              | `vitest`; `./objective.types`; `./objectiveFormRules`; `./objectivePreset`; `./objectiveCreatePayload`                                                                                                                                                                                                                                                                                                                                                                 |
| `objectiveUpdatePayload.ts`      | núcleo — diff form → payload parcial               | `@/shared/utils/{dateUtils,currencyUtils}`; `./objectivePlanningMode`; `./objectivePreset`; `./objective.types` (type); `./objectiveFormRules` (type)                                                                                                                                                                                                                                                                                                                  |
| `objectiveUpdatePayload.test.ts` | teste                                              | `vitest`; …                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `assetSelectOptions.ts`          | núcleo — options do dropdown                       | `@/modules/crm/contract`; `./objective.types` (type)                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `assetSelectOptions.test.ts`     | teste                                              | `vitest`; …                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

**Hook orquestrador — `useObjectiveForm.ts`** (íntegra): estado no hook, regra no arquivo puro,
relógio resolvido na borda (`startOfDay(new Date())`) e passado como `today`:

```ts
import { useState } from "react";
import { startOfDay } from "date-fns";
import {
  type ObjectiveFormField,
  type ObjectiveFormValues,
  applyFieldError,
  sanitizeObjectiveField,
  validateObjectiveField,
} from "./objectiveFormRules";

export const useObjectiveForm = (
  initialValues: ObjectiveFormValues,
  requireFutureGoalDate: boolean,
) => {
  const [values, setValues] = useState<ObjectiveFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) =>
    setFieldErrors((previous) => applyFieldError(previous, field, null));

  const setError = (field: string, message: string) =>
    setFieldErrors((previous) => applyFieldError(previous, field, message));

  const setField = (field: ObjectiveFormField, raw: string) => {
    const sanitized = sanitizeObjectiveField(field, raw);
    if (sanitized !== null) setValues((previous) => ({ ...previous, [field]: sanitized }));
    clearError(field);
  };

  const messageFor = (field: ObjectiveFormField) =>
    validateObjectiveField(field, values[field], values, {
      requireFutureGoalDate,
      today: startOfDay(new Date()),
    });

  const validate = (field: ObjectiveFormField) =>
    setFieldErrors((previous) => applyFieldError(previous, field, messageFor(field)));

  const validateAll = (fields: readonly ObjectiveFormField[]) =>
    setFieldErrors((previous) =>
      fields.reduce((errors, field) => applyFieldError(errors, field, messageFor(field)), previous),
    );

  return {
    values,
    fieldErrors,
    setField,
    setError,
    clearError,
    validate,
    validateAll,
  };
};
```

**Núcleo — `objectiveCreatePayload.ts`** (íntegra) e seu teste (recorte):

```ts
import { format } from "date-fns";
import { ddmmyyyyToBackendFormat } from "@/shared/utils/dateUtils";
import type { Objective, ObjectiveResponse } from "./objective.types";
import type { ObjectiveFormValues, ObjectivePreview } from "./objectiveFormRules";
import type { ObjectivePreset } from "./objectivePreset";

interface CreateObjectiveInputs {
  values: ObjectiveFormValues;
  resolvedName: string;
  assetIds: string[];
  selectedPreset: ObjectivePreset | null;
  isByContribution: boolean;
  preview: ObjectivePreview;
}

export const buildCreateObjectivePayload = ({
  values,
  resolvedName,
  assetIds,
  selectedPreset,
  isByContribution,
  preview,
}: CreateObjectiveInputs): Objective => ({
  name: resolvedName,
  assetIds,
  value: Number(values.value) / 100,
  rentability: Number(values.rentability),
  accumulated: Number(values.accumulated || "0") / 100,
  goalDate:
    isByContribution && preview.computedGoalDate
      ? format(preview.computedGoalDate, "dd-MM-yyyy")
      : ddmmyyyyToBackendFormat(values.goalDate),
  initialDate: ddmmyyyyToBackendFormat(values.initialDate),
  ...(selectedPreset ? { preset: selectedPreset } : {}),
  ...(isByContribution && preview.monthlyContribution != null
    ? { monthlyContribution: preview.monthlyContribution }
    : {}),
});

export const isDuplicateObjective = (
  existing: readonly ObjectiveResponse[],
  payload: Objective,
): boolean =>
  existing.some(
    (objective) =>
      objective.name === payload.name &&
      objective.value === payload.value &&
      objective.rentability === payload.rentability &&
      objective.accumulated === payload.accumulated &&
      objective.goalDate === payload.goalDate &&
      objective.initialDate === payload.initialDate,
  );
```

```ts
// objectiveCreatePayload.test.ts (recorte) — fixtures são funções locais com overrides
const values = (overrides: Partial<ObjectiveFormValues> = {}): ObjectiveFormValues => ({
  name: "Casa",
  value: "120000",
  accumulated: "20000",
  initialDate: "01/01/2026",
  goalDate: "01/01/2027",
  rentability: "8",
  monthlyContribution: "",
  ...overrides,
});

describe("buildCreateObjectivePayload", () => {
  it("converts the cents fields to reais and the dates to the backend format", () => {
    expect(buildCreateObjectivePayload(inputs)).toEqual({
      name: "Casa",
      assetIds: ["a1"],
      value: 1200,
      rentability: 8,
      accumulated: 200,
      goalDate: "01-01-2027",
      initialDate: "01-01-2026",
    });
  });
  // …
});
```

**Página — `Objectives.tsx`** (recorte da parte de orquestração; JSX omitido):

```ts
const Objectives: React.FC = () => {
  const { showSuccess, showError } = useSnackbar();
  const [showModal, setShowModal] = useState(false);
  const [objectives, setObjectives] = useState<ObjectiveResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ObjectiveFilter>(
    ObjectiveFilter.ALL,
  );

  const fetchObjectives = useCallback(async () => {
    try {
      const data = await objectiveService.getObjectives();
      setObjectives(data);
    } catch {
      showError('Erro ao carregar objetivos');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchObjectives();
  }, [fetchObjectives]);
  // …
  return (
    <>
      <PageContainer>
        {/* MetricTile / ListToolbar / FilterControl<ObjectiveFilter> / ObjectiveCard … */}
      </PageContainer>
      {showModal && <CreateObjectiveModal … />}
    </>
  );
};

export default Objectives;
```

**Composition root do front — `main.tsx`** (íntegra): registra o adaptador de auth no port
**antes** do render (o `client.ts` do shared lê o token pelo port, sem conhecer `auth`):

```tsx
import * as React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { BrowserRouter } from "react-router-dom";
import {
  getAccessToken,
  resumeImpersonatedSession,
  setAccessToken,
  setSessionResumeCapture,
} from "@/modules/auth/contract";
import { captureImpersonationResume } from "@/modules/consultant/contract";
import { setAuthPort } from "@/shared/utils/api/authPort";
import "@/shared/styles/global.css";

setAuthPort({
  getToken: getAccessToken,
  setToken: setAccessToken,
  resumeImpersonatedSession,
});
setSessionResumeCapture(captureImpersonationResume);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
```

`FE: src/shared/utils/api/authPort.ts` (íntegra — o port que mantém `shared` sem conhecer `auth`):

```ts
export type ImpersonationResume =
  { status: "not-impersonating" } | { status: "resumed"; token: string } | { status: "failed" };

export interface AuthPort {
  getToken(): string | null;
  setToken(token: string): void;
  resumeImpersonatedSession(): Promise<ImpersonationResume>;
}

let authPort: AuthPort | null = null;

export const setAuthPort = (port: AuthPort): void => {
  authPort = port;
};

export const getAuthPort = (): AuthPort | null => authPort;
```

---

## 6. Convenções que sustentam a arquitetura

### 6.1 Nomenclatura (CLAUDE.md "Types & Models" + observado)

| Coisa                                | Regra                                                                                                                                                                      | Exemplo real                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Pasta de módulo                      | `camelCase`, singular, inglês, termo de negócio; mesmo nome nos dois repos quando o conceito existe nos dois                                                               | `objective`, `categorizationRule`, `transactionSync`     |
| Arquivo que exporta componente React | `PascalCase.tsx` com o nome do componente                                                                                                                                  | `Objectives.tsx`, `ObjectiveCard.tsx`                    |
| Qualquer outro arquivo               | `camelCase.ts` (inclusive `.tsx` que exporta coleção/colunas)                                                                                                              | `objectiveFormRules.ts`, `clientsSpreadsheetColumns.tsx` |
| Backend                              | sempre `camelCase`                                                                                                                                                         | `objectiveService.ts`                                    |
| Kebab-case                           | **proibido** no código próprio; só onde a ferramenta fixa o nome (`.d.ts` de pacote, `vite-env.d.ts`, `entry-prerender.tsx`)                                               | `qpdf-wasm.d.ts`, `recharts-scale.d.ts`                  |
| Tipos exportados                     | `camelCase.types.ts`                                                                                                                                                       | `objective.types.ts`                                     |
| Schema Zod                           | `camelCaseSchema.ts`                                                                                                                                                       | `objectiveSchema.ts`, `loginSchema.ts`                   |
| Enum                                 | arquivo próprio com o nome do enum em camelCase                                                                                                                            | `objectivePreset.ts` → `enum ObjectivePreset`            |
| Sufixos de papel (BE)                | `*Router.ts`, `*Controller.ts`, `*Service.ts`, `*Schema.ts`, `*Middleware.ts`; núcleo: `*Calculations`, `*Guard`, `*Resolver`, `*Builder`, `*Parser`, `*Plan`, `*Matchers` | `installmentLineGuard.ts`, `goalPeriodRule.ts`           |
| Sufixos de papel (FE)                | `use*.ts` hooks, `*Service.ts` wrapper de API, `*Rules/*Payload/*Calculations.ts` núcleo                                                                                   | `useEmergencyReserve.ts`, `objectiveUpdatePayload.ts`    |
| Teste                                | `foo.test.ts(x)` colado ao `foo.ts`                                                                                                                                        | —                                                        |
| Router externo                       | `external<X>Router.ts` + `external<X>Controller.ts`, factory `createExternal<X>Router`                                                                                     | `externalObjectiveRouter.ts`                             |
| Factory de router                    | `create<X>Router()`                                                                                                                                                        | `createObjectiveRouter`                                  |
| Identificadores                      | inglês; acento é **erro** (`no-restricted-syntax`). Strings de UI e chaves de dados podem ser PT                                                                           | —                                                        |
| Fire-and-forget                      | prefixo `try*` = nunca lança                                                                                                                                               | `CrmService.tryNotifyRetirementObjectiveCreated`         |

Enforced: sufixos `*Router.ts`, `*Service.ts`, `*.test.ts` são usados **pelos globs do
`eslint.config.mjs`** (ex.: `dependenciesOnlyInService` some em `*Service.ts`;
`max-lines-per-function` é desligado em `*Router.ts` e `*.test.ts`). O resto é convenção.

### 6.2 Path aliases

Um único alias, `@/*` → `src/*`, nos dois repos:

- `BE: tsconfig.json` → `"paths": { "@/*": ["./src/*"] }`; runtime via `tsc-alias` no build,
  `ts-node -r tsconfig-paths/register` no dev/scripts, `vite-tsconfig-paths` no vitest.
- `FE: tsconfig.json` idem + `vite.config.ts` `resolve.alias['@']`.

**O que o alias pode alcançar é restringido pelo lint, não pelo tsconfig:**

| Import                                                                                 | Permitido de onde                                                    |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `@/modules/<x>/contract`                                                               | qualquer lugar fora de `shared/`                                     |
| `@/modules/<x>/<outro>`                                                                | **nunca** (`moduleExposesOnlyContract`, `insideModuleIsRelative`)    |
| `@/shared/**`                                                                          | qualquer lugar                                                       |
| `@/shared/dependencies/*` (BE)                                                         | só `*Service.ts` dentro de módulo                                    |
| `./x` relativo                                                                         | só dentro do mesmo módulo                                            |
| `../x` relativo                                                                        | proibido no BE (`MAX_MODULE_DEPTH=0`); no FE só até a raiz do módulo |
| `@/assets`, `@/components`, `@/styles`, `@/types` (FE) / `**/controllers/**` etc. (BE) | nunca (`extinct`)                                                    |

### 6.3 Server-only e como é garantido

Aqui são **dois repositórios separados** — a garantia de "server-only" é física: código do
backend não é alcançável pelo bundle do front. Dentro do backend, o "só-orquestrador":

- `@/shared/dependencies/*` (Prisma, Anthropic, WebSocket) só importável por `*Service.ts` —
  **enforced** (`dependenciesOnlyInService`).
- Env (`process.env`) lido em bootstrap (`validateAuthEnv` em `index.ts`, `requireEnv` em
  `shared/utils/envUtils.ts`) ou dentro da função; nunca capturado em `static readonly` —
  convenção + item explícito do REVIEW.md (há violação real, ver Apêndice).
- Front: `import.meta.env` só em `shared/utils/api/client.ts` (camada de API-client), regra
  "Nothing happens at import time" — convenção.

**Para o alvo TanStack Start (um só repo):** replicar `dependenciesOnlyInService` é o mínimo, e
adicionar um padrão equivalente barrando `@/shared/dependencies/*` e `@prisma/client` em qualquer
arquivo que não seja `*Service.ts`/server function — o `no-restricted-imports` já faz isso com
mais um `group`.

### 6.4 Regras de exportação

- **Named exports** por padrão em tudo que é lógica, service, hook, tipo, enum.
- **Default export** só em componente React (`export default Objectives`), e o `contract.ts`
  re-exporta como named: `export { default as Objectives } from './Objectives';`. Componentes do
  DS: _"Export: default + named + types"_ (CLAUDE.md).
- Router: `export const createXRouter = (): Router => …` (named, factory).
- Service backend: `export class XService { public static async … }` — classe estática
  (convenção da casa; `WebSocketService` é o único singleton com `getInstance()`).
- Tipos exportados **nunca** dentro de service/controller/componente — arquivo `.types.ts`.
  Interfaces não exportadas de uso único podem ficar locais; `Props` de componente fica no `.tsx`.
- Helpers puros com regra de negócio **devem ser exportados** (para o teste alcançar).
- `contract.ts`: só `export … from`; `export type { }` para tipos.
- Sem `export *` em lugar nenhum (nem no contract).

### 6.5 Constantes de negócio, formatação/i18n, config de ambiente

- **Constantes de negócio:** no módulo dono, arquivo próprio ou junto do núcleo:
  `objectivePresets.ts` (`OBJECTIVE_PRESET_NAMES`, `NEXT_RETIREMENT_MEETING`),
  `MAX_PROJECTION_MONTHS` em `objectiveCalculations.ts`, `RECONCILIATION_LIMITS` publicado pelo
  `statement/contract.ts`, `DEFAULT_JSON_BODY_LIMIT` em `shared/middlewares/jsonMiddleware.ts`.
  Limites de arquivo são "medidos, não chutados" (CLAUDE.md File Input).
- **Formatação / i18n:** não há lib de i18n; o produto é PT-BR fixo. Formatadores sem domínio em
  `FE: shared/utils/currencyUtils.ts`, `dateUtils.ts`, `textUtils.ts`; labels de enum no módulo
  dono (`OBJECTIVE_PRESET_NAMES`, `INVESTMENT_ASSET_CATEGORY_LABELS`). Mensagens de erro do
  servidor já vêm em PT no `MappedException`.
- **Design tokens:** `FE: src/shared/styles/global.css` em `@theme` (Tailwind v4) — `--color-arko-*`,
  `--font-arko-*`, etc.; hex inline proibido em código novo (convenção + review, sem regra ESLint).
- **Config de ambiente:** `.env` + `.env.example` na raiz de cada repo; backend valida na
  subida (`validateAuthEnv([...ACCESS_KEY_ENV_VARS, 'REFRESH_PRIVATE_KEY', 'EXTERNAL_API_KEY'])`
  em `index.ts`), `ACCESS_KEY_ENV_VARS` é publicado pelo `auth/contract.ts`. Front: `VITE_API_URL`
  lido em `shared/utils/api/client.ts`.

---

## 7. Tooling — configs

### 7.1 `arko_frontend/eslint.config.mjs` (íntegra)

```js
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import reactHooks from "eslint-plugin-react-hooks";

const EXTINCT_PATHS = ["@/assets/**", "@/components/**", "@/styles/**", "@/types/**"];

const extinct = {
  group: EXTINCT_PATHS,
  message: "Estrutura pre-migracao. O codigo vive em @/modules/<dominio>/ ou @/shared/.",
};

const sharedKnowsNoDomain = {
  regex: "(^|/)modules/",
  message: "shared/ nao conhece dominio. Inverta a dependencia ou mova o arquivo para o modulo.",
};

const MAX_MODULE_DEPTH = 3;

const moduleExposesOnlyContract = {
  regex: "(^|/)modules/(?!\\w+/contract$)",
  message:
    "Modulo so expoe o contract.ts. Importe de @/modules/<dominio>/contract ou acrescente a linha la.",
};

const insideModuleIsRelative = {
  regex: "^@/modules/(?!\\w+/contract$)",
  message:
    "Dentro do modulo o import e relativo (./arquivo). De outro modulo, so @/modules/<dominio>/contract.",
};

const crossingUsesAlias = (depth) => ({
  regex: `^(\\.\\./){${depth + 1}}`,
  message:
    "Import relativo saiu do modulo. Atravessar fronteira e por alias: @/shared/... ou @/modules/<dominio>/contract.",
});

const restrictedImports = (patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

const englishIdentifiers = [
  "VariableDeclarator > Identifier.id",
  "FunctionDeclaration > Identifier.id",
  "ClassDeclaration > Identifier.id",
  "TSInterfaceDeclaration > Identifier.id",
  "TSTypeAliasDeclaration > Identifier.id",
  "TSEnumDeclaration > Identifier.id",
  ":function > Identifier.params",
].map((selector) => ({
  selector: `${selector}[name=/[\\u00C0-\\u024F]/]`,
  message:
    "Identificador com acento: variavel, parametro, funcao, classe, tipo ou enum vive em ingles. Chave de mapa de dados e string exibida ao usuario final podem ficar em portugues.",
}));

const staticImportsOnly = {
  selector: "ImportExpression",
  message:
    "Sem import dinamico nem React.lazy: cada deploy apaga os chunks antigos e a aba aberta fica em branco. Importe estatico (docs/decisions/2026-09-10-sem-lazy-loading.md).",
};

export default [
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      "vite.config.ts",
      ".dependency-cruiser.cjs",
      "coverage/",
    ],
  },
  { files: ["**/*.{js,mjs,cjs,ts,tsx,jsx}"] },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": ["error", { allow: ["error"] }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "prefer-const": "error",
      "no-var": "error",
      "no-duplicate-imports": ["error", { allowSeparateTypeImports: true }],
      "object-shorthand": ["error", "always"],
      "no-trailing-spaces": "error",
      "sort-imports": [
        "error",
        {
          ignoreDeclarationSort: true,
          memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
        },
      ],
      "max-lines-per-function": [
        "warn",
        { max: 50, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      "max-params": ["warn", 5],
      "max-depth": ["warn", 4],
      "no-restricted-syntax": ["error", ...englishIdentifiers],
      "max-lines": ["error", { max: 600, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ["**/*.tsx"],
    rules: {
      "max-lines-per-function": [
        "warn",
        { max: 150, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
    },
  },
  {
    // Um `describe` longo e suite, nao funcao: cada `it` ja e uma unidade isolada.
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: { "max-lines-per-function": "off" },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "no-restricted-syntax": ["error", ...englishIdentifiers, staticImportsOnly],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: restrictedImports([extinct, moduleExposesOnlyContract]),
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: restrictedImports([extinct, sharedKnowsNoDomain]),
  },
  ...Array.from({ length: MAX_MODULE_DEPTH + 1 }, (_, depth) => ({
    files: [`src/modules/*/${"*/".repeat(depth)}*.{ts,tsx}`],
    rules: restrictedImports([extinct, insideModuleIsRelative, crossingUsesAlias(depth)]),
  })),
];
```

Diferença relevante FE vs BE: no bloco por módulo do FE **não** está `moduleExposesOnlyContract`
(está só no bloco base `src/**`) — funciona porque no flat config as regras do bloco mais
específico substituem a regra inteira; como o bloco base e o bloco por módulo definem
`no-restricted-imports`, **o do módulo vence e o `moduleExposesOnlyContract` some para arquivos
de módulo no front**. Na prática o `insideModuleIsRelative` (`^@/modules/(?!\w+/contract$)`)
cobre o alias, mas um import relativo `../outroModulo/arquivo` de dentro de um módulo passa só
pelo `crossingUsesAlias`. O CLAUDE.md do backend registra exatamente essa armadilha e por isso o
backend repete o padrão no bloco por módulo. (Apêndice, item A6.)

### 7.2 `arko_backend/eslint.config.mjs`

Íntegra em §3.2.

### 7.3 tsconfigs

`BE: tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "rootDir": ".",
    "outDir": "./dist",
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "ts-node": {
    "files": true
  },
  "include": ["src/**/*", "scripts/**/*"],
  "exclude": ["node_modules"]
}
```

`BE: tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src"
  },
  "exclude": ["node_modules", "scripts", "src/**/*.test.ts"]
}
```

`FE: tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

`FE: tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["vite.config.ts"]
}
```

Sem TS project references entre módulos; sem `paths` restritivos — a restrição é toda no ESLint.

### 7.4 dependency-cruiser

`BE: .dependency-cruiser.cjs` — íntegra em §3.2. `FE: .dependency-cruiser.cjs`:

```js
/**
 * Opções de resolução do grafo de imports para o `check:cycles` (`scripts/checkCycles.ts`).
 * O dependency-cruiser só monta o grafo; quem mede e trava é o script — arquivos dentro de
 * componente cíclica (Tarjan), com cap no `ci.yml` que só desce, igual ao `--max-warnings`.
 * Sem regra `no-circular` aqui de propósito: a baseline nativa casa ciclo pelo caminho e
 * re-roteia a cada mudança no miolo, acusando ciclo "novo" que é velho.
 * Ver docs/decisions/2026-08-28-ciclos-ratchet-por-scc.md.
 *
 * Config idêntica nos frontends (a dos backends difere só em tsconfig e extensões). Copie,
 * não reescreva.
 */
module.exports = {
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "\\.test\\.tsx?$" },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "browser", "default"],
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
  },
};
```

### 7.5 Scripts do `package.json`

`BE: package.json` (recorte `scripts` + devDependencies relevantes):

```json
{
  "engines": { "node": "22.12.0" },
  "scripts": {
    "build": "tsc -p tsconfig.build.json && tsc-alias -p tsconfig.build.json",
    "start": "node dist/index.js",
    "dev": "cross-env TZ=UTC ts-node -r dotenv/config -r tsconfig-paths/register src/index.ts",
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --coverage",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "check:cycles": "ts-node -r tsconfig-paths/register scripts/checkCycles.ts"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "@vitest/coverage-v8": "^4.1.11",
    "dependency-cruiser": "^18.2.0",
    "eslint": "^9.17.0",
    "eslint-plugin-unused-imports": "^4.4.1",
    "globals": "^15.14.0",
    "prettier": "^3.9.6",
    "ts-node": "^10.9.2",
    "tsc-alias": "^1.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.2",
    "typescript-eslint": "^8.18.1",
    "vite-tsconfig-paths": "^6.1.1",
    "vitest": "^4.1.11"
  }
}
```

`FE: package.json` (recorte):

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && vite build --ssr src/entry-prerender.tsx --outDir dist/ssr && node scripts/prerender.mjs",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --coverage",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "check:cycles": "tsx scripts/checkCycles.ts"
  },
  "devDependencies": {
    "@eslint/js": "^9.35.0",
    "@vitejs/plugin-react": "^5.1.1",
    "@vitest/coverage-v8": "^4.1.11",
    "dependency-cruiser": "^18.2.0",
    "eslint": "^9.35.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-unused-imports": "^4.4.1",
    "globals": "^15.12.0",
    "prettier": "^3.9.6",
    "tailwindcss": "^4.1.11",
    "tsx": "^4.23.12",
    "typescript-eslint": "^8.43.0",
    "vite": "^7.3.1",
    "vitest": "^4.1.11"
  }
}
```

### 7.6 Vitest / Vite

`BE: vitest.config.ts`:

```ts
import { defaultExclude, defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    exclude: [...defaultExclude, "**/dist/**"],
    coverage: {
      include: ["src/**/*.ts"],
      reporter: ["text-summary"],
      thresholds: {
        autoUpdate: false,
        statements: 3,
        branches: 3,
        functions: 5,
        lines: 2,
      },
    },
  },
});
```

`FE: vite.config.ts` (o CI usa **este** para testes; um `vitest.config.ts` local com jsdom
existe mas está fora do git via `.git/info/exclude`):

```ts
import { defaultExclude, defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    exclude: [...defaultExclude, "**/dist/**"],
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text-summary"],
      thresholds: {
        autoUpdate: false,
        statements: 2,
        branches: 1,
        functions: 2,
        lines: 2,
      },
    },
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-router")) return "router";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("framer-motion")) return "framer";
          if (id.includes("@phosphor-icons")) return "icons";
          if (id.includes("xlsx-populate") || id.includes("html2canvas")) return "xlsx";
          if (id.includes("socket.io")) return "socket";
          if (id.includes("emoji-picker")) return "emoji";
          if (id.includes("date-fns")) return "date";
          if (id.includes("axios") || id.includes("jwt-decode")) return "utils";
          return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});
```

### 7.7 Prettier (idêntico nos dois)

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "arrowParens": "avoid",
  "printWidth": 80,
  "tabWidth": 2
}
```

`.prettierignore`: `node_modules`, `dist`, `build`, `coverage`, `package-lock.json` (+ `docs/pluggy` no BE).
O CI roda `prettier --check .` no repo inteiro (inclui `.md`).

### 7.8 CI

`ci.yml` do BE em §3.5; o do FE difere só em: sem passo "Generate Prisma Client",
`--max-warnings 58`, `--max-files 83`. `claude-review.yml` (gate de tamanho + review IA lendo
`REVIEW.md`), `pr-card-check.yml` (exige link de card Trello no corpo do PR) e
`trello-notify.yml` (comenta resultado no card) são iguais nos dois — o gate de tamanho:

```yaml
- name: PR size
  run: |
    count() {
      git diff origin/${{ github.base_ref }}...HEAD -- "$@" \
        | grep -E '^\+' | grep -vE '^\+\+\+ ' \
        | grep -cvE '^\+[][}{)(;,[:space:]]*$' || true
    }
    PROD=$(count . ':(exclude)package-lock.json' ':(exclude)**/migrations/**' ':(exclude,glob)**/*.test.ts')
    TEST=$(count ':(glob)**/*.test.ts')
    echo "Linhas adicionadas (ignorando vazias e só-pontuação) — produção: $PROD | testes: $TEST"
    if [ "$PROD" -gt 700 ]; then
      echo "::error::PR com $PROD linhas de produção (limite: 700). Quebre em PRs menores — o review por IA nem roda acima do limite."
      exit 1
    fi
    if [ "$TEST" -gt 1000 ]; then
      echo "::error::PR com $TEST linhas de teste (limite: 1000). Quebre em PRs menores."
      exit 1
    fi
```

### 7.9 Documentos de regra

Três arquivos, três perguntas (mesmo texto nos dois CLAUDE.md):

| Arquivo                               | Responde                              |
| ------------------------------------- | ------------------------------------- |
| `CLAUDE.md`                           | como escrever código neste repo       |
| `REVIEW.md`                           | o que checar num diff e o que ignorar |
| `.github/workflows/claude-review.yml` | como o resultado é publicado          |

Mais `docs/decisions/README.md`:

```markdown
# Decisões

Registro de decisões de negócio e técnicas deste backend. Uma nota curta por decisão.

- Um arquivo por decisão: `AAAA-MM-DD-titulo-curto.md`
- Campos: **Contexto**, **Decisão**, **Por quê**, **Alternativas descartadas**.
- Nunca reescreva uma decisão antiga para "corrigir" — crie uma nova que a substitui. O histórico é o valor.
```

Critério para registrar (CLAUDE.md "Decision Log"): só se **todas** valem — muda negócio /
arquitetura / dados / segurança; havia alternativa real rejeitada; o porquê não está claro no
código + commit; alguém reabriria em ~6 meses.

O `REVIEW.md` do backend, seção "Always check" (é a lista do que o lint **não** pega e portanto
o que o review humano/IA vigia):

```markdown
- Every new route registers an auth middleware (`authenticate*` from
  `@/modules/auth/contract`) — and the right one for the intended roles
- Prisma queries in client-facing controllers are scoped to
  `req.body.user.userId` — an unscoped query is a cross-user data leak (Important)
- Controllers under `/api/external/*` never access `req.body.user` (API-key auth
  only, no JWT)
- `CrmService` methods prefixed `try*` never throw — adding a `throw` to one is
  Important
- Migrations are generated by `prisma migrate dev` and contain DDL only — any
  `INSERT`/`UPDATE`/seed data in a migration is Important
- Logs don't include email addresses, tokens, or full request bodies
- Calculation logic that reads the clock (`new Date()`/`Date.now()`),
  `process.env`, or runs Prisma queries mid-computation — data and `now` must
  arrive as parameters (CLAUDE.md **Testability**; no lint rule catches these)
- Side effects (mail/Slack/websocket/notifications) fired from inside a computing
  function, or their errors swallowed by an empty `catch`
- Env captured into `static readonly`/module-level constants, or clients
  (SMTP/SDK) built at import time
- New module-level mutable state (cache, counter, memoized singleton) — leaks
  between tests and requests
- Enum exists but code compares against the raw string literal — flag it; there is
  no lint rule for this, review is the backstop
- A business-rule helper left as a closure or unexported — unreachable for tests
- A new pure/logic function (calculation, rule, parser, validator) without a
  colocated `.test.ts` in the same PR (CLAUDE.md **Testability**, born tested)
```

E as 10 regras de "Testability" do CLAUDE.md do backend (íntegra da lista, sem o preâmbulo):

```markdown
1. **Warning ratchet** — never introduce a new lint warning: every change must leave the warning count equal or lower. CI enforces this with a `--max-warnings` cap in `ci.yml`; when your change reduces warnings, lower the cap in the same PR. The same ratchet applies to test coverage: minimum thresholds live in `vitest.config.ts` (`autoUpdate: false` since 2026-08-26) and `npm test` fails if coverage drops below them — never lower a threshold to make a change pass; write the missing tests instead. Never write a new function above 80 lines. When editing a legacy function that exceeds a limit, extract the part you are touching into a smaller function instead of growing it — and the extracted function gets a unit test (boy-scout rule: leave what you touched better than you found it; never mass-refactor code the PR doesn't touch).
2. **Functional core, imperative shell** — a function that computes or decides must not call Prisma, `fetch`, or an LLM. Pattern: orchestrator fetches → pure function computes → orchestrator persists. Business math lives in pure functions, never inline between queries. Testing strategy follows the split: many fast unit tests on the core, few integration tests on the shell.
3. **Dependencies enter as parameters (DIP)** — everything a computing function needs — data, clock (`now`), random, fetchers/clients — arrives through its signature, never reached from inside via singleton, module import, or global. The static-class service convention stays, but a static method that computes gets its collaborators as arguments (references in this repo: `CategorizationRuleService.applyRules({ preloadedRules })`, `resolvePlan(now)`). `new Date()` / `Date.now()` inside calculation/rule logic is the canonical violation: take `now` as a parameter (reference implementation: `src/modules/objective/objectiveCalculations.ts`); reading the clock is allowed only at the orchestration edge (controller, cron entry).
4. **Nothing happens at import time** — no env capture into `static readonly` fields or module-level constants, no client construction (SMTP/HTTP/SDK), no I/O at module load. Read env and build clients in config/bootstrap files or lazily at call time; import-time work freezes values and tests cannot override them.
5. **No hidden mutable module state** — module-level caches, counters, and memoized singletons leak state between tests and between requests. Keep state at the shell, pass it in as a parameter, or expose a reset for tests.
6. **Side effects outside calculations** — email/Slack/websocket/notifications are never called from inside a function that computes; they belong to the orchestrator, after the calculation. Never swallow their errors with an empty `catch`.
7. **One responsibility per function (SRP)** — if describing what a function does requires "and" (fetches AND computes AND notifies), it is several functions. Extract until the description has no "and".
8. **Pure helpers must be reachable** — a helper that carries a business rule must be exported (or live in `utils/`), never a closure inside a method or an unexported module function.
9. **Mocking is a smell of shape** — if testing a unit requires mocking more than one collaborator, the unit is wrongly shaped: extract the pure part instead of building mock scaffolding.
10. **Born tested** — every new pure/logic function (calculation, business rule, parser, validator) ships with a colocated Vitest test in the same PR: `foo.test.ts` next to `foo.ts`, run with `npm test`. Orchestrators (controllers, crons, hooks, services that only fetch/persist) don't require unit tests — a unit test of pure delegation asserts nothing. That is **not** the same as "they don't need testing": what covers them is an integration test (route + auth + serialization), which this repo does not have yet. Until it does, an orchestrator carrying a decision is a bug waiting at the boundary — extract the decision into pure core so at least the rule is covered.
```

Ordem de rollout ao ligar as regras num repo (CLAUDE.md): `git mv` dos arquivos de domínio para
fora de `shared/` → escrever os `contract.ts` → reescrever imports → **só então** ligar o lint,
já verde.

---

## 8. Anti-padrões proibidos

| Anti-padrão                                                                                | Motivo (do CLAUDE.md / decisões)                                                                                     | Enforced?                                                                                        |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Pasta por camada na raiz (`controllers/`, `services/`, `components/`, `hooks/`, `utils/`)  | "the folder is the business domain, the layer is the file"; camada por pasta espalha uma feature por N pastas        | sim (`extinct`)                                                                                  |
| Importar arquivo interno de outro módulo                                                   | mata o refactor local; "if the deep path still compiles, someone imports it that way on a Friday"                    | sim (`moduleExposesOnlyContract`, `insideModuleIsRelative`)                                      |
| Import relativo cruzando módulo (`../outro/x`)                                             | a travessia precisa ser visível na linha de import (alias)                                                           | sim (`crossingUsesAlias`)                                                                        |
| `shared/` importar `modules/`                                                              | inverte o kernel; shared vira depósito de domínio                                                                    | sim (`sharedKnowsNoDomain`)                                                                      |
| Tipo/regra de domínio em `shared/` "porque dois módulos usam"                              | _shared folder anti-pattern_ — decisão 2026-08-27; dono publica pelo contract                                        | não (review)                                                                                     |
| `index.ts` barrel / `export *`                                                             | fonte de ciclo e esconde a fronteira; só `contract.ts`, lista manual                                                 | não (review)                                                                                     |
| `contract.ts` exportando "por via das dúvidas"                                             | vira barrel; só o que tem consumidor hoje                                                                            | não (review)                                                                                     |
| Router construído no top-level (`export const router = Router()`)                          | trabalho em tempo de import + ciclo CommonJS = handler `undefined`, boot morre com `Route.get() requires a callback` | não (convenção; guard `check:module-load-order` no crm)                                          |
| Router montando handler/schema de outro módulo                                             | mesmo problema; "the mount moves, not the handler"                                                                   | não                                                                                              |
| Prisma / fetch / SDK fora de `*Service.ts`                                                 | "I/O only in the orchestrator"                                                                                       | sim para `shared/dependencies` (`dependenciesOnlyInService`); fetch/SDK importado direto: review |
| UI (componente/página) chamando o api client                                               | I/O é do hook                                                                                                        | não (review)                                                                                     |
| Regra de negócio dentro de componente/hook/controller                                      | "functional core, imperative shell"; fica intestável                                                                 | não (review)                                                                                     |
| `new Date()`, `process.env`, `localStorage`, `getComputedStyle` dentro de cálculo          | DIP — chega por parâmetro (`now`, `today`)                                                                           | não (review)                                                                                     |
| Env capturado em `static readonly` / constante de módulo; cliente SDK construído no import | congela valores, teste não sobrescreve                                                                               | não (review)                                                                                     |
| Subpasta dentro de módulo (`client/spreadsheet/`)                                          | terceiro nível + "quem é a porta pública?"; split = módulo irmão                                                     | sim no BE (`MAX_MODULE_DEPTH=0`), até 3 no FE                                                    |
| Módulo nomeado por entidade central (`client`) ou por audiência (`admin`, `external`)      | vira ímã; audiência não é domínio — arquivo vai pro domínio real                                                     | não                                                                                              |
| Mover arquivo + mudar lógica no mesmo PR                                                   | perde o sinal de regressão                                                                                           | não                                                                                              |
| Redeclarar enum do Prisma no backend                                                       | fonte única é `@prisma/client`                                                                                       | não                                                                                              |
| String literal onde já existe enum / union inline para valor de domínio                    | magic string; `tsc` só pega se a assinatura usa o enum                                                               | não (review)                                                                                     |
| `any`                                                                                      | `unknown` + type guard                                                                                               | parcial (tseslint recommended: `no-explicit-any`)                                                |
| Comentários (inclusive JSDoc, TODO)                                                        | nome melhor ou `docs/decisions/`; só comentários que ferramenta lê                                                   | não                                                                                              |
| `console.log`/`warn`                                                                       | —                                                                                                                    | sim (`no-console` allow error)                                                                   |
| Identificador com acento / em português                                                    | log em inglês, identificadores em inglês; strings de UI em PT                                                        | sim (`no-restricted-syntax`)                                                                     |
| `React.lazy` / `import()` dinâmico                                                         | deploy apaga chunks antigos → tela branca; decisão 2026-09-10                                                        | sim (`staticImportsOnly`)                                                                        |
| Migration escrita à mão / com dados                                                        | só `prisma migrate dev`, só DDL                                                                                      | não (review, "Important")                                                                        |
| Rota sem `authenticate*`; query Prisma sem `userId` do JWT                                 | vazamento entre usuários                                                                                             | não (review, "Important")                                                                        |
| Baixar um cap de ratchet para passar (warnings, ciclos, coverage)                          | "the CI ceiling only ever goes down"                                                                                 | social/PR review                                                                                 |
| `throw` em método `try*`                                                                   | fire-and-forget é intencional                                                                                        | não (review)                                                                                     |
| Hex inline / ícone que não seja Phosphor / widget de um módulo em `shared/ui`              | DS; tokens em `@theme`                                                                                               | não (review)                                                                                     |
| Token de acesso em `localStorage`/`sessionStorage`                                         | XSS; decisão 2026-08-30 — memória + cookie httpOnly                                                                  | não (review, "Important")                                                                        |

---

## 9. Específico desta stack vs. transferível

### 9.1 Essência — manter em qualquer stack (TanStack Start incluso)

1. **Pasta = domínio; camada = arquivo.** `src/modules/<domínio>/` plano + `src/shared/` kernel
   sem domínio + um composition root. Nada mais na raiz.
2. **Uma porta pública por módulo, lista manual (`contract.ts`), sem barrels.** Enforced por
   `no-restricted-imports` com os mesmos 4 padrões (`moduleExposesOnlyContract`,
   `insideModuleIsRelative`, `crossingUsesAlias`, `sharedKnowsNoDomain`) + `extinct` para as
   pastas que você decidir não ter. A config é copiável quase literalmente — só ajustar
   `MAX_MODULE_DEPTH`, `EXTINCT_*` e extensões.
3. **Dentro do módulo: relativo; cruzando: alias.** Torna a fronteira legível no import.
4. **Ratchet de ciclos por arquivos-em-SCC**, não por baseline de caminhos. `checkCycles.ts` +
   `cyclicFiles.ts` são agnósticos (só precisam de um grafo `Map<string,string[]>`); o
   `.dependency-cruiser.cjs` serve para Vite/TanStack sem mudança além de `conditionNames`.
5. **Ciclo resolvido por inversão de dependência (porta declarada pelo consumidor + injeção no
   composition root)**, não por subir para shared.
6. **Entrada → orquestrador → núcleo puro**, com `now`/env/dados por parâmetro e teste colado
   (`foo.test.ts`) nascendo junto. Núcleo é o que "viaja para o mobile sem mudar".
7. **I/O só no orquestrador**; SDKs/DB só importáveis de arquivos com sufixo de orquestrador
   (`dependenciesOnlyInService` — generalizar o glob para a sua convenção de nome).
8. **Enum de domínio no módulo dono, em arquivo próprio; espelho tipado na UI quando a UI não vê
   o ORM.** Sem literais soltos.
9. **Três ratchets no CI que só descem** (warnings, arquivos em ciclo, coverage) + gate de tamanho
   de PR. Sem pre-commit: a barreira é o PR.
10. **`CLAUDE.md` (como escrever) / `REVIEW.md` (o que o review checa, e explicitamente "não
    reporte o que o CI já pega") / `docs/decisions/` (ADR curta, datada, nunca reescrita).**
11. Regras de nome: `camelCase` para tudo, `PascalCase` só para componente, sufixo de papel,
    zero kebab próprio, identificadores em inglês (enforced por seletor de acento).

### 9.2 Específico daqui — adaptar, não copiar

| Item                                                                     | Por que é local                                                                    | No alvo (TanStack Start SSR + Prisma)                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dois repos (front/back) com tipos duplicados à mão                       | "server-only" garantido pela separação física; contrato HTTP sem lib compartilhada | Um repo: o **mesmo módulo** hospeda `x.types.ts`, `xSchema.ts` (Zod), a server function (`*Service.ts`) e a UI. O tipo de resposta pode ser `z.infer`/retorno da server fn — some a duplicação `Objective`/`ObjectiveResponse`. Ganha-se também um risco novo: UI importar Prisma — barrar com `no-restricted-imports` (`@prisma/client`, `@/shared/dependencies/*`) fora de `*Service.ts`/`*.server.ts`. |
| `createXRouter()` factories + `index.ts` montando por prefixo            | Express + CommonJS (ciclo dá `undefined`)                                          | File-based routing do TanStack Start: a "rota" vira arquivo em `routes/`. Manter o princípio: **arquivo de rota só monta**, importa do contract; loaders/server functions chamam `*Service.ts`. O `check:module-load-order` deixa de fazer sentido em ESM (ciclo dá TDZ error, não `undefined`), mas o ratchet de ciclos continua.                                                                        |
| Classes estáticas `XService`                                             | convenção da casa, herdada                                                         | Funções exportadas ou `createServerFn` no mesmo arquivo `*Service.ts`; manter o sufixo porque o lint depende dele.                                                                                                                                                                                                                                                                                        |
| `req.body.user` como payload JWT; `authenticate*` middlewares            | Express                                                                            | Middleware de server function / `beforeLoad`; publicar pelo `auth/contract.ts` do mesmo jeito.                                                                                                                                                                                                                                                                                                            |
| `validateForm(schema)` middleware Zod                                    | Express                                                                            | `createServerFn().validator(schema)` — o schema continua em `xSchema.ts` no módulo.                                                                                                                                                                                                                                                                                                                       |
| `MappedException` + try/catch por controller                             | HTTP status manual                                                                 | Erro tipado retornado/lançado pela server fn; manter a classe em `shared/models`.                                                                                                                                                                                                                                                                                                                         |
| `MAX_MODULE_DEPTH = 0` no BE / `3` no FE                                 | dívida histórica do front (`landing/constants/`)                                   | Começar em 0 (plano). Subir só se surgir necessidade real.                                                                                                                                                                                                                                                                                                                                                |
| Axios + interceptors + `authPort`                                        | SPA com token em memória e refresh cookie                                          | SSR: sessão via cookie no servidor; o port some ou vira um `auth/contract` consumido pelo fetch do lado do cliente.                                                                                                                                                                                                                                                                                       |
| `no-lazy-loading` (`staticImportsOnly`)                                  | Vercel SPA + deploys frequentes + aba aberta o dia todo                            | Em SSR com route-splitting do framework o cenário muda; reavaliar antes de copiar a regra.                                                                                                                                                                                                                                                                                                                |
| Tailwind `@theme` tokens `arko-*`, Phosphor, DS plano em `shared/ui`     | design system da empresa                                                           | O princípio transferível é "DS em `shared/ui`, plano, widget de domínio fica no módulo".                                                                                                                                                                                                                                                                                                                  |
| `ts-node` + `tsc-alias` + `tsconfig-paths`; `tsx` no front               | CommonJS no backend                                                                | Vite resolve `@/*` sozinho; `check:cycles` roda com `tsx`.                                                                                                                                                                                                                                                                                                                                                |
| Ratchets numéricos atuais (41/58 warnings, 7/83 arquivos, coverage 2–5%) | dívida do repo                                                                     | Começar com `--max-warnings 0`, `--max-files 0`, coverage real do dia 1 — e nunca subir.                                                                                                                                                                                                                                                                                                                  |
| Comunicação Arko ↔ CRM por API key, `try*`                               | integração entre dois produtos                                                     | Padrão transferível só se houver segundo sistema.                                                                                                                                                                                                                                                                                                                                                         |

---

## Apêndice — violações e discrepâncias encontradas no código (regra vs. intenção)

Listadas para calibrar o que é regra "de verdade" (enforced, sem exceção viva) e o que é
intenção documentada com exceções toleradas.

**A1. Comentários existem onde a regra diz "zero comentário".** `scripts/checkCycles.ts` (ambos),
`.dependency-cruiser.cjs` (ambos), `FE: eslint.config.mjs` (`// Um describe longo e suite…`),
`crm_backend/scripts/checkModuleLoadOrder.ts`. Todos em tooling, não em `src/`. A regra "No
comments" é convenção, não enforced, e na prática é aplicada em `src/`.

**A2. `contract.ts` exportando sem consumidor.** `BE: modules/objective/contract.ts` exporta
`ObjectiveService`, mas nenhum arquivo fora do módulo o importa (só `index.ts` usa as factories).
Viola "only what has a consumer today". Não há lint para isso.

**A3. Env capturado em `static readonly` em tempo de import.** `BE: src/modules/crm/crmService.ts`:

```ts
export class CrmService {
  private static readonly CRM_API_URL =
    process.env.CRM_API_URL || 'https://api.arkocrm.com';
  private static readonly EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;
```

Viola Testability #4 (item explícito do REVIEW.md). Código legado anterior à regra.

**A4. Union inline para valor de domínio.** `BE: src/modules/crm/crm.types.ts`:
`export type MaritalStatus = 'SINGLE' | 'MARRIED' | …`, `Gender`, `ClientType`,
`InvestmentAssetCategory`. A regra "Magic Strings & Enums" manda promover a enum. É contrato
espelhado de outro sistema (CRM), o que explica mas não isenta.

**A5. Regra de negócio dentro de componente.** `FE: src/modules/objective/Objectives.tsx` calcula
`counts` (em andamento/concluído) e `averageProgress` em `useMemo` dentro da página — o REVIEW.md
pede isso em arquivo puro (`dashboardObjectives.ts` do módulo `dashboard` faz exatamente essa
extração para o mesmo dado). Idem `useEmergencyReserve.ts` calculando `progress` no hook.

**A6. FE: `moduleExposesOnlyContract` não vale dentro de módulos.** No `FE: eslint.config.mjs` o
bloco `src/modules/*/…` redefine `no-restricted-imports` sem `moduleExposesOnlyContract` (o
backend inclui). Efeito: de dentro de um módulo, `import x from '../outro/arquivo'` passa só pelo
`crossingUsesAlias` (que pega porque `../` na raiz do módulo é `depth+1`), mas num arquivo em
subpasta (depth 1) `../../outro/arquivo` também é pego; o buraco real é só teórico com módulos
planos. Ainda assim é divergência entre os dois configs e com o texto do CLAUDE.md.

**A7. `consistent-type-imports` citado no CLAUDE.md do backend não está configurado** em nenhum
`eslint.config.mjs`. `import type` é convenção; há imports de tipo sem `type` (ex.:
`import { ObjectiveResponse } from './objective.types'` em `Objectives.tsx`,
`import { Pagination } from '../models/types/pagination.types'` em `buildPagination.ts`).

**A8. `check:module-load-order` citado no CLAUDE.md do backend não existe no arko_backend**
(`scripts/` tem só `checkCycles`, `cyclicFiles`, `auditBudgetCategoryLeaks`, `backfillAssets`).
Existe no `crm_backend` (colado em §3.2). O CLAUDE.md diz "Reference implementation: crm_backend
— copy it when turning the guard on in another repo": ainda não foi copiado.

**A9. Nomes de domínio em `shared/` (viola o espírito, não o lint).** `FE: shared/utils/budgetFormatters.ts`,
`shared/utils/investmentUtils.ts` (`getTypeLabel`, `getTransactionTypeLabel` com labels de
investimento), `shared/ui/SwitchClientConfirmModal.tsx`. Nenhum importa `modules/`, então o
`sharedKnowsNoDomain` passa — mas pelo teste "preciso nomear um domínio para explicar?" seriam
dos módulos `budget`/`investment`/`consultant`.

**A10. Ciclos herdados.** 83 arquivos (FE) e 7 (BE) dentro de componente cíclica, tolerados pelo
ratchet. No backend o ciclo é `categorizationRule/contract ↔ transaction/contract` via
`categorizationRuleRouter.ts` e `transactionManagementService.ts`.

**A11. Arquivo fora de `modules/`/`shared/` no front.** `FE: src/services/__tests__/profilePhotoUpload.test.ts`
— **não rastreado pelo git** (`.git/info/exclude` esconde `**/__tests__/`, `**/*.test.ts`,
`vitest.config.ts`, `src/test-setup.ts`). Resíduo local, não viola o repo; mas mostra que no
front os testes precisam de `git add -f` para entrar (os do `objective` estão rastreados).

**A12. Validação à mão em vez de Zod nas rotas externas.** `externalObjectiveController.ts`
valida `emails`, `amount`, `assetIds` com `typeof`/`Array.isArray` em vez de `validateForm(schema)`.
Convenção dos routers internos, não seguida nos externos.

**A13. `objectiveService.ts` tem 632 linhas brutas** — passa no `max-lines: 600` porque a regra
ignora vazias (`skipBlankLines`). Está no limite; o CLAUDE.md recomenda extrair para núcleo puro
ao tocar.

**A14. README do backend desatualizado.** `BE: README.md` descreve a estrutura antiga
(`controllers/ services/ middlewares/ routes/ cron/ dependencies/ models/`) que o `extinct` hoje
proíbe; o FE `README.md` idem (`components/ pages/ lib/ hooks/ utils/`). O CLAUDE.md é a fonte
correta.
