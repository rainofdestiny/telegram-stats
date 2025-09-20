# Stage 1 — build
FROM node:20-alpine AS build
WORKDIR /app

# Установим зависимости
COPY package.json package-lock.json* ./
RUN npm install

# Скопируем весь код
COPY . .

# Собираем проект
RUN npm run build

# Stage 2 — serve
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf
