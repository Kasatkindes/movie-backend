# Подбор фильма по настроению

Фронтенд (HTML, CSS, JS, ассеты) в корне проекта. API для рекомендаций — Express-сервер в корне.

## Структура

- **Корень** — `server.js` (единственная точка входа), `index.html`, `style.css`, `app.js`, папка `assets/` (иконки, персонажи).
- **`api/`** — `api/recommend.js` (рекомендации через Groq), `api/image.js` (прокси изображений TMDB).

## Локальный запуск

```bash
npm install
node server.js
```

Откройте http://localhost:3000. Задайте переменные окружения `GROQ_API_KEY` и `TMDB_API_KEY` (или в `.env`).

## Деплой

**Node-сервер (VPS, PM2 и т.д.):** скопируйте проект на сервер, выполните `npm install`, задайте `GROQ_API_KEY` и `TMDB_API_KEY`, запустите `node server.js` (или через PM2).

**Vercel:** при использовании Vercel настройте переменные **`GROQ_API_KEY`** и **`TMDB_API_KEY`**; статика и `/api/recommend` раздаются из корня.

## Публикация в GitHub

```bash
git add .
git commit -m "Flat structure, Groq API"
git push
```

`.env` и `node_modules` в `.gitignore` — секреты не попадут в репозиторий.
