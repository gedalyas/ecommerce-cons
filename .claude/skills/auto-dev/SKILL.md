---
name: auto-dev
description: Orquestra o ciclo completo de uma task do E-commerce Insights — plano fatiado (com gate de aprovação) registrado em specs/, implementação de uma fatia por vez, /code-review com validação de achados, loop de /pre-commit até limpar, smoke nos dev servers, dod-checker e commit-writer — parando sempre antes do commit, que é do dev. Use quando o usuário trouxer uma task/feature/bug pra desenvolver, um item de board de specs/ ou um card do Trello, ou rodar /auto-dev <descrição>. `/auto-dev continuar` retoma a próxima fatia pendente.
---

# Auto-dev — task → fatia pronta para commit

Objetivo: automatizar a sequência que se repete em toda task — plano, implementação em fatias, code review, pre-commit, smoke, DoD, mensagem de commit — encadeando as skills e os agentes do projeto, com dois gates humanos fixos: **aprovação do plano** e **o commit** (o dev faz o git). Este skill não reimplementa o que `/pre-commit`, `/code-review`, `dod-checker` e `commit-writer` fazem; ele só encadeia.

Repositório único: `C:\startup\ecommerce-cons` (npm workspaces `apps/web`, `apps/api`, `packages/contracts`, `packages/database`). Regras de código: `CLAUDE.md` da raiz. Não há PR: o dev commita direto na branch atual (normalmente `main`) e dá push; o CI roda no push.

## Entrada

- `/auto-dev <descrição da task>` — ciclo novo a partir de texto livre. Descrição vazia: pergunte qual é a task antes de qualquer outra coisa.
- `/auto-dev <item de board>` — ex.: `G1`, `growth G0`, `specs/growth-tasks.md G2`. O plano já existe e foi aprovado: pule a Etapa 1, leia o `*-plan.md` e o `*-tasks.md` da rodada e vá para a Etapa 2 com a primeira fatia pendente desse item. Se o item for grande demais para uma fatia (teto abaixo), proponha o fatiamento dele e peça aprovação antes de implementar.
- `/auto-dev <link trello.com/c/...> [regras adicionais]` — leia o card pelo MCP do Trello (título + descrição + checklists = task e critérios de aceite). Texto junto do link prevalece sobre o card. MCP indisponível: avise e peça a descrição em texto — nunca invente o conteúdo do card.
- `/auto-dev continuar` — pule a Etapa 1: ache a rodada com fatia pendente (`grep -l "\- \[ \]" specs/*-tasks.md`; mais de uma → pergunte qual) e confirme que a fatia anterior já foi commitada pelo dev: `git log -1` mostra o commit dela e `git status --porcelain` não tem arquivos dela pendentes. Não foi → avise e pare (a próxima fatia pode depender dela). Então Etapa 2.

Se o dev fizer rebase, merge ou pull com conflito no meio do ciclo, rode o agente `rebase-guard` logo depois, antes de retomar.

## Etapa 1 — Plano (gate humano obrigatório)

1. Entre em plan mode (EnterPlanMode). Leia a spec da tela (`specs/<tela>.md`), o plano da rodada se houver, e explore o código afetado (um agente Explore para varreduras largas).
2. O plano abre com o **fatiamento**: quantas fatias (= quantos commits), escopo, workspaces tocados e estimativa de linhas de cada uma. Teto por fatia: **600 linhas contadas** (excluindo `package-lock.json`, `**/migrations/**`, linhas vazias e só-pontuação; testes à parte, até 1000). Cada fatia deixa o sistema funcionando e o CI verde sozinha.
3. O plano diz em qual fatia nasce a **única migration Prisma da task**, se houver.
4. Apresente via ExitPlanMode. **Sem aprovação explícita, nada é implementado.** Rejeitado: ajuste e reapresente, ou encerre.
5. Aprovado: registre no padrão do repositório — `specs/<rodada>-plan.md` (contexto, decisões, fatias) e `specs/<rodada>-tasks.md` (uma linha `- [ ]` por fatia), e uma linha para cada em `specs/README.md`. Se a task é parte de uma rodada existente, acrescente ao board dela em vez de criar outro. Esses arquivos entram no commit da primeira fatia (ou num commit `docs(specs)` próprio, se o dev preferir — pergunte uma vez).
6. Decisão que muda negócio, arquitetura, dados ou segurança e tem alternativa descartada vira `specs/decisions/YYYY-MM-DD-<título>.md` (Contexto / Decisão / Por quê / Alternativas descartadas) na fatia que a implementa.
7. Task veio de card do Trello: crie no card uma checklist `Fatias` com um item por fatia (mesmo texto do board). Já existe de rodada anterior → atualize, não duplique.

