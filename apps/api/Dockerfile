# Multi-stage build: bundle the API with esbuild, run the bundle with the
# production node_modules. Build context is the repository root.

FROM node:22-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/contracts/package.json packages/contracts/
COPY packages/database/package.json packages/database/
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run db:generate && npm run build -w apps/api

FROM node:22-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production API_PORT=3090

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/contracts/package.json packages/contracts/
COPY packages/database/package.json packages/database/
RUN npm ci --omit=dev --no-audit --no-fund

COPY --from=build /repo/apps/api/dist apps/api/dist
COPY --from=build /repo/packages/database packages/database

EXPOSE 3090
# The API image runs the migrations and ensures the first admin (ADMIN_EMAIL / ADMIN_PASSWORD)
# before listening; the worker service reuses the image with `node apps/api/dist/worker.mjs`.
CMD ["sh", "-c", "npx prisma migrate deploy --config packages/database/prisma.config.ts && node apps/api/dist/seed.mjs && node apps/api/dist/index.mjs"]
