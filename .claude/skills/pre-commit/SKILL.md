---
name: pre-commit
description: Roda localmente, antes do commit, exatamente o que o CI do E-commerce Insights roda (typecheck, lint no teto de warnings por workspace, ciclos 0, testes, Prettier, build) mais os invariantes do CLAUDE.md que o CI não lê (contract.ts, I/O só no orquestrador, núcleo puro com teste, shared sem domínio, idioma, tokens do design system) e um review do diff. Use ao terminar uma fatia, antes do dod-checker e do commit-writer. Só lê e roda npm; nunca commita.
---

# Pre-commit — o CI rodando local, e o que ele não vê

Objetivo: o commit que o dev fizer entra na `main` com o CI verde e sem violar o `CLAUDE.md`. Não há PR neste projeto — este check é a única barreira antes do push.

## Passo 1 — O que está em voo

```bash
git status --porcelain
git diff HEAD --name-only
git ls-files --others --exclude-standard
```

Outra sessão do Claude pode estar editando a mesma árvore: se o usuário ou o auto-dev disse quais arquivos são da fatia, audite só esses e liste os outros como "fora da fatia". Nunca use `git stash` (o clone tem `core.autocrlf=true` e o pop reescreve tudo como CRLF).

## Passo 2 — O que o CI roda (`.github/workflows/ci.yml`), na raiz, nesta ordem

Rode tudo e reporte tudo junto; não pare no primeiro erro.

1. **Prettier**: `npx prettier --write <arquivos da fatia>` — única escrita permitida desta skill. Depois `npm run format:check` (o repo inteiro, inclui `.md`); arquivo sujo que a fatia não tocou é bloqueio externo.
2. **Typecheck**: `npm run typecheck`.
3. **Lint + teto**: `npm run lint`. Conte os warnings **por workspace** e compare com `grep -oE 'max-warnings [0-9]+' .github/workflows/ci.yml` (o CI aplica o mesmo teto a cada workspace).
   - Acima do teto → `cd <workspace> && npx eslint <arquivos da fatia>` para achar o warning da fatia; ele sai antes do commit. As três regras que geram warning: `max-lines-per-function` (50 em `.ts`, 150 em `.tsx`), `max-params` (5), `max-depth` (4). A pegadinha é editar função legada perto do limite: extraia o trecho tocado para função pura com teste.
   - A fatia removeu warning e o maior workspace ficou abaixo do teto → o teto desce no `ci.yml` no mesmo commit (CLAUDE.md › Testability 1). Diga o número.
   - `JavaScript heap out of memory` → reexecute com `NODE_OPTIONS=--max-old-space-size=4096`.
4. **Ciclos**: `npm run check:cycles -- --max-files 0`. Acima de 0 → a fatia fechou um ciclo; quebre na ordem do CLAUDE.md › Cycles (`import type` → o consumidor declara a forma e o composition root injeta → mover para o dono → `shared/`). Se o script falhar no Windows, diga "ciclos não verificados" — nunca "ok".
5. **Testes**: `npm test`.
6. **Build**: `npm run build` (import protection, route tree, bundle do api).

## Passo 3 — Arquitetura (CLAUDE.md › Architecture), só no que a fatia criou ou moveu

```bash
git diff HEAD -M --diff-filter=AR --name-status
git ls-files --others --exclude-standard -- apps packages
```

Editar arquivo existente não é finding de arquitetura. Para cada arquivo novo ou movido:

