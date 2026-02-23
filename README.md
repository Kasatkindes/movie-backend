# Подбор фильма по настроению

Монорепозиторий: фронтенд и бэкенд в одном репозитории.

## Структура

- **`/frontend`** — веб-приложение (HTML, CSS, JS, ассеты). Откройте `frontend/index.html` или раздайте папку `frontend` через веб-сервер.
- **`/backend`** — серверная часть (API и т.д.).

## Локальный запуск фронтенда

Из корня проекта:

```bash
# Вариант 1: простой HTTP-сервер (нужен Python)
cd frontend && python3 -m http.server 8080

# Вариант 2: npx serve
npx serve frontend -p 8080
```

После этого откройте в браузере: http://localhost:8080

## Публикация в GitHub

Если репозиторий ещё не инициализирован и нужно связать папку с существующим репозиторием:

```bash
git init
git add .
git commit -m "Restructure: frontend and backend folders"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/ИМЯ_РЕПОЗИТОРИЯ.git
git push -u origin main
```

Подставьте вместо `ВАШ_ЛОГИН` и `ИМЯ_РЕПОЗИТОРИЯ` свои данные. Файлы `.env` и папка `node_modules` в корне уже добавлены в `.gitignore` и не попадут в репозиторий.
