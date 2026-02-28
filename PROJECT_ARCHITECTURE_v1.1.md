# PROJECT: Kinomi

AI Movie Recommendation App  
Version: 1.1

------------------------------------------------------------------------

## 1. OVERVIEW

Frontend: Vanilla JS (SPA)  
Backend: Serverless (Vercel)  
LLM: Groq (llama-3.1-8b-instant)  
Metadata: TMDB  
Analytics: Plausible  
Feedback: Google Forms  

------------------------------------------------------------------------

## 2. FRONTEND ARCHITECTURE

Single Page Application.

DOM Root:

::: {#app}
:::

Main render functions:
- renderMoodScreen()
- renderLoadingScreen()
- renderMovie()
- renderMovieCardFinal()
- renderServerErrorScreen()

Centralized loading wrapper:
- callWithMinLoading(promiseFactory)

------------------------------------------------------------------------

## 3. FLOW

1. User selects mood, epoch, rating, popularity.
2. Clicks "Подобрать фильм".
3. onFindMovieClick() is called.
4. renderLoadingScreen()
5. callWithMinLoading()
6. POST /api/recommend
7. Backend returns: { recommendations: [], sessionId }
8. movieQueue = recommendations  
   currentIndex = 0  
   renderMovie(movieQueue[0])

LLM retry and TMDB validation are fully handled by backend.

------------------------------------------------------------------------

## 4. QUEUE LOGIC

Frontend:

var movieQueue = []  
var currentIndex = 0  

If currentIndex >= movieQueue.length → new request to backend.

IMPORTANT:

Switching inside batch ("Поменяй"):
- renderLoadingScreen()
- callWithMinLoading(() => Promise.resolve(movieQueue[currentIndex]))
- then renderMovie()

Minimum loading applies even when switching inside batch.

------------------------------------------------------------------------

## 5. STRICT MOVIE VALIDATION (CRITICAL)

Movie is valid ONLY if TMDB returns:
- title (required)
- poster_path (required)

If missing → return null.

Allowed to be missing:
- year
- rating
- country
- genres
- ageLimit
- overview

Backend (resolveMovieViaTmdb):

if (!movieData || !movieData.title || !movieData.poster_path) {
  return null;
}

------------------------------------------------------------------------

## 6. LLM RETRY LOGIC (CRITICAL)

Maximum 2 attempts.

Retry happens ONLY if:
- LLM returned valid JSON
- After TMDB resolution recommendations.length === 0

If LLM returns null (error) → no retry (server error).

If both attempts return 0 valid movies → backend returns empty array.

Frontend does NOT know about retry.

------------------------------------------------------------------------

## 7. REMOVED: "Название недоступно"

Frontend fallback completely removed.

displayTitle = finalData.title || rec.original_title || ""

Backend guarantees title exists.

Using string "Название недоступно" is strictly forbidden.

------------------------------------------------------------------------

## 8. IF NO MOVIE RETURNED

If recommendations array is empty:

Text:
"Не удалось получить фильм из каталога. Попробуйте ещё раз."

Button:
"Подобрать фильм"

Word "подборка" is not used in UI.

------------------------------------------------------------------------

## 9. HISTORY

Global History (localStorage):
- Max 200 movies.
- Oldest removed when exceeded.

Session History (backend):
- Stored in Map(sessionId → normalized titles)
- Max 100 movies.
- Prevents duplicates in session.

------------------------------------------------------------------------

## 10. sessionId

- Created by backend.
- Returned to frontend.
- Sent back with next request.
- Used to manage session history and filter resets.

------------------------------------------------------------------------

## 11. filterKey

JSON.stringify({ mood, epoch, rating, popularity })

If filters change:
- Session history reset
- Queue reset

------------------------------------------------------------------------

## 12. BATCH SIZE

BATCH_SIZE = 5

LLM always returns 5 movies per request.

Per batch:
- Up to 5 TMDB search requests
- Up to 5 TMDB movie/{id} requests

------------------------------------------------------------------------

## 13. MINIMUM LOADING (CRITICAL)

MIN_LOADING = 1500ms

Rule:

duration = max(1500ms, real execution time)

Applies ALWAYS:
- "Подобрать фильм"
- Retry from error screen
- New batch
- Switching inside batch ("Поменяй")
- Any backend call
- Any transition between movies

Loading must be centralized through:

callWithMinLoading(promiseFactory)

Multiple independent delay implementations are forbidden.

------------------------------------------------------------------------

## 14. CRITICAL CONTRACT

1. API contract cannot change without explicit task.
2. Response format cannot change without explicit task.
3. SYSTEM_PROMPT cannot change without explicit task.
4. Strict validation (title + poster) cannot be removed.
5. LLM retry logic cannot be removed or expanded without architecture update.
6. SESSION_HISTORY_MAX = 100.
7. GLOBAL_HISTORY_MAX = 200.
8. BATCH_SIZE = 5.
9. Minimum loading = 1500ms in ALL scenarios.
10. Word "подборка" not used in UI.
11. String "Название недоступно" forbidden.

------------------------------------------------------------------------

END OF DOCUMENT