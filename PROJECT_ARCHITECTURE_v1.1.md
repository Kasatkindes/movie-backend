# PROJECT: Kinomi

AI Movie Recommendation App  
Version: 1.2

------------------------------------------------------------------------

## 1. OVERVIEW

Frontend: Vanilla JS (SPA)  
Backend: Serverless (Vercel)  
LLM: Groq (llama-3.1-8b-instant)  
Metadata: TMDB  
Analytics: Plausible  
Feedback: Google Forms  

Session storage:
- In-memory Map on backend
- sessionId-based isolation

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

All async transitions must pass through callWithMinLoading.

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

Backend fully handles:
- LLM generation
- Duplicate filtering
- TMDB resolution
- Retry logic
- Session history
- Filter reset

Frontend never performs movie validation.

------------------------------------------------------------------------

## 4. QUEUE LOGIC

Frontend:

var movieQueue = []  
var currentIndex = 0  

If currentIndex >= movieQueue.length → new backend request.

Switching inside batch ("Сменить"):
- currentIndex++
- renderLoadingScreen()
- callWithMinLoading(() => Promise.resolve(movieQueue[currentIndex]))
- then renderMovie()

Queue is fully replaced on each backend response.

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
- backdrop_path

Backend validation (resolveMovieViaTmdb):

if (!movieData || !movieData.title || !movieData.poster_path) {
  return null;
}

Validation happens before adding to recommendations.

------------------------------------------------------------------------

## 6. LLM RETRY LOGIC (CRITICAL)

Maximum 2 attempts per request.

Retry happens ONLY if:
- LLM returned valid JSON
- After TMDB resolution recommendations.length === 0

If LLM returns null (error) → no retry.

If both attempts return 0 valid movies → backend returns empty array.

Frontend does NOT know about retry logic.

------------------------------------------------------------------------

## 7. LLM PROMPT CONTRACT

SYSTEM_PROMPT defines:

- Mood interpreted by emotional outcome (not genre)
- Clear GOAL + JOB TO BE DONE
- Explicit FORBIDDEN cases
- Strict canonical English title requirement

CRITICAL TITLE CONTRACT:

- Must return exact IMDb/TMDB English title
- No localization
- No approximations
- If uncertain → choose another film

Response format:

{
  "movies": [
    {
      "title": "Exact English canonical movie title",
      "year": 1967
    }
  ]
}

Exactly 5 different films.
Only JSON object.
No markdown.
No additional text.

------------------------------------------------------------------------

## 8. IF NO MOVIE RETURNED

If recommendations array is empty:

Text:

"Сейчас не удалось подобрать действительно хорошую рекомендацию. Показывать случайный фильм не хочется. Попробуйте ещё раз."

Button:
"Подобрать фильм"

Word "подборка" is not used in UI.

------------------------------------------------------------------------

## 9. HISTORY

Global History (localStorage):
- Max 200 movies.
- Oldest removed when exceeded.
- Used as soft exclude hint for LLM.

Session History (backend):
- Stored in Map(sessionId → tmdb_id array)
- Max 100 movies.
- Duplicate prevention based strictly on tmdb_id
- Not based on title comparison

Duplicates are filtered by:
- tmdb_id equality

------------------------------------------------------------------------

## 10. sessionId

- Created by backend if not provided.
- Returned to frontend.
- Sent back with next request.
- Used for:
  - Session history
  - Queue isolation
  - Filter reset logic

Session data is fully isolated per sessionId.

------------------------------------------------------------------------

## 11. filterKey

filterKey = JSON.stringify({ mood, epoch, rating, popularity })

If filterKey changes:
- Session history reset
- Session queue reset

Ensures no cross-filter contamination.

------------------------------------------------------------------------

## 12. BATCH SIZE

BATCH_SIZE = 5

LLM always returns 5 movies per request.

Per batch:
- Up to 5 TMDB search requests
- Up to 5 TMDB movie/{id} requests

Only successfully resolved movies are returned.

------------------------------------------------------------------------

## 13. MINIMUM LOADING (CRITICAL)

MIN_LOADING = 1500ms

Rule:

duration = max(1500ms, real execution time)

Applies ALWAYS:
- "Подобрать фильм"
- Retry from error screen
- New batch
- Switching inside batch ("Сменить")
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
12. Duplicate filtering must use tmdb_id, not title.
13. Exactly 5 movies must be requested from LLM.

