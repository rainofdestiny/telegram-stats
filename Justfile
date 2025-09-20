# shell c жёсткими флагами
set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

default: run

# ---------- Линт/чеки ----------
typecheck:
	npm run typecheck

eslint:
	npm run lint

# Не падаем из-за depcheck (он часто ругается на dev-тулинги, подключённые через конфиги)
depcheck:
	npm run depcheck || true

# Строгий depcheck, если нужно увидеть ненулевой код выхода
depcheck-strict:
	npm run depcheck

# Быстрый линт без depcheck
lint:
	just typecheck
	just eslint

# Полный линт, но depcheck не блокирует
lint-all:
	just typecheck
	just eslint
	just depcheck

# ---------- Docker ----------
build:
	docker compose build --no-cache

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

# Полный цикл: линты -> пересборка без кэша -> запуск
run: lint
	docker compose down || true
	docker compose build --no-cache
	docker compose up -d