## Visibilidade (o ciclo inteiro)

O dev acompanha em tempo real — nunca trabalhe em silêncio:

- Ao começar uma fatia, crie a todo list da sessão: um item por passo da fatia + um por etapa (implementação, code review, pre-commit, smoke, DoD, entrega). Marque cada item no momento em que acontece.
- Anuncie em uma linha cada transição ("Fatia implementada, entrando no code review") e cada decisão relevante (achado descartado, rodada extra de pre-commit, item fora de escopo).
- O board em `specs/` é o registro durável entre sessões; a todo list é o painel vivo.

## Etapa 2 — Implementação (uma fatia por execução)

1. Identifique a próxima fatia pendente no board.
2. `git status --porcelain`: anote o que já estava modificado **antes** de começar — outra sessão do Claude pode estar editando a mesma árvore. Esses arquivos não são da fatia: não formate, não reverta, não inclua. Nunca `git stash` (autocrlf reescreve tudo como CRLF no pop).
3. Implemente seguindo o plano e o `CLAUDE.md`. Os hooks (`pre-write-guard`, `post-write-check`) já dão feedback de guarda, Prettier, ESLint e typecheck a cada escrita — não duplique esses checks aqui; quando um hook reclamar, corrija na hora.
4. Regras que a implementação carrega:
   - **Uma migration Prisma por task** (somando todas as fatias), gerada com `npx prisma migrate dev --name <nome>` dentro de `packages/database` (o `npm run db:migrate -- --name` não repassa o nome). Mudança de schema numa fatia posterior dobra na migration da fatia que a criou (regenerando-a) enquanto ela não foi commitada; já commitada → pare e replaneje com o dev. Migration destrutiva: esvazie as linhas antes com `prisma db execute --file` (o prompt interativo aborta).
   - Nunca aceite `prisma migrate reset`, mesmo sugerido por ferramenta.
   - Rota nova no web: `apps/web/src/routes.ts` + reiniciar o dev server do web (o gerador guarda o `routes.ts` antigo). Mudou `.env`: reinicie api e worker.
   - Tela nova ou alterada: estado vazio (loja sem pedidos), 390px, `StoreScreen` + `screenRoutes.ts` + `screenAccess.ts` se for tela nova de loja.
   - O board (`- [x]`) e a spec da tela são atualizados **na própria fatia**.
5. **Varredura de duplicação e de órfão — obrigatória antes de fechar a fatia.** É o erro mais comum de IA nesta base: um helper que já existe com outro nome, ou um export que ninguém chama.

   ```bash
   git diff HEAD -- '*.ts' '*.tsx' | grep -E '^\+export (const|function|class|enum|interface|type)'
   ```

   Mais os exports dos arquivos novos. Para cada item:
   - **Já existe equivalente?** Procure pelo comportamento, não pelo nome: formatação em `packages/contracts/src/shared/format.ts` e `metricFormat.ts`; período/janela em `period.ts`/`periodWindow.ts`; `metricValue`, `ratio`/`percent` nos rules do módulo; componentes em `apps/web/src/shared/ui`; helpers HTTP em `apps/api/src/shared/http`. Achou → use. Falta um parâmetro → estenda o existente com default.
   - **Tem consumidor hoje?** `grep -rn "<nome>" apps packages --include=*.ts --include=*.tsx | grep -v '\.test\.'`. Só o arquivo que declara e o teste → apague export e teste.
   - **A regra extraída é usada em todo lugar onde aparece?** Extrair a regra e deixar a mesma condição escrita à mão noutro service da fatia é duplicação.

## Etapa 3 — Code review (loop de correção)

1. Invoque o skill `code-review` em nível `medium` sobre o diff do working tree.
2. Para cada achado, **valide no código antes de corrigir** e diga o veredito:
   - Procede → corrija.
   - Não procede → descartado, com a justificativa, no resumo final.
   - Procede mas fora do escopo da fatia → não corrija; vai para "fora de escopo" no resumo final, com contexto para o dev decidir. Nunca crie arquivo de pendências.