------------------------------------------------------------------------

## 15. RELEASE & DEPLOYMENT PROCESS (CRITICAL)

Hosting: Vercel  
Repository: GitHub  
Branching model: main + develop  

### 15.1 Branch Strategy

main  
- Production branch  
- Connected to Production deployment in Vercel  
- Protected by GitHub rules (Pull Request required)  
- Direct pushes forbidden  

develop  
- Staging / Preview branch  
- Automatically deployed by Vercel as Preview  
- Used for all feature development  

Hotfix branches  
- Created from main when urgent production fix required  
- Merged into main via Pull Request  
- Then merged back into develop  

------------------------------------------------------------------------

### 15.2 Deployment Rules

Production deploy happens ONLY when:
- Pull Request is merged into main

Preview deploy happens automatically when:
- Any commit is pushed to develop
- Any new branch is pushed

No manual production edits allowed.

------------------------------------------------------------------------

### 15.3 Release Workflow

1. Work in develop
2. Test on Vercel Preview
3. Create Pull Request: develop → main
4. Merge
5. Production auto-deploy

Version tagging:
- v1.1
- v1.2
- etc.

------------------------------------------------------------------------

### 15.4 Emergency Hotfix Workflow

1. git checkout main
2. git checkout -b hotfix/fix-name
3. Apply fix
4. Push branch
5. Create Pull Request → main
6. Merge → auto deploy
7. Merge main back into develop

------------------------------------------------------------------------

### 15.5 Critical Rules

1. Never develop directly in main.
2. Never deploy manually from local machine.
3. All production changes must go through Pull Request.
4. main branch must remain stable at all times.
5. Preview is used for testing only.

---------------------------

## 16. ANALYTICS & FEEDBACK

Analytics: Plausible  
Feedback: Google Forms  

Analytics events:

- session_started
- mood_selected
- generate_click
- recommendation_loaded
- change_movie_click
- favorite_click
- feedback_submitted
- api_error
- no_results

Key props:
- mood
- filters (epoch, rating, popularity)
- generate_index
- load_time_ms

------------------------------------------------------------------------

### Feedback (Technical)

Google Form ID:
1FAIpQLSdKzsSIUqjkuYpxOP1CjllnDerG9kMW7YYBNXiF-WG4cQhKNQ

POST endpoint:
https://docs.google.com/forms/d/e/FORM_ID/formResponse

Method:
POST, mode: "no-cors",
Content-Type: application/x-www-form-urlencoded

Field IDs:
- entry.1289232695 (rating)
- entry.53559483 (text)

Feedback modal:
- Shown after generateCounter threshold
- On submit → sent to Google Forms + feedback_submitted event
- On submit → not shown again
- On close → hidden for 48 hours

---------------------------

17. UI STATE (SHORT)

UI основан на CSS-токенах и переиспользуемых компонентах.

Tokens:
	•	–bg: #161B22
	•	–btn-primary-bg: фиолетовый gradient
	•	–chip-active-bg: жёлто-розовый gradient
	•	Meta text: rgba(255,255,255,0.6)
	•	Font: Onest

Core Components:
	•	PrimaryButton — 56px, radius 28px, основной CTA.
	•	SecondaryCircleButton — 56x56, liquid style (Back / Favorite / Info).
	•	Chip — 48px, variant: default / primary (mood).
	•	BottomBarContainer — фиксированный нижний контейнер (общий).
	•	Movie Card — backdrop 16:9, desc #242A34, title 24px, text 16px.

Navigation Update:

Главный экран:
	•	BottomBarContainer содержит 2 элемента:
	1.	SecondaryCircleButton (Info)
	2.	PrimaryButton (“Подобрать фильм”)

Info Button:
	•	Открывает renderInfoScreen()
	•	Без async
	•	Без callWithMinLoading
	•	Не изменяет sessionId, queue или filters

Info Screen:
	•	Отдельный renderInfoScreen()
	•	Использует BottomBarContainer
	•	PrimaryButton: “Назад к выбору фильма”
	•	Возвращает к renderMoodScreen()
	•	State не сбрасывается

Rules:
	1.	Навигация экранов управляется только render-функциями.
	2.	InfoScreen не влияет на queue, history или фильтры.
	3.	Все кнопки — только через UI-компоненты.
	4.	BottomBarContainer единый для всех экранов.
	5.	Inline-стили запрещены.

---------------------------

END OF DOCUMENT