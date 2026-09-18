# E-commerce Insights - developer entrypoints.
#
#   make ecom   -> full local setup in the background: env, deps, docker, postgres,
#                  migrations, seed, api + worker + web, browser
#   make dev    -> the three dev servers in the foreground (Ctrl+C stops them)
#   make up     -> everything containerized (postgres + built app)
#
# Recipes run under bash on every platform (Git Bash on Windows).
# Requires: Docker Desktop (compose v2), Node.js >= 22, GNU make.

ifeq ($(OS),Windows_NT)
SHELL := C:/PROGRA~1/Git/bin/bash.exe
START_DOCKER = powershell -NoProfile -Command "Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'"
OPEN_URL = powershell -NoProfile -Command "Start-Process $(1)"
else
SHELL := /bin/bash
START_DOCKER = open -a Docker
OPEN_URL = open "$(1)"
endif
.SHELLFLAGS := -c

COMPOSE := docker compose
API_PORT ?= 3090
WEB_PORT ?= 8090
LOGS := .makelogs
REPO := $(notdir $(CURDIR))

.DEFAULT_GOAL := help

.PHONY: help ecom env install ensure-docker db wait-db migrate seed seed-dev dev api worker web \
        stop kill logs up down build preview lint format typecheck check studio db-reset clean

# ── Helpers ──────────────────────────────────────────────────────────────────

# spawn_dev detaches a dev server and returns at once, so `make ecom` brings the
# whole environment up from one terminal and gives the prompt back. Output goes
# to .makelogs/<label>.log (`make logs` tails it); `make stop` is what stops them.
# Usage: $(call spawn_dev,label,command)
define spawn_dev
	mkdir -p $(LOGS) && ( $(2) & ) > $(LOGS)/$(1).log 2>&1 && echo "  $(1) -> $(LOGS)/$(1).log"
endef

# Stopping takes two passes. kill_port only sees a server once it is LISTENING,
# so it misses one still booting; kill_proc matches the command line instead.
# kill_port only ever kills node processes: a port published by Docker belongs
# to the Docker backend, and killing that takes Docker Desktop down with it.
# Usage: $(call kill_port,3090) / $(call kill_proc,src/worker\.ts)
ifeq ($(OS),Windows_NT)
define kill_port
	netstat -ano | grep -E ":$(1)[[:space:]]+.*LISTENING" | awk '{print $$5}' | sort -u | while read pid; do \
		tasklist //FI "PID eq $$pid" //NH 2>/dev/null | grep -qi node.exe && taskkill //F //PID $$pid > /dev/null 2>&1 || true; \
	done
endef
define kill_proc
	powershell -NoProfile -Command "Get-CimInstance Win32_Process -EA SilentlyContinue | Where-Object { \$$_.Name -eq 'node.exe' -and \$$_.CommandLine -match '$(1)' } | ForEach-Object { Stop-Process -Id \$$_.ProcessId -Force -EA SilentlyContinue }" 2>/dev/null || true
endef
define port_is_listening
	netstat -ano | grep -qE ":$(1)[[:space:]]+.*LISTENING"
endef
else
define kill_port
	lsof -a -ti:$(1) -c node | xargs kill -9 2>/dev/null || true
endef
define kill_proc
	pkill -f "$(1)" 2>/dev/null || true
endef
define port_is_listening
	lsof -ti:$(1) > /dev/null 2>&1
endef
endif

# Opens the browser once the port answers, from a detached loop so make returns.
# Usage: $(call open_when_ready,8090)
define open_when_ready
	nohup bash -c 'for i in $$(seq 1 90); do \
		if $(call port_is_listening,$(1)); then \
			$(call OPEN_URL,http://localhost:$(1)) > /dev/null 2>&1; \
			break; \
		fi; \
		sleep 1; \
	done' > /dev/null 2>&1 &
endef

define kill_dev_servers
	$(call kill_proc,apps/api); \
	$(call kill_proc,apps/web); \
	$(call kill_proc,tsx.*src/index\.ts); \
	$(call kill_proc,tsx.*src/worker\.ts); \
	$(call kill_port,$(API_PORT)); \
	$(call kill_port,$(WEB_PORT))
endef

# ── The one-shot target ──────────────────────────────────────────────────────

ecom: env install db migrate seed ## Set everything up, start api + worker + web in the background, open the browser
	@$(call kill_dev_servers)
	@echo "Starting dev servers in the background..."
	@$(call spawn_dev,api,npm run dev -w apps/api)
	@$(call spawn_dev,worker,npm run dev:worker -w apps/api)
	@$(call spawn_dev,web,npm run dev -w apps/web)
	@$(call open_when_ready,$(WEB_PORT))
	@echo ""
	@echo "E-commerce Insights is starting up!"
	@echo "  Web:     http://localhost:$(WEB_PORT)  (the browser opens once it is ready)"
	@echo "  API:     http://localhost:$(API_PORT)/api/v1"
	@echo ""
	@echo "  make logs   follow the server output"
	@echo "  make stop   stop everything (works in this same terminal)"

env: ## Create .env from .env.example if it does not exist
	@[ -f .env ] || { cp .env.example .env && echo "created .env from .env.example"; }

