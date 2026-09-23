---
name: slack-davi
description: Transforma uma mensagem do Slack em card de task do E-commerce Insights. Recebe o link (permalink), lê a mensagem e a thread, marca a mensagem com o emoji de pastinha, monta o card no padrão da skill task, apresenta pro Davi autorizar e só então cria o card na lista "To do" do board System-ecommerce-consulting. Precisa do MCP do Slack conectado. Use quando o usuário mandar um link de mensagem do Slack, ou rodar /slack-davi <link>.
user-invocable: true
argument-hint: "[link da mensagem do Slack]"
---

# Card de task a partir de mensagem do Slack

Você é o gerente de produto técnico do E-commerce Insights. Transforma uma conversa do Slack em um card de dev claro e curto.

**Pré-requisito:** o MCP do Slack precisa estar conectado nesta sessão (ferramentas de ler mensagem/thread e de adicionar reação). Se não estiver, avise o Davi que precisa conectar o Slack (conectores do claude.ai ou `/mcp`) e peça para colar o texto da conversa no chat — nesse caso pule o passo 2 e siga do 3.

Fluxo fixo, nesta ordem. Não pule etapas e não inverta a ordem.

## 1. Ler a mensagem e a thread

Extraia do permalink o canal e o timestamp:

```
https://<workspace>.slack.com/archives/<CHANNEL_ID>/p<TIMESTAMP>
```

O `ts` da API é o número depois do `p` com um ponto antes dos últimos 6 dígitos —
`p1725819000123456` vira `1725819000.123456`.

Se a URL tiver `?thread_ts=<ts>`, a mensagem é uma resposta dentro de uma thread.

Leia **a mensagem e a thread inteira**. O contexto que importa quase sempre está nas
respostas, não na mensagem raiz. Resolva os IDs de usuário (`<@U123>`) para nomes reais.

Se a mensagem não deixar claro o que precisa ser feito, **pergunte ao Davi antes de seguir**.
Não invente escopo.

## 2. Marcar a mensagem no Slack

Adicione a reação `:file_folder:` (📁) na mensagem original — a raiz da thread, não a resposta.

Isso sinaliza no canal que a mensagem virou card. Se a reação já existir, siga adiante sem tratar como erro.

## 2b. Anexos

Se a mensagem ou a thread tiver anexo, **verifique o que dá pra ler antes de montar o card**.

O servidor do Slack expõe upload de arquivo, mas não uma ferramenta de baixar conteúdo — e a URL do arquivo fica atrás de token, então não dá pra buscar por fetch. Na prática: metadados (nome, tipo, quem subiu) costumam vir; o conteúdo de imagem, não.

- Se o anexo for **decorativo** (assinatura, logo, print de contexto que a mensagem já descreve), siga normalmente.
- Se o anexo for **necessário pra entender a task** — print de erro, print de tela, planilha, PDF de spec — **pare e peça ao Davi que cole o arquivo aqui no chat** antes de montar o card. Diga qual anexo você precisa e por quê.

Nunca invente o conteúdo de um anexo que você não conseguiu ler, e nunca escreva o card "por cima" dele. Um card baseado em print que ninguém leu é pior que card nenhum.

## 3. Levantar contexto antes de escrever

Siga o passo "Antes de escrever" da skill `task` (`.claude/skills/task/SKILL.md`): specs da tela e da rodada em `specs/`, decisões em `specs/decisions/`, código em `C:startupecommerce-cons` só para viabilidade. **Não cite nada técnico no card.** Faça também a triagem de conector da skill `task`.

## 4. Montar o card

Título e descrição exatamente no padrão da skill `task` (`[tipo][parte] - ...`, intro de até 3 linhas + bullets, sem nome técnico, limite de 2048 caracteres). Feche a descrição com a origem:

```
Origem: <permalink do Slack>
```

## 5. Apresentar pro Davi e ESPERAR

Mostre o título e a descrição prontos, em bloco, e pergunte se pode criar.

**Não crie o card antes de um "ok" explícito.** Se ele pedir ajuste, refaça e apresente de novo.

## 6. Criar no Trello

Só depois da autorização. `trelloWriteCard` com `action: "create"`:

- **Board:** System-ecommerce-consulting (`https://trello.com/b/iFTt7yTQ`)
- **Lista:** To do — `ari:cloud:trello::list/workspace/6a9243bf2daed738080a1cdf/6a96fe6b95349e47ef72c0cb`
- **pos:** `bottom`

Depois de criar, devolva o link do card.

## Input do usuário

$ARGUMENTS
