# Deploy — Vercel (web) + Railway (API, worker, Postgres)

Sem domínio próprio por enquanto: usamos as URLs que as plataformas entregam
(`<projeto>.vercel.app`, `<serviço>.up.railway.app`). Quando o domínio existir, só as URLs nas
variáveis e nos apps das plataformas mudam (seção final).

## O que roda onde

| Peça       | Onde    | Como                                                                                |
| ---------- | ------- | ----------------------------------------------------------------------------------- |
| `apps/web` | Vercel  | Nitro com preset `vercel` (automático quando `VERCEL=1`); `apps/web/vercel.json`    |
| `apps/api` | Railway | `apps/api/Dockerfile`; config `apps/api/railway.json`                               |
| worker     | Railway | mesma imagem, start `node apps/api/dist/worker.mjs`; `apps/api/railway.worker.json` |
| Postgres   | Railway | plugin Postgres do projeto                                                          |

A imagem da API, ao subir, roda `prisma migrate deploy` e garante o primeiro admin
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`) antes de escutar — não há passo manual de migração ou seed.

## 1. Railway — Postgres, API e worker

1. Novo projeto → **Deploy from GitHub repo** (este repositório). Ele cria um serviço; renomeie
   para `api`.
2. Serviço `api` → Settings:
   - **Config-as-code file path**: `apps/api/railway.json` (isso fixa o Dockerfile, o health
     check `/api/v1/health` e os watch paths).
   - **Networking → Generate Domain**. A Railway injeta `PORT`; a API escuta nele.
3. `+ New` → **Database → PostgreSQL** no mesmo projeto.
4. Variáveis do `api` (Variables → Raw editor), a partir de `.env.example`:

   ```
   NODE_ENV=production
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=<64 caracteres aleatórios>
   CREDENTIALS_KEY=<node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
   ADMIN_EMAIL=<seu e-mail>
   ADMIN_PASSWORD=<senha forte>
   ADMIN_NAME=<seu nome>
   APP_URL=https://<projeto>.vercel.app
   API_PUBLIC_URL=https://<api>.up.railway.app
   CORS_ORIGINS=https://<projeto>.vercel.app
   SMTP_URL=smtp://<usuario>:<senha>@<host>:587
   MAIL_FROM=E-commerce Insights <no-reply@<dominio-do-smtp>>
   CONNECTOR_USER_AGENT=E-commerce Insights (<e-mail de contato>)
   ```

   `SMTP_URL` é obrigatório em produção (a API não sobe sem ele): o Resend tem plano gratuito
   (`smtp://resend:<api key>@smtp.resend.com:587`) e exige um remetente verificado. Deixe
   `DEMO_TODAY` vazio. Os `*_URL` das plataformas ficam nos valores padrão (não os aponte
   para stubs). `CREDENTIALS_KEY` cifra os tokens das conexões: gere uma vez e nunca troque —
   trocar invalida todas as conexões.

5. `+ New` → **GitHub repo** (o mesmo) → renomeie para `worker` → Settings → **Config-as-code
   file path**: `apps/api/railway.worker.json`. Sem domínio público. Variáveis: as mesmas do
   `api` (Variables → **Shared variables** do projeto evita duplicar, ou copie o raw).
6. Deploy dos dois. No log do `api` deve aparecer `No pending migrations` (ou as migrações
   aplicadas), `admin user ready: …` e `api listening`; no `worker`, `worker running`.
   `https://<api>.up.railway.app/api/v1/health` responde `{"status":"ok"}`.

## 2. Vercel — web

1. **Add New → Project** → importar o repositório.
2. **Root Directory**: `apps/web` (deixe "Include source files outside of the Root Directory"
   ligado — o build usa o lockfile e os `packages/` da raiz). Framework Preset: **Other**. O
   `apps/web/vercel.json` já define install (`npm ci` na raiz), build
   (`npm run build -w apps/web`) e output (`.vercel/output`).
3. Environment Variables (Production e Preview):

   ```
   API_URL=https://<api>.up.railway.app
   SESSION_SECRET=<64 caracteres aleatórios>
   ```

4. Deploy. Abra `https://<projeto>.vercel.app/entrar` e entre com `ADMIN_EMAIL` /
   `ADMIN_PASSWORD`.
5. Volte à Railway e confira que `APP_URL` e `CORS_ORIGINS` do `api` batem com a URL final da
   Vercel (redeploy do `api` se mudou).

## 3. Primeiro uso

1. `/admin` → **Nova loja** com os dados do parceiro → **Convidar** o responsável (o e-mail sai
   pelo SMTP; o link aponta para `APP_URL`).
2. Conexões: um conector só mostra **Conectar** quando as credenciais do app da plataforma
   estão nas variáveis do `api` (`SHOPIFY_*`, `BLING_*`, `GOOGLE_*`, `META_*`, …). Cada app
   cadastra o callback `https://<api>.up.railway.app/api/v1/connectors/<chave>/callback`;
   chaves em `packages/contracts/src/connectors/connectorCatalog.ts`, registro de cada
   plataforma em `docs/apis/`.
3. Adicionar/alterar uma variável na Railway redeploya o serviço — o `api` e o `worker`
   precisam das mesmas credenciais dos conectores.

## Logs e problemas comuns

- Railway → serviço → **Deployments → View logs**. Erros inesperados da API saem como
  `console.error` com a stack.
- `SMTP_URL is required in production`: a variável está vazia no `api`.
- `CREDENTIALS_KEY` inválida: precisa ser 32 bytes em base64 (44 caracteres).
- Health check falhando no deploy: a API espera o Postgres; confira `DATABASE_URL` referencia
  o plugin (`${{Postgres.DATABASE_URL}}`) e que o serviço está no mesmo projeto.
- Web com "Não foi possível falar com a API": `API_URL` na Vercel sem `https://` ou apontando
  para o domínio errado.

## Quando o domínio chegar

1. Vercel → Domains: `app.<dominio>`; Railway → `api` → Networking → Custom domain:
   `api.<dominio>`.
2. Trocar `APP_URL`, `API_PUBLIC_URL`, `CORS_ORIGINS` (Railway) e `API_URL` (Vercel).
3. Trocar a URL de callback em cada app de plataforma (Shopify, Bling, Google, Meta, Mercado
   Livre, Amazon) e refazer as conexões que dependerem do callback antigo.
