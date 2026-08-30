# Multi-stage build: compile with the full toolchain, run only the Nitro output.

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# Generate the Prisma client before the build so server code can import it.
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=8080

# The Nitro output is self-contained; no node_modules needed at runtime.
COPY --from=build /app/.output ./.output
COPY --from=build /app/prisma ./prisma

EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
