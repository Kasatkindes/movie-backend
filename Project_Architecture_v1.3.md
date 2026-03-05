
# PROJECT: Kinomi
AI Movie Recommendation App
Version: 1.5

## 1. OVERVIEW

Kinomi is an AI‑driven movie recommendation service.

Core idea:
User selects a mood → AI suggests films → validated through TMDB → returned to UI.

Architecture is split into:

Frontend (SPA)
Backend (Node + Express)
AI recommendation pipeline
Infrastructure (VPS + Nginx + PM2)
External APIs (Groq, TMDB)

------------------------------------------------------------

## 2. TECHNOLOGY STACK

Frontend:
- Vanilla JavaScript (SPA)
- CSS tokens + reusable UI components

Backend:
- Node.js
- Express 4
- dotenv

Infrastructure:
- VPS (Fornex)
- Nginx reverse proxy
- PM2 process manager

External APIs:
- Groq LLM (via Cloudflare Worker proxy)
- TMDB API

Analytics:
- Plausible

Feedback:
- Google Forms

------------------------------------------------------------

## 3. INFRASTRUCTURE

Server:
Fornex VPS

Domain:
kinomi.ru
dev.kinomi.ru

DNS:
Managed via Gina.ru

DNS flow:

User → DNS (Gina) → VPS IP → Nginx → Node server

The system has two environments:
Production
Development

Production
Domain: kinomi.ru
Backend port: 3000
Directory: /root/movie-backend-prod
Branch: main
PM2 process: movie-api

Development:
Domain: dev.kinomi.ru
Backend port: 3001
Directory: /root/movie-backend-dev
Branch: develop
PM2 process: movie-api-dev

------------------------------------------------------------

## 4. NGINX ARCHITECTURE

Nginx acts as reverse proxy.

Flow:
Client → Nginx → Node server

Example:
server {

    server_name kinomi.ru www.kinomi.ru;

    location / {
        proxy_pass http://localhost:3000;
    }

}

server {

    server_name dev.kinomi.ru;

    location / {
        proxy_pass http://localhost:3001;
    }

}

SSL:
LetsEncrypt (certbot)

Certificates:
kinomi.ru
dev.kinomi.ru

Stored in:
/etc/letsencrypt/live/

Production routing:
kinomi.ru → localhost:3000

Development routing:
dev.kinomi.ru → localhost:3001


------------------------------------------------------------

## 5. PROCESS MANAGEMENT

Node server runs via PM2.

Production process:
name: movie-api
directory: /root/movie-backend-prod
port: 3000

pm2 start server.js --name movie-api

Development process:
name: movie-api-dev
directory: /root/movie-backend-dev
port: 3001

pm2 start server.js --name movie-api-dev

Logs:
pm2 logs movie-api

Restart:
pm2 restart movie-api

------------------------------------------------------------

## 6. BACKEND ARCHITECTURE

Entry point:
server.js

Express server exposes endpoints:
GET /health
POST /api/recommend
GET /api/image
GET /debug-env
Static frontend is served from:
/public
------------------------------------------------------------

## 7. AI RECOMMENDATION PIPELINE

Pipeline:
User filters → Backend → LLM → TMDB validation → Response

Steps:
1. User selects filters
2. Frontend sends request
3. Backend calls Groq LLM
4. LLM returns movie titles
5. Backend resolves movies via TMDB
6. Invalid movies removed
7. Valid movies returned
------------------------------------------------------------

## 8. LLM MODEL

Provider:
Groq
Model:
llama-3.1-8b-instant
Access:
Groq API is called through Cloudflare Worker proxy.

Reason:
Hide API keys from public backend.
Proxy example:

https://groq-proxy.sole-speci.workers.dev

------------------------------------------------------------

## 9. BATCH LOGIC

BATCH_SIZE = 5
LLM returns 5 titles.
Each title validated via TMDB.
If validation fails → movie removed.
Backend returns only valid movies.

------------------------------------------------------------

## 10. MOVIE VALIDATION

Movie is valid only if:
title exists
poster_path exists
Validation rule:

if (!movie.title || !movie.poster_path) {
  return null
}
------------------------------------------------------------

## 11. HISTORY SYSTEM

Two history systems exist.
### Global History
Stored in browser localStorage.
Limit:
GLOBAL_HISTORY_MAX = 200

Purpose:
Prevent repeating movies across sessions.

### Session History

Stored in backend memory.

Structure:
Map(sessionId → movieIds)

Limit:
SESSION_HISTORY_MAX = 100

Purpose:
Prevent duplicates within current session.

------------------------------------------------------------

## 12. SESSION SYSTEM
Each user receives a sessionId.

Flow:
Frontend → request
Backend → generates sessionId
Frontend → sends sessionId with next requests

Session data stored in memory.

------------------------------------------------------------

## 13. QUEUE SYSTEM
Backend generates batches of movies.

Frontend stores queue:
movieQueue = []
currentIndex = 0
Switch movie:
currentIndex++
If queue ends → backend called again.
------------------------------------------------------------

## 14. FILTER SYSTEM

Filters:
Mood
Epoch
Rating
Popularity

Filter state serialized as:
filterKey = JSON.stringify({ mood, epoch, rating, popularity })

If filterKey changes:
session history resets
------------------------------------------------------------

## 15. FRONTEND ARCHITECTURE
Single Page Application.
DOM root:
#app

Main render functions:
renderMoodScreen()
renderLoadingScreen()
renderMovie()
renderServerErrorScreen()
------------------------------------------------------------

## 16. LOADING SYSTEM

Minimum loading enforced.
MIN_LOADING = 1500ms

Wrapper:
callWithMinLoading(promiseFactory)
Ensures UI transitions remain smooth.
------------------------------------------------------------

## 17. FRONTEND STATE

Key variables:

movieQueue
currentIndex
sessionId
generateCounter
selectedMood
selectedEpoch
selectedRating
selectedPopularity

------------------------------------------------------------

## 18. UI COMPONENTS

Core components:
PrimaryButton
SecondaryCircleButton
Chip
BottomBarContainer
MovieCard

Design tokens:

--bg #161B22
--btn-primary-bg gradient
--chip-active-bg gradient

Font:
Onest

------------------------------------------------------------

## 19. ANALYTICS

Provider:
Plausible

Events:
session_started
generate_click
recommendation_loaded
change_movie_click
favorite_click
feedback_submitted
api_error

Feedback sent to Google Forms.
https://docs.google.com/forms/d/e/FORM_ID/formResponse

Fields:
entry.1289232695 → rating
entry.53559483 → text

------------------------------------------------------------

## 21. DEPLOYMENT

GitHub repository.
https://github.com/Kasatkindes/movie-backend

Branches:
main → production
develop → development
Server directories:
/root/movie-backend-prod
/root/movie-backend-dev

Deployment scripts exist on the server:
/root/deploy-prod.sh
/root/deploy-dev.sh

Development deploy:
/root/deploy-prod.sh
/root/deploy-dev.sh

Script actions:
cd /root/movie-backend-dev
git pull origin develop
pm2 restart movie-api-dev --update-env

Production deploy:
git push origin main
ssh root@server
deploy-prod

Deployment:

main branch deployed to production server.

------------------------------------------------------------

## 22. DEBUGGING

Useful commands:

Check backend:
curl http://localhost:3000/health

Check logs:
pm2 logs movie-api
Check environment:
/debug-env
–––––––––––––––––––––––––

## 23. SECURITY

Secrets stored in:
.env

Variables:
GROQ_API_KEY
TMDB_API_KEY

.env never committed to Git.
–––––––––––––––––––––––––
END OF DOCUMENT