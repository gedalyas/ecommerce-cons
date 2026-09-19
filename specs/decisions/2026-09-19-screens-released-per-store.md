# Telas liberadas por loja: o MVP mostra tudo, a consultoria abre o que está pronto

**Data:** 2026-09-19

## Contexto

O MVP entra em piloto com Marketing e Comercial (Pedidos) prontos para uso; Dinheiro,
Logística, Gestão, Produtos, Clientes, Metas, Métricas, Influenciadores e o Assistente
existem no código mas ainda não estão maduros para um cliente real. Até aqui o dono da loja
via todas as telas, e a única restrição existente (áreas por membro de equipe) é uma
permissão que o próprio dono controla — não serve para a consultoria segurar uma tela.

## Decisão

- Um conjunto fechado `StoreScreen` (enum Prisma + tupla em `contracts/auth`) e a coluna
  `Client.releasedScreens`, padrão `[MARKETING, ORDERS]` para toda loja nova.
- **Todas as abas aparecem para o cliente.** A não liberada fica com cadeado e abre
  `/em-desenvolvimento?tela=<slug>` — uma página com o nome da tela e "Em desenvolvimento",
  nunca um 404 nem uma aba escondida.
- Quem controla é a consultoria: coluna "Telas liberadas" em `/admin` › Lojas (admin ou
  consultor da loja), auditada como `STORE_SCREENS_RELEASED`.
- Staff vê tudo, sempre; só `CLIENT` (dono e membros) recebe a lista da loja. A regra é
  independente das áreas por membro e se aplica depois delas.
- A API protege os prefixos de cada tela (`createScreenGuards`), como já faz com as áreas;
  o web só antecipa a resposta.

## Por quê

- Mostrar a aba bloqueada comunica o roadmap ao cliente e evita "cadê a tela X?"; esconder
  faria o produto parecer menor do que é.
- Por loja, e não global, porque o piloto tem clientes em estágios diferentes: uma loja
  pode receber Dinheiro antes das outras sem deploy.
- Reaproveitar o mecanismo das áreas (prefixo de rota → guard → 403 em português) mantém a
  autorização num lugar só e o web sem regra própria.

## Alternativas descartadas

- **Feature flag global por ambiente** — não permite liberar por cliente e exige deploy.
- **Reutilizar `viewAreas` do dono** — é uma permissão do cliente sobre a equipe dele;
  misturar os dois conceitos deixaria o dono capaz de "se liberar" uma tela.
- **Esconder as abas não liberadas** — o cliente não vê o que está por vir e a
  consultoria perde a chance de vender a próxima etapa.
