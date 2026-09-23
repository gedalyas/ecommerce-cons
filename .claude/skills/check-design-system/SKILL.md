---
name: check-design-system
description: Audita se o design system do apps/web está aplicado numa tela, arquivo ou pasta e devolve um relatório de desvios em 5 famílias — cor fora de token, tipografia fora da escala, spacing/radius/shadow/breakpoint soltos, markup feito à mão onde há componente de shared/ui, e responsividade a 390px. Descobre tokens e componentes lendo o código (nunca uma tabela fixa). Só reporta, nunca edita. Use depois de mexer numa tela, antes do commit, ou pra baselinar uma tela.
user-invocable: true
argument-hint: "[arquivo | nome do componente | pasta | 'web']"
---

# Check Design System (apps/web)

Audita telas e componentes de módulo do `apps/web` contra o design system descrito no `CLAUDE.md` › Design system, em `apps/web/src/shared/ui/README.md` e em `specs/design-system.md`. **Nunca edita.**

## Resolver o alvo

- Caminho existente → audita esse arquivo (ou os `.tsx` da pasta).
- Nome solto (`MarketingResumo`) → `apps/web/src/modules/**/<Nome>.tsx`, depois `apps/web/src/shared/layout/**`. Não achou → pare e peça o caminho.
- `web` → varredura de `apps/web/src/modules/**/*.tsx` + `apps/web/src/routes/**/*.tsx` + `apps/web/src/shared/layout/**/*.tsx`. Avise que é grande e confirme.
- Sem argumento → os `.tsx` de `git diff HEAD --name-only` + não rastreados em `apps/web`.
- **Nunca audite a camada do design system**: `apps/web/src/shared/ui/**` e `apps/web/src/shared/styles/**` usam valores internos legítimos. Se o alvo cair lá, responda que é camada DS e pare (numa varredura, só pule).

## Descobrir a fonte da verdade (uma vez por execução)

1. `apps/web/src/shared/styles/global.css`: as variáveis `--color-*` do `@theme` (viram `bg-*`, `text-*`, `border-*`) e as `--*` do `:root` que elas referenciam; as classes `t-*` da escala tipográfica.
2. `typography.ts` (`textClass.label/meta/body/cardTitle/sectionTitle/kpi`, `textClass.numeric`), `spacing.ts` (`layout.page/headerGap/blockStack/groupStack/cardPadding…`, escala 4/8/12/16/24/32/48), `radius.ts` (`radiusClass.card/control/badge`), `shadows.ts` (`shadowClass.*`), `breakpoints.ts`.
3. Catálogo: `ls apps/web/src/shared/ui/*.tsx` (PageHeader, TabBar, SegmentedControl, SectionBlock, MetricTileGroup + metricToTile, DataTable, charts, Badge, ProgressBar, Dialog, Sheet, Popover, Tooltip, Button, Input, Select, MultiSelect, FormField…).
4. Abra o relatório com: "Fonte descoberta: N cores, N classes de texto, N componentes".

Toda sugestão referencia só token ou componente que existe. Sem equivalente → diga "sem equivalente no design system".

## Famílias

**1 — Cor (must-fix).** `(bg|text|border|fill|stroke|ring|outline|from|to|via)-\[#…\]`, `#hex`/`rgb()`/`hsl()` em `className` ou `style`, paleta crua do Tailwind (`bg-gray-*`, `text-red-*`, `bg-white`, `text-black`…). Em props do recharts, o certo é `"var(--chart-1)"`, `"var(--grid)"`. Sugira o token semântico (`bg-card`, `text-muted-foreground`, `bg-primary`, `bg-warning-soft`, `text-destructive`…). Uma só ocorrência já é finding. Laranja só para aviso, `--destructive` só para negativo, um único acento (`--primary`).

**2 — Tipografia (should-fix).** `text-[Npx]`/`leading-[…]` soltos, `font-bold` (pesos permitidos: 400/600), fonte fora da Manrope. Sugira `textClass.*` / `t-*`; números com `textClass.numeric`. Se o tamanho não existe na escala de 6, é `known-gap` — não force um token que muda o desenho; a regra "promova na duplicação" vale: 2+ ocorrências do mesmo valor pedem token novo.

**3 — Espaço, raio, sombra, breakpoint (should-fix).** Arbitrários `p-[…]`, `gap-[…]`, `m-[…]` → utilitário da escala (4/8/12/16/24/32/48); ritmo de tela via `layout.*` (toda página começa com `layout.page`, blocos com `layout.blockStack`). `rounded-[…]` → `radiusClass`; `shadow-[…]` → `shadowClass`. Breakpoint fora de `sm 640 md 768 lg 1024 xl 1280 2xl 1536` ou `min-[…]:` inventado é finding. Valor fora da grade e único → nice-to-have.

**4 — Montado à mão (should-fix, "verificar").** `<button>` estilizado → `Button`; `<input>`/`<select>` → `Input`/`Select`/`FormField`; cartão feito de `div` com borda+sombra → `Card`/`SectionBlock`; abas feitas de botões → `TabBar`/`SegmentedControl`; overlay/modal → `Dialog`/`Sheet`; tabela → `DataTable`; KPI → `MetricTileGroup` + `metricToTile`; gráfico recharts cru → família de charts de `shared/ui`; ícone fora do `lucide-react`; botão só-ícone sem `Tooltip` (rótulo = `aria-label`). Fork de componente do design system é proibido; `className` para ajustar uma instância é permitido. Widget de um módulo só fica no módulo (não é finding).

**5 — Telefone (should-fix).** A tela precisa funcionar a 390px: tabela larga em `overflow-x-auto` ou cards abaixo de `md` (`DataTable` com dicas `mobile`), `max-sm:` em vez de breakpoint novo, campo focável com fonte ≥ 16px, `100svh` e nunca `100vh`, nenhum elemento passando da largura. Se o usuário pedir verificação real, use o padrão `mobile_audit.mjs` (Playwright `channel: "chrome"`, cookie selado, 390×844) descrito na memória do projeto.

Também reporte, sem família: string visível fora de pt-BR, selo de fidelidade A/B/C renderizado (proibido desde 2026-09-18), tela sem estado vazio (loja sem pedidos deve renderizar zeros, "—" e a mensagem vazia do `DataTable`).

## Saída

```
Fonte descoberta: …

## <arquivo>
### must-fix
- ds-color-<Arquivo>-<linha> — [Arquivo.tsx:42](apps/web/src/…#L42) `bg-[#0f6e56]` → `bg-primary`
### should-fix
### nice-to-have
### known-gap
```

IDs estáveis `ds-<familia>-<Arquivo>-<linha>` (famílias: color, type, space, handrolled, phone). Feche com a contagem por bucket. **Pare aí**: não edite, não rode build, não commite.