install: ## Install npm dependencies
	npm install --no-audit --no-fund

# ── Docker / database ────────────────────────────────────────────────────────

ensure-docker: ## Start Docker Desktop if the daemon is not running
	@if ! docker info > /dev/null 2>&1; then \
		echo "Docker is not running. Starting Docker Desktop..."; \
		$(START_DOCKER) > /dev/null 2>&1; \
		printf "Waiting for Docker to be ready"; \
		for i in $$(seq 1 90); do \
			docker info > /dev/null 2>&1 && break; \
			printf "."; sleep 2; \
		done; \
		docker info > /dev/null 2>&1 || { echo; echo "Docker did not start within 3 min - open Docker Desktop and try again"; exit 1; }; \
		echo " ready"; \
	fi

db: ensure-docker ## Start Postgres in Docker and wait until it is healthy
	$(COMPOSE) up -d postgres
	@$(MAKE) --no-print-directory wait-db

wait-db: ## Block until the Postgres container reports healthy
	@printf "Waiting for postgres"
	@for i in $$(seq 1 60); do \
		[ "$$(docker inspect -f '{{.State.Health.Status}}' ecommerce-postgres 2>/dev/null)" = healthy ] && break; \
		printf "."; sleep 1; \
	done
	@[ "$$(docker inspect -f '{{.State.Health.Status}}' ecommerce-postgres 2>/dev/null)" = healthy ] \
		|| { echo; echo "postgres did not become healthy within 60s - check 'docker compose logs postgres'"; exit 1; }
	@echo " ready"

migrate: ## Apply Prisma migrations (creates them in dev if none exist)
	npm run db:migrate

seed: ## Seed the admin user (ADMIN_EMAIL / ADMIN_PASSWORD)
	npm run db:seed

seed-dev: ## Seed the admin plus "Loja Exemplo" for local work
	npm run db:seed:dev

studio: ## Open Prisma Studio
	npm run db:studio

db-reset: ## Drop, re-migrate and re-seed the database (destructive)
	npm run db:reset

# ── Dev servers ──────────────────────────────────────────────────────────────
# `dev`, `api`, `worker` and `web` run in the FOREGROUND: the output lands on
# screen and Ctrl+C stops them - one per terminal. `ecom` runs them detached.

dev: ## api + worker + web in the foreground (Ctrl+C to stop)
	@$(call kill_dev_servers)
	npm run dev

api: ## API alone (foreground)
	@$(call kill_port,$(API_PORT))
	npm run dev -w apps/api

worker: ## pg-boss worker alone (foreground)
	@$(call kill_proc,tsx.*src/worker\.ts)
	npm run dev:worker -w apps/api

web: ## Web alone (foreground, opens the browser)
	@$(call kill_port,$(WEB_PORT))
	@$(call open_when_ready,$(WEB_PORT))
	npm run dev -w apps/web

logs: ## Follow the background server output (Ctrl+C stops watching, servers keep running)
	@if [ ! -d $(LOGS) ]; then \
		echo "No $(LOGS)/ yet - start the servers with 'make ecom' first."; \
		exit 1; \
	fi
	@echo "Following $(LOGS)/ (Ctrl+C to stop watching - servers keep running)"
	@tail -n 40 -f $(LOGS)/*.log

kill: ## Stop the dev servers, leave Postgres running
	@echo "Stopping dev servers..."
	@$(call kill_dev_servers)
	@echo "Dev servers stopped (postgres still running)."

stop: kill ## Stop the dev servers and the containers (keeps the database volume)
	@$(COMPOSE) --profile app stop 2>/dev/null || true
	@echo "Everything stopped."

# ── Containerized run ────────────────────────────────────────────────────────

up: ensure-docker ## Build and run postgres + api + web fully in Docker
	$(COMPOSE) --profile app up -d --build
	@echo "web on http://localhost:$(WEB_PORT), api on http://localhost:$(API_PORT)/api/v1"

down: kill ## Stop and remove containers (keeps the database volume)
	$(COMPOSE) --profile app down

# ── Everyday tasks ───────────────────────────────────────────────────────────

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

check: ## Everything CI runs: typecheck, lint, cycles, tests, format, build
	npm run typecheck && npm run lint && npm run check:cycles -- --max-files 0 && npm test && npm run format:check && npm run build

clean: down ## Remove containers, build output, logs and node_modules
	rm -rf apps/web/.output apps/web/.tanstack apps/web/.nitro apps/web/node_modules \
		apps/api/dist apps/api/node_modules \
		packages/contracts/node_modules packages/database/node_modules packages/database/src/generated \
		node_modules $(LOGS)
	@echo "removed build output, logs and node_modules"

# ── Help ─────────────────────────────────────────────────────────────────────

help: ## List available targets
	@echo "Usage: make <target>"
	@echo ""
	@echo "'make ecom' brings the whole environment up from one terminal, in the"
	@echo "background, and opens the browser; 'make stop' stops it, 'make logs' follows it."
	@echo "'make dev', 'make api', 'make worker' and 'make web' run in the foreground instead."
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk -F ':.*?## ' '{ printf "  %-14s %s\n", $$1, $$2 }'
