# Membros de equipe com acesso por área, sem novas roles

**Data:** 2026-09-18

## Contexto

O dono de uma loja (`CLIENT`) quer delegar partes do produto à sua equipe — marketing para
o time de marketing, financeiro para o financeiro — sem entregar a loja inteira. As três
roles (`ADMIN`, `CONSULTANT`, `CLIENT`) descrevem a relação com a consultoria, não a
divisão interna de uma loja. Toda a autorização existente (`storeAccess`, `requireStaff`,
`role !== "CLIENT"` nos controllers da camada de consultoria) parte da role.

## Decisão

- A role continua `CLIENT`. Dentro da loja há uma segunda dimensão: `membership`
  (`OWNER` | `MEMBER`) e, para membros, um nível por área (`viewAreas` / `editAreas`, com
  `edit ⊃ view`). Cinco áreas fechadas: Dinheiro, Marketing, Logística, Gestão, Dados.
- O dono define tudo: convida, escolhe por área "Sem acesso / Ver / Editar", altera e
  remove. Staff e dono têm acesso irrestrito (`access = null`).
- Na API a regra vive em um lugar: `resolveClient` carrega o acesso, `createAreaGuards()`
  monta `requireArea(area)` por prefixo de rota (`GET` = ver, resto = editar). Escritas
  transversais (conectores, importações) mapeiam o feed/kind para a área.
- Dashboard, Assistente e a leitura de Conexões ficam abertos a todo membro; `/loja`
  (perfil, cobrança, equipe) é do dono.
- Limite de assentos por loja (`Client.teamSeatLimit`, padrão 5, contando convites
  pendentes), ajustável pelo admin.

## Por quê

- Não criar roles novas preserva todos os `switch (role)` e o JWT atual: um membro é um
  `CLIENT` restrito, nunca algo que o resto do sistema desconhece.
- Nível por área (e não uma lista de ações) é o que o dono consegue raciocinar; "editar"
  cobre as escritas que a área já tem (custos, metas, influenciadores, importações e
  conexões dos feeds da área).
- A verificação por prefixo de rota, montada uma vez em `app.ts`, cobre endpoints futuros
  de uma área sem que cada controller lembre de checar. Os pontos transversais são poucos
  e explícitos.
- Ler o acesso do banco a cada request (já era feito para a loja) faz uma mudança de
  permissão valer na hora, sem invalidar tokens.
- Cinco assentos: uma pessoa por área cobre a delegação descrita; o limite é dado, não
  código, para virar atributo de plano quando a cobrança conhecer planos.

## Alternativas descartadas

- **Roles novas (`CLIENT_MARKETING`, …)**: explode o closed set e o enum do Prisma a cada
  combinação; um membro com duas áreas não cabe.
- **Permissões por ação (lista de capabilities)**: mais fina, mas ilegível para o dono e
  fácil de esquecer ao criar um endpoint.
- **Claims de área no access token**: mudanças só valeriam após 15 minutos ou re-login.
- **Checagem manual em cada controller de área**: um endpoint novo esquecido vira vazamento.
