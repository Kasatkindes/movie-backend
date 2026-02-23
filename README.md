# Подбор фильма по настроению

Фронтенд (HTML, CSS, JS, ассеты) в корне проекта. API для рекомендаций — Vercel Serverless (Groq).

## Структура

- **Корень** — `index.html`, `style.css`, `app.js`, папка `assets/` (иконки, персонажи).
- **`/api`** — серверные функции Vercel; `api/recommend.js` — рекомендация фильма через Groq (модель llama3-8b-8192).
- **`/backend`** — зарезервировано под дополнительный бэкенд при необходимости.

## Локальный запуск

```bash
# Статика из корня
npx serve . -p 8080
# или
python3 -m http.server 8080
```

Откройте http://localhost:8080. Для работы кнопки «Подобрать фильм» нужен деплой на Vercel (или прокси к API с `GROQ_API_KEY`).

## Деплой на Vercel

1. Подключите репозиторий к Vercel.
2. В настройках проекта добавьте переменную окружения **`GROQ_API_KEY`** (ключ из [console.groq.com](https://console.groq.com)).
3. Деплой: статика раздаётся из корня, запросы к `/api/recommend` обрабатывает `api/recommend.js`.

## Публикация в GitHub

```bash
git add .
git commit -m "Flat structure, Groq API"
git push
```

`.env` и `node_modules` в `.gitignore` — секреты не попадут в репозиторий.
