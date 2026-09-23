---
name: check-types
description: Audita os workspaces TypeScript do E-commerce Insights (apps/web, apps/api, packages/contracts, packages/database) por violações de tipagem — `any` explícito, `any` implícito, `as` sem necessidade e assinaturas exportadas sem tipo. Use quando o usuário quiser conferir tipagem antes do commit. Só reporta.
---

# Check Types

Audita a tipagem segundo o `CLAUDE.md` da raiz (Code quality 3 e 7):

1. **Sem `any` explícito** — `: any`, `as any`, `<any>`, `any[]`, `Array<any>`, `Record<string, any>`.
2. **Sem `any` implícito** — parâmetro ou variável sem tipo inferível.
3. **`as` só quando a inferência é comprovadamente insuficiente** — `as unknown as X` e cast de resposta de API sem validação são finding.
4. **Função exportada sem tipo de parâmetro** (o retorno pode ser inferido).
5. **`undefined` onde o valor ausente cruza o fio** — o repo prefere `null` (Prisma, JSON e API concordam).

## Escopo

Por padrão os quatro workspaces: `apps/web/src`, `apps/api/src`, `packages/contracts/src`, `packages/database/src` + `packages/database/prisma` (seed e fixtures). Se o usuário nomear um workspace ou caminho, limite a ele. Ignore `node_modules/`, `dist/`, `packages/database/src/generated/`, `apps/web/src/routeTree.gen.ts`.

## Passos

1. **`any` explícito**: `git grep -nE ":\s*any\b|\bas any\b|<any>|any\[\]|Array<any>|, any>" -- '*.ts' '*.tsx'` nos caminhos do escopo.
2. **Implícito e assinaturas**: `npm run typecheck` na raiz (os tsconfig já são `strict`); reporte só diagnósticos de tipagem (`TS7006`, `TS7005`, `TS7031`, `TS7034`…). Outros erros de build: cite em uma linha, fora da contagem.
3. **Casts**: `git grep -nE "\bas (unknown as|[A-Z][A-Za-z]+(<|\b))" -- '*.ts' '*.tsx'` e julgue cada um — `as const` e cast depois de type guard passam.
4. **Opcional — só o que mudou**: se o usuário pedir "só a fatia", restrinja aos arquivos de `git diff HEAD --name-only` + não rastreados.

## Relatório

Agrupado por workspace, cada violação com link clicável e o trecho:

```
## apps/api
- [src/modules/orders/ordersService.ts:42](apps/api/src/modules/orders/ordersService.ts#L42) — `as any` no resultado do `$queryRaw`

## packages/contracts
✅ Nenhuma violação
```

Feche com uma linha: total de violações e quantos workspaces estão limpos. Não corrija nada, a menos que o usuário peça.
