# E-commerce Insights - developer entrypoints.
#
#   make ecom   -> full local setup: env, deps, database, migrations, seed, dev server
#   make up     -> everything containerized (postgres + built app)
#
# Recipes must run under both cmd.exe (Windows) and sh, so they stay plain
# command invocations; anything shell-specific lives in scripts/make-helpers.mjs.
# Requires: Docker (with compose v2), Node.js >= 22, GNU make.

COMPOSE := docker compose
HELPERS := node scripts/make-helpers.mjs

.DEFAULT_GOAL := help

.PHONY: help ecom env install db migrate seed dev \
        up down stop logs build preview lint format typecheck \
        studio db-reset clean

help: ## List available targets
	@$(HELPERS) help

# ---------------------------------------------------------------------------
# The one-shot target
# ---------------------------------------------------------------------------

ecom: env install db migrate seed dev ## Set everything up and start the dev server

env: ## Create .env from .env.example if it does not exist
	@$(HELPERS) env

install: ## Install npm dependencies
	npm install --no-audit --no-fund

db: ## Start Postgres in Docker and wait until it is healthy
	$(COMPOSE) up -d postgres
	@$(HELPERS) wait-postgres

migrate: ## Apply Prisma migrations (creates them in dev if none exist)
	npm run db:migrate

seed: ## Seed the database with the prototype dataset
	npm run db:seed

dev: ## Start the dev servers (web http://localhost:8080)
	npm run dev

# ---------------------------------------------------------------------------
# Containerized run
# ---------------------------------------------------------------------------

up: ## Build and run postgres + web fully in Docker
	$(COMPOSE) --profile app up -d --build
	@echo web on http://localhost:8080

down: ## Stop and remove containers (keeps the database volume)
	$(COMPOSE) --profile app down

stop: ## Stop containers without removing them
	$(COMPOSE) --profile app stop

logs: ## Tail container logs
	$(COMPOSE) --profile app logs -f

# ---------------------------------------------------------------------------
# Everyday tasks
# ---------------------------------------------------------------------------

build: ## Production build of every workspace
	npm run build

preview: ## Serve the web production build locally
	npm run preview -w apps/web

lint: ## ESLint over the project
	npm run lint

format: ## Prettier over the project
	npm run format

typecheck: ## TypeScript with no emit
	npm run typecheck

studio: ## Open Prisma Studio
	npm run db:studio

db-reset: ## Drop, re-migrate and re-seed the database (destructive)
	npm run db:reset

clean: down ## Remove containers, build output and node_modules
	@$(HELPERS) clean
