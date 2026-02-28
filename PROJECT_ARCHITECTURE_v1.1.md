# PROJECT: Kinomi

AI Movie Recommendation App Version: 1.1

------------------------------------------------------------------------

## 1. OVERVIEW

Frontend: Vanilla JS (SPA)\
Backend: Serverless (Vercel)\
LLM: Groq (llama-3.1-8b-instant)\
Metadata: TMDB\
Analytics: Plausible\
Feedback: Google Forms

------------------------------------------------------------------------

## 2. FRONTEND ARCHITECTURE

Single Page Application.

DOM Root:

::: {#app}
:::

Main render functions: - renderMoodScreen() - renderLoadingScreen() -
renderMovie() - renderMovieCardFinal() - renderServerErrorScreen()

------------------------------------------------------------------------

## 3. FLOW

1.  User selects mood, epoch, rating, popularity.
2.  Clicks "Подобрать фильм".
3.  onFindMovieClick() is called.
4.  renderLoadingScreen()
5.  POST /api/recommend
6.  Backend returns: { recommendations: \[\], sessionId }
7.  movieQueue = recommendations currentIndex = 0
    renderMovie(movieQueue\[0\])

------------------------------------------------------------------------

## 4. QUEUE LOGIC

Frontend: var movieQueue = \[\] var currentIndex = 0

If currentIndex \>= movieQueue.length → new request to backend.

------------------------------------------------------------------------

## 5. STRICT MOVIE VALIDATION (CRITICAL)

Movie is valid ONLY if TMDB returns: - title (required) - poster_path
(required)

If missing → return null.

Allowed to be missing: - year - rating - country - genres - ageLimit -
overview

Backend (resolveMovieViaTmdb): if (!movieData \|\| !movieData.title \|\|
!movieData.poster_path) { return null; }

------------------------------------------------------------------------

## 6. REMOVED: "Название недоступно"

Frontend fallback removed. displayTitle = finalData.title \|\|
rec.original_title

Backend guarantees title exists.

------------------------------------------------------------------------

## 7. IF NO MOVIE RETURNED

If recommendations array is empty:

Text: "Не удалось получить фильм из каталога. Попробуйте ещё раз."

Button: "Подобрать фильм"

No word "подборка" in UI.

------------------------------------------------------------------------

## 8. HISTORY

Global History (localStorage): - Max 200 movies. - Oldest removed when
exceeded.

Session History (backend): - Stored in Map(sessionId → normalized
titles) - Max 100 movies. - Prevents duplicates in session.

------------------------------------------------------------------------

## 9. sessionId

-   Created by backend.
-   Returned to frontend.
-   Sent back with next request.

------------------------------------------------------------------------

## 10. filterKey

JSON.stringify({ mood, epoch, rating, popularity })

If filters change: - Session history reset - Queue reset

------------------------------------------------------------------------

## 11. TMDB REQUESTS

Per batch (5 movies): - Up to 5 search requests - Up to 5 movie/{id}
requests

------------------------------------------------------------------------

## 12. CRITICAL CONTRACT

1.  API contract cannot change without explicit task.
2.  Response format cannot change without explicit task.
3.  SYSTEM_PROMPT cannot change without explicit task.
4.  Strict validation (title + poster) cannot be removed.
5.  Queue logic cannot change without architecture update.
6.  Word "подборка" not used in UI.

------------------------------------------------------------------------

END OF DOCUMENT
