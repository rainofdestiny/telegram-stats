# Использует bash с fail-fast
set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# Запуск по умолчанию: все проверки
default: lint

# Полный прогон: типы, ESLint, неиспользуемые пакеты и экспорты
lint:
	npm run typecheck
	npm run lint
	npm run depcheck
	npm run tsprune

# Автоисправление ESLint
fix:
	npm run lint:fix

# CI-пайплайн: чистая установка, проверки и сборка
ci:
	npm ci
	just lint
	npm run build
