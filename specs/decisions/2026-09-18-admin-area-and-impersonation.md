# Área de administração fora do painel e acesso como usuário por token marcado

**Data:** 2026-09-18

## Contexto

A administração (`/admin`) vivia como mais uma página dentro do painel da loja, com o link na
sidebar. O dono do sistema quer o mesmo que tem no painel da Arko: uma tela de administração
separada do produto, com a lista de usuários e um "Acesso a Usuários" para abrir o sistema
exatamente como qualquer pessoa o vê — para suporte, para conferir o que um cliente está
enxergando e para operar em nome dele quando preciso.

## Decisão

- `/admin` vira um layout com casca própria (`AdminShell`): Visão geral, Usuários, Acesso a
  usuários, Abrir o painel, Sair. Quem é staff entra e cai em `/admin`; o painel da loja
  perde o link "Administração" e ganha uma faixa fina "Voltar à administração".
- Entrar como usuário emite tokens **reais do alvo**, marcados: o access token carrega
  `act = <id do admin>` e o refresh token guarda `impersonatorId`, de modo que o refresh
  preserva a marca. Só `ADMIN` pode, nunca em cadeia, nunca em si mesmo.
- A sessão web guarda as credenciais do alvo e as do admin em `impersonator`; a faixa
  "Voltar à administração" revoga as do alvo e restaura as do admin.
- Auditoria: o ato gera `USER_IMPERSONATED` em nome do admin; tudo o que for feito depois é
  registrado em nome do alvo com o sufixo " (via administrador)" no nome do ator.

## Por quê

- Token real do alvo significa zero mudança em `resolveClient`, nos guards de área e nos
  serviços: a API já responde "o que esse usuário vê" — não há uma segunda trilha de
  autorização para manter em paridade.
- A marca no token e no refresh token torna o acesso rastreável sem depender do cliente
  lembrar de mandar um cabeçalho, e permite negar impersonação em cadeia.
- Uma casca própria deixa claro para o staff quando está "de fora" (administrando) e quando
  está "dentro" (vendo a loja), o que a sidebar compartilhada confundia.

## Alternativas descartadas

- **Cabeçalho `x-impersonate-user` checado por requisição.** Cada endpoint precisaria
  resolver dois principais; o painel web teria de propagar o cabeçalho por todo `apiFetch`;
  e um refresh comum apagaria a marca.
- **Tokens do alvo sem refresh (só access longo).** Expiraria no meio da sessão e derrubaria
  o admin para `/entrar`, perdendo a sessão original.
- **Manter `/admin` dentro do painel e só adicionar as telas.** Não atende ao pedido de uma
  administração "fora da tela do sistema" e mantém a confusão entre os dois modos.
