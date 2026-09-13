# Multi-stage build: compile with the full toolchain, run only the Nitro output.
# Build context is the repository root (npm workspaces need the root lockfile).

FROM node:22-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
RUN npm ci --no-audit --no-fund

COPY . .
# Generate the Prisma client before the build so server code can import it.
RUN npm run db:generate && npm run build -w apps/web

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=8080

# The Nitro output is self-contained; no node_modules needed at runtime.
COPY --from=build /repo/apps/web/.output ./.output
COPY --from=build /repo/prisma ./prisma

EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