- **ARCH-1 Módulo**: código de domínio nasce em `apps/web/src/modules/<domain>/`, `apps/api/src/modules/<domain>/` ou `packages/contracts/src/<domain>/`. Nome em inglês, camelCase, da lista de módulos do `CLAUDE.md` — módulo novo entra na lista no mesmo commit. Sem subpasta de domínio (`MAX_MODULE_DEPTH = 0`); teste do "e".
- **ARCH-2 Porta pública**: import que atravessa módulo vai só ao `contract.ts`; `contract.ts` é lista `export { X } from "./x"` escrita à mão, sem `export *`, sem export sem consumidor.
- **ARCH-3 I/O só no orquestrador**: `prismaClient` só em `*Service.ts` do api; `apiFetch`/sessão só em `*Controller.ts` do web e em `shared/dependencies/`; nada de `process.env` fora de `shared/config/env.ts`; relógio por parâmetro (`todayIso()`, `currentDay()`, `now()` injetado).
- **ARCH-4 Núcleo puro com teste**: arquivo de regra novo sem `*.test.ts` irmão é finding. Função síncrona e determinística adicionada em service/controller/hook/componente é finding (extrair; para `contracts` se o web também usa). Estado de UI não é regra.
- **ARCH-5 `shared/`**: arquivo novo em `shared/` que precisa nomear um domínio para ser explicado é finding (volta para o módulo dono). `shared/ui` nunca importa `modules/` nem um domínio de `contracts`. Widget de um módulo só fica no módulo.
- **ARCH-6 Dependência entre workspaces**: `apps/web` nunca importa `@ecommerce/database` nem `@prisma/*`; `packages/*` sem React/Prisma/TanStack/`@/`.
- **ARCH-7 Move sem lógica**: `git diff HEAD -M --diff-filter=R` com similaridade < 100% e linhas além de import → separar em dois commits.

## Passo 4 — Review do diff

Leia `git diff HEAD` + os novos e aponte **só o que bloqueia**:

- Bug de correção ou de segurança (isolamento entre lojas: todo dado por `clientId` do token).
- Mock, dado fake ou copy de loja em código de produção (não existe loja demo; "Loja Exemplo" só no `db:seed:dev`).
- **Idioma**: identificador, arquivo, chave, caminho de API em português (acento já é erro de lint); string visível ao usuário em inglês (label, `aria-label`, `head()`, mensagem de erro da API, CSV). Varredura:

  ```bash
  git diff HEAD -- '*.ts' '*.tsx' | grep -E '^\+' | grep -vE '^\+\+\+ ' | grep -inE '[ãõáéíóúçâêôà]'
  ```

  Cada linha: string visível (ok), identificador (finding), log (ok).

- **Design system** (se tocou `apps/web`): hex inline, `text-[Npx]` novo, breakpoint novo, componente de `shared/ui` duplicado, ícone fora do `lucide-react`, botão só-ícone sem tooltip, selo de fidelidade renderizado. Para uma auditoria completa, sugira `/check-design-system`.
- Comentário novo em `src/`, docblock legado deixado num arquivo tocado, `console.log`, `any`, `undefined` onde o valor cruza o fio (o repo usa `null`).
- Closed set sem tupla + label + `enumParity.test.ts`; escrita sem `recordActivity`; tela sem estado vazio.
- Plano e spec: a fatia marca o board da rodada (`specs/<rodada>-tasks.md`) e atualiza `specs/<tela>.md` quando o comportamento muda.

Sem sugestões opcionais, estilo ou "seria melhor se". Na dúvida, não aponte.

## Passo 5 — Veredito

- **Limpo, pode seguir para o dod-checker** — tudo verde, cada workspace com warnings **igual ou abaixo** do teto (abaixo pede baixar o teto), ciclos 0, arquitetura e review sem finding; ou
- Lista de findings com `arquivo:linha`, o problema em uma frase e a correção sugerida. Ordem: review, arquitetura (`ARCH-n`), comandos.

Feche com a tabela: warnings por workspace × teto, arquivos em ciclo × 0, e o que o dev precisa mover (arquivo, de quanto para quanto). O que não rodou aparece como "não verificado".

## Regras duras

- Nunca rode `git add`, `commit`, `push`, `rebase`, `stash`, `checkout` ou `reset`.
- A única escrita permitida é o `prettier --write` nos arquivos da fatia.
- Não corrija findings por conta própria; reporte (o `/auto-dev` é quem corrige e roda de novo).