## Etapa 4 — Pre-commit, smoke e DoD (gate de qualidade)

1. Invoque o skill `pre-commit` informando os arquivos da fatia.
2. Findings: corrija (validando como na Etapa 3) e rode `pre-commit` de novo. **Máximo 3 rodadas.** A terceira ainda suja → pare e reporte o que restou.
3. **Smoke** (DoD do `CLAUDE.md`, o CI não roda): suba ou reuse os dev servers (`npm run dev -w apps/api` na :3090, `npm run dev -w apps/web` na :8090, ocultos, logs em `%LOCALAPPDATA%\Temp\claude`; nunca mate processo por porta sem conferir o nome — a 8080 é do Docker Desktop). API: cada endpoint novo ou alterado responde 200 com bearer (login do seed, `x-client-id` da loja). Web: a tela alterada abre logada via Playwright `channel: "chrome"` no scratchpad (cookie selado), em 1280px e 390px, sem erro no console; olhe o screenshot. Escrita: exercite o POST/PUT/DELETE e confira o efeito.
4. Com pre-commit limpo e smoke ok, rode o agente `dod-checker` com a descrição da fatia (critérios de aceite). Item ❌ volta para o passo 2 e conta nas 3 rodadas.
5. Especialistas, em paralelo com o `dod-checker`, só quando o diff pisa no território deles:
   - `packages/database/prisma/**`, `$queryRaw` ou query nova em `*Service.ts` → agente `db-reviewer`.
   - Auth, sessão, convites, conectores/OAuth/vault, upload, validação de input ou dado sensível → agente `security-auditor`.
   - Tela ou componente do `apps/web` → skill `check-design-system` sobre os `.tsx` da fatia.
   - Achado procedente segue a regra da Etapa 3.

## Etapa 5 — Entrega

1. Invoque o agente `commit-writer` com a lista de arquivos da fatia.
2. Confirme que o board marca a fatia (`- [x]`) e, se houver card no Trello, marque o item correspondente da checklist `Fatias` pelo MCP.
3. Mensagem final, nesta ordem:
   - Resumo do que foi implementado; smoke feito (o quê, com que resultado); achados descartados (com justificativa); achados fora de escopo.
   - O comando de staging **com a lista explícita de arquivos da fatia** (nunca `git add -A` — pode haver trabalho de outra sessão na árvore):
     ```
     git add <arquivo> <arquivo> …
     ```
   - A mensagem de commit do `commit-writer`, em bloco de código cru, pronta para `git commit -F`.
   - Quantas fatias restam e a instrução: commitar esta antes de `/auto-dev continuar`.

## Regras duras

- Nunca rode `git add`, `git commit`, `git push`, `git rebase`, `git stash`, `git reset` ou `git checkout` de arquivo. O fluxo termina com o working tree pronto e os textos entregues.
- Nunca pule o gate do plano, mesmo em task pequena (item de board já aprovado conta como plano aprovado).
- Uma fatia por execução: não emende a próxima antes do commit da atual.
- Comandos npm na raiz (os scripts já varrem os workspaces), ou com `-w <workspace>`.

## Modo loop (quando o dev pede "rodar em loop")

O dev autoriza, para aquela rodada, que as fatias andem sem parar: cada fatia passa pelo pipeline inteiro (Etapas 2 a 5) e, com tudo verde, **o Claude faz o commit local** na branch atual com a mensagem do `commit-writer` e o `git add` explícito dos arquivos da fatia — **nunca `git push`**, nunca `--no-verify`. Depois segue para a próxima fatia do board. Para no fim do item combinado, num gate de plano (fatiamento novo), numa decisão de produto que o plano não responde, ou quando o pre-commit sai sujo na terceira rodada. Fora do loop, vale a regra dura acima.

## Trello (MCP do claude.ai)

- Board do projeto: **System-ecommerce-consulting** (`https://trello.com/b/iFTt7yTQ`), listas **To do**, **Desenvolvendo**, **Concluido**.
- Permitido: ler card, criar/atualizar a checklist `Fatias`, marcar item. Nunca mova card de lista, nunca arquive, nunca altere título ou descrição sem o dev pedir.
- Anexos de card não chegam pelo MCP; se suspeitar que falta contexto, peça ao dev.
