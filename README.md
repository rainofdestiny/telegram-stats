# Telegram Stats (React + Docker)

## Быстрый старт в Docker
1. Установи Docker Desktop.
2. В корне проекта:
```bash
docker compose up --build -d
```
3. Открой: http://localhost:8080
4. Перетащи файл `result.json` из экспорта Telegram.

## Локальная разработка (без Docker)
```bash
npm install
npm run dev
```
Открой URL из консоли (обычно http://localhost:5173).

## Экспорт Telegram
Telegram Desktop → Настройки → Дополнительно → Экспорт данных Telegram → Выбери чат → Формат JSON.

## Расширение
- Добавь новые метрики в `src/lib/telegram.ts`.
- Новые виджеты кладём в `src/components`.
- UI на Tailwind; графики на Recharts.

## Конфигурация
- Фильтрация ботов: ник оканчивается на `bot`.
- Исключённые отправители: список в `DEFAULT_EXCLUDED_SENDERS`.
- Ссылки на сообщения строятся из slug чата в UI.
