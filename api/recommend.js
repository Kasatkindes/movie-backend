'use strict';

const GROQ_PROXY_URL = 'https://groq-proxy.sole-speci.workers.dev';
const MODEL = 'llama-3.1-8b-instant';
const EXCLUDE_MAX = 10;
const SESSION_HISTORY_MAX = 100;
const BATCH_SIZE = 5;

/** In-memory session storage: sessionId -> array of tmdb_id (numbers or strings). */
const sessionStore = new Map();

/** Per-session queue of pre-fetched recommendations. Refill via LLM when empty. */
const sessionQueue = new Map();

/** Per-session last filter key. When it changes, history and queue are reset. */
const sessionFilterKey = new Map();

function normalizeTitle(s) {
  return (s == null ? '' : String(s)).trim().toLowerCase();
}

function normId(id) {
  if (id == null) return '';
  var n = Number(id);
  return isNaN(n) ? String(id) : n;
}

function getSessionHistory(sessionId) {
  if (!sessionId) return [];
  var arr = sessionStore.get(sessionId);
  return Array.isArray(arr) ? arr : [];
}

function addToSessionHistory(sessionId, tmdbId) {
  if (!sessionId || (tmdbId != null && String(tmdbId).trim() === '')) return;
  var id = normId(tmdbId);
  if (id === '' || id === 'NaN') return;
  var arr = getSessionHistory(sessionId);
  if (!arr.some(function (x) { return normId(x) === id; })) arr.push(tmdbId);
  if (arr.length > SESSION_HISTORY_MAX) arr.splice(0, arr.length - SESSION_HISTORY_MAX);
  sessionStore.set(sessionId, arr);
}

function isInHistory(sessionId, tmdbId) {
  if (!sessionId || tmdbId == null) return false;
  var id = normId(tmdbId);
  if (id === '' || id === 'NaN') return false;
  return getSessionHistory(sessionId).some(function (x) { return normId(x) === id; });
}

function containsCyrillic(str) {
  return /[а-яё]/i.test(str);
}

const SYSTEM_PROMPT = `
You are a film curator. Your task is to select films based on the user's emotional state and desired psychological outcome — not by genre labels.

GENERAL SELECTION PRINCIPLE:
You choose films by EXPERIENCE and AFTER-EFFECT, not by surface genre.
If a film may produce the opposite emotional result — it is strictly forbidden.
If uncertain — choose another film.
Do not interpret moods broadly.

Use the following precise interpretations:

------------------------------------------------------------
MOOD: laugh

GOAL:
The user wants fast, effortless laughter and emotional lightness.
JOB TO BE DONE:
When mentally overloaded or simply wanting a mood boost, the user needs a film that generates easy humor without emotional heaviness.

SELECTION RULES:
- Comedy must dominate. 
- Humor must work without deep dramatic immersion.
- Light tone.

FORBIDDEN:
- Heavy drama with occasional jokes.
- Tragic endings.
- Emotionally draining films.

------------------------------------------------------------
MOOD: romance

GOAL:
Warmth, intimacy, emotional closeness.

JOB TO BE DONE:
When seeking emotional connection (alone or with a partner), the user wants a safe, tender romantic atmosphere.

SELECTION RULES:
- Romantic relationship must be central.
- Warm, emotionally safe tone.
- Pleasant to watch together.

FORBIDDEN:
- Toxic relationships.
- Emotional abuse.
- Dominant anxiety or destructive conflict.
- Heavy tragic breakups.

------------------------------------------------------------
MOOD: think

GOAL:
Intellectual stimulation and reflection.

JOB TO BE DONE:
When wanting mental engagement, the user wants ambiguity, ideas, and space for interpretation.

SELECTION RULES:
- Raises questions about meaning, morality, identity.
- Open or thought-provoking structure.
- Not purely emotional spectacle.

FORBIDDEN:
- Pure blockbuster spectacle.
- Overly simplistic moral lessons.
- Fully explained narratives with no ambiguity.

------------------------------------------------------------
MOOD: zone

GOAL:
Immersion and escape from reality.

JOB TO BE DONE:
When tired of daily stress, the user wants atmosphere that absorbs attention without intense analysis.

SELECTION RULES:
- Atmosphere over plot.
- Strong visual or sound immersion.
- Smooth emotional flow.

FORBIDDEN:
- Puzzle-heavy nonlinear films.
- Constant intellectual decoding.
- Aggressive horror tension.

------------------------------------------------------------
MOOD: horror

GOAL:
Fear, adrenaline, sustained tension.

SELECTION RULES:
- Dominant atmosphere of danger or dread.
- Psychological pressure or strong suspense.
- Emotional discomfort is expected.

FORBIDDEN:
- Comedy horror.
- Light thrillers without real fear.
- Pure gore without suspense.
- Films where fear is secondary.

------------------------------------------------------------
MOOD: inspire

GOAL:
Internal momentum and motivation.

JOB TO BE DONE:
When feeling stuck or low-energy, the user wants a story of growth, resilience, or overcoming obstacles.

SELECTION RULES:
- Clear arc of transformation.
- Emotional uplift.
- Forward movement.

FORBIDDEN:
- Cynical endings.
- Hopeless narratives.
- Emotionally exhausting tragedies.

------------------------------------------------------------
MOOD: cry

GOAL:
Emotional release through empathy.

JOB TO BE DONE:
When emotionally tense or melancholic, the user wants genuine tears through human vulnerability.

SELECTION RULES:
- Human-centered story.
- Gradual emotional build.
- Empathy-driven sadness.

FORBIDDEN:
- Horror.
- Action.
- Adventure spectacle.
- Shock-only sadness without emotional depth.

------------------------------------------------------------
MOOD: sleep

GOAL:
Deep relaxation or falling asleep.

JOB TO BE DONE:
When tired or overstimulated, the user wants minimal cognitive demand and low emotional intensity.

SELECTION RULES:
- Slow pacing.
- Low conflict.
- Soft tone.
- Predictable or secondary plot acceptable.

ABSOLUTE FORBIDDEN:
- Blockbusters.
- Franchises.
- Action films.
- Wars, explosions, dinosaurs, epic spectacle.
- High-tension drama.
- Horror.

------------------------------------------------------------
MOOD: explore

GOAL:
High-quality discovery beyond mainstream canon.

SELECTION RULES:
- Avoid obvious classics by default.
- Prefer strong but non-canonical films.
- Diversity in country, era, style.

-----------------------------------------------------------------------

CRITICAL TITLE CONTRACT (keep unchanged below).
RESPONSE FORMAT (keep unchanged below).

-----------------------------------------------------------------------

CRITICAL TITLE CONTRACT (MANDATORY):
1. The model MUST return ONLY the original English title in the field original_title.
2. DO NOT translate titles into any language.
3. DO NOT invent, approximate, localize or reinterpret titles.
4. If not fully confident in the exact canonical title — choose another film.
5. Returning an uncertain or made-up title is strictly forbidden.
6. original_title must match the canonical IMDb/TMDB English title exactly.

TITLE LANGUAGE (STRICT):
- Movie titles MUST be returned strictly in their original English title.
- Never translate titles into Russian.
- Never localize titles.
- Do not return localized versions.
- If the film is non-English, return its official international English title.
- Always include release year in the JSON as a separate field if available.

---

RESPONSE FORMAT (STRICT):
Return EXACTLY 5 DIFFERENT films.
Only real films (IMDb/TMDB).
Return ONLY one JSON object. No markdown. No text before or after.

{
  "movies": [
    {
      "title": "Exact English canonical movie title",
      "year": 1967
    }
  ]
}

- movies: array of exactly 5 objects.
- Each object: "title" (required, English canonical as on IMDb/TMDB), "year" (optional number, for search precision only).
- Do NOT include rating, country, genres, ageLimit — metadata comes from TMDB only.
- Exclude list is strictly forbidden to appear in results.
`;

const TMDB_IMAGE_BASE = 'https://image.tmdb.org';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/** Resolve one movie title via TMDB: search then /movie/{id} ru-RU. Returns canonical object or null. */
async function resolveMovieViaTmdb(title, apiKey, year) {
  if (!title || !String(title).trim() || !apiKey) return null;
  var query = encodeURIComponent(String(title).trim());
  var triedFallback = false;
  try {
    for (var attempt = 0; attempt < 2; attempt++) {
      var searchUrl;
      if (triedFallback) {
        console.log('TMDB FALLBACK (en-US) triggered for:', title);
        searchUrl = 'https://api.themoviedb.org/3/search/movie?api_key=' + apiKey + '&query=' + query + '&language=en-US&include_adult=false';
      } else {
        searchUrl = 'https://api.themoviedb.org/3/search/movie?api_key=' + apiKey + '&query=' + query;
        if (year) searchUrl += '&year=' + year;
      }
      console.group('🔎 TMDB SEARCH');
      console.log('Search title:', title);
      console.log('Search year:', year);
      console.log('Search URL:', searchUrl);
      console.groupEnd();
      var searchRes = await fetch(searchUrl);
      if (!searchRes.ok) return null;
      var searchData = await searchRes.json();
      console.log('DEBUG: TMDB results count:', searchData.results ? searchData.results.length : 0);
      console.group('📦 TMDB SEARCH RESULTS');
      console.log('Results count:', searchData.results ? searchData.results.length : 0);
      console.log('Results:', searchData.results);
      console.groupEnd();
      if (!searchData.results || !searchData.results.length) {
        if (triedFallback) return null;
        triedFallback = true;
        continue;
      }
      var exactMatch = searchData.results.find(function (r) {
        return normalizeTitle(r.original_title) === normalizeTitle(title);
      });
      var first = exactMatch || searchData.results[0];
      console.log('Chosen candidate:', first);
      var tmdbId = first.id;
      if (tmdbId == null) {
        if (triedFallback) return null;
        triedFallback = true;
        continue;
      }

      var movieUrl = 'https://api.themoviedb.org/3/movie/' + tmdbId + '?api_key=' + apiKey + '&language=ru-RU';
      var movieRes = await fetch(movieUrl);
      if (!movieRes.ok) return null;
      var movieData = await movieRes.json();
      if (!movieData || !movieData.title || !movieData.poster_path) {
        if (triedFallback) return null;
        triedFallback = true;
        continue;
      }

      var posterPath = movieData.poster_path;
      var backdropPath = movieData.backdrop_path;
      var overview = movieData.overview && String(movieData.overview).trim() ? String(movieData.overview).trim() : '';

      var backdropUrl = movieData.backdrop_path
        ? TMDB_IMAGE_BASE + '/t/p/w1280' + movieData.backdrop_path
        : null;
      var posterUrl = movieData.poster_path
        ? TMDB_IMAGE_BASE + '/t/p/w780' + movieData.poster_path
        : null;

      var yearOut = movieData.release_date
        ? parseInt(String(movieData.release_date).split('-')[0], 10)
        : null;
      if (yearOut != null && isNaN(yearOut)) yearOut = null;

      var rating = movieData.vote_average
        ? String(Math.round(movieData.vote_average * 10) / 10)
        : null;

      var country = movieData.production_countries && movieData.production_countries.length
        ? movieData.production_countries.map(function (c) { return c.name; }).join(', ')
        : null;

      var genres = movieData.genres && movieData.genres.length
        ? movieData.genres.map(function (g) { return g.name; }).join(', ')
        : null;

      var ageLimit = movieData.adult === true ? '18+' : '12+';

      return {
        tmdb_id: tmdbId,
        title: movieData.title || movieData.original_title || title,
        original_title: movieData.original_title || movieData.title || title,
        overview: overview,
        backdrop_url: backdropUrl,
        poster_url: posterUrl,
        year: yearOut,
        rating: rating,
        country: country,
        genres: genres,
        ageLimit: ageLimit
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || typeof apiKey !== 'string') {
      res.status(500).json({ error: 'GROQ_API_KEY not set', details: 'Check Groq API Key or Quota' });
      return;
    }
    const tmdbApiKey = process.env.TMDB_API_KEY || '';

    let mood = null, epoch = null, rating = null, popularity = null, likedMovies = [], sessionId = null, globalHistory = [];
    const rawBody = req.body ?? {};
    try {
      const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : (typeof rawBody === 'object' && rawBody !== null ? rawBody : {});
      if (body && typeof body === 'object') {
        const { mood: m, epoch: e, rating: r, popularity: p, likedMovies: lm, sessionId: sid, globalHistory: gh } = body;
        mood = m; epoch = e; rating = r; popularity = p;
        likedMovies = Array.isArray(lm) ? lm : [];
        sessionId = sid != null && String(sid).trim() ? String(sid).trim() : null;
        globalHistory = Array.isArray(gh) ? gh : [];
      }
    } catch (_) {}
    if (!mood || String(mood).trim() === '') mood = 'explore';
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 12);
    }

    function buildFilterKey(m, e, r, p) {
      return JSON.stringify({ mood: m || null, epoch: e || null, rating: r || null, popularity: p || null });
    }
    var currentFilterKey = buildFilterKey(mood, epoch, rating, popularity);
    var lastFilterKey = sessionFilterKey.get(sessionId);
    if (lastFilterKey !== undefined && lastFilterKey !== currentFilterKey) {
      sessionStore.set(sessionId, []);
      sessionQueue.set(sessionId, []);
    }
    sessionFilterKey.set(sessionId, currentFilterKey);

    var excludeList = (globalHistory || []).slice(-EXCLUDE_MAX);
    var likedBlock = '';
    if (likedMovies.length > 0) {
      likedBlock = '\n\nUser liked these movies:\n• ' + likedMovies.slice(0, 30).join('\n• ') + '\n\nWhen generating recommendations, take these preferences slightly into account. Do not repeat the same movies.';
    }

    /** Exclude when refilling batch. excludeList = session history + globalHistory, capped. */
    function buildUserMessage(excludeList) {
      var excludePart = '';
      if (Array.isArray(excludeList) && excludeList.length > 0) {
        var lastN = excludeList.slice(-EXCLUDE_MAX);
        excludePart = '\n\nНе включай в массив movies фильмы из списка (уже показаны в этой сессии): ' + lastN.join(', ') + '. Только названия, без годов и описаний.';
      }
      return `Подбери 5 разных фильмов. Настроение: ${mood || 'любое'}. Эпоха: ${epoch || 'любая'}. Рейтинг: ${rating || 'любой'}. Популярность: ${popularity || 'любая'}.${excludePart}${likedBlock} Ответь только JSON в указанном формате (массив movies из 5 элементов).`;
    }

    var recommendations = [];

    for (var attempt = 0; attempt < 2; attempt++) {
      console.log('DEBUG: Calling Groq with payload:', { mood, epoch, rating, popularity });
      var raw = null;
      try {
        var messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(excludeList) }
        ];
        var response = await fetch(GROQ_PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: MODEL,
            messages: messages,
            response_format: { type: 'json_object' },
            temperature: 0.6,
            max_tokens: 2000
          })
        });
        if (!response.ok) {
          console.error('DEBUG: Worker returned non-OK status', response.status);
          console.error(await response.text());
        } else {
          var data = await response.json();
          if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('DEBUG: Invalid Groq response structure', data);
          } else {
            var content = data.choices[0].message.content;
            console.log('DEBUG: GROQ RAW CONTENT:');
            console.log(content);
            if (!content || typeof content !== 'string') {
              console.error('DEBUG: GROQ returned empty or non-string content:', content);
            } else if (!content.trim()) {
              // empty string
            } else {
              try {
                raw = JSON.parse(content);
                console.log('DEBUG: GROQ PARSED JSON:');
                console.log(raw);
              } catch (parseErr) {
                console.error('DEBUG: GROQ JSON PARSE ERROR', parseErr);
              }
            }
          }
        }
      } catch (err) {
        console.error('DEBUG: GROQ REQUEST FAILED:');
        console.error(err);
        if (err && err.response) {
          console.error('DEBUG: GROQ RESPONSE STATUS:', err.response.status);
          console.error('DEBUG: GROQ RESPONSE DATA:', err.response.data);
        }
      }

      if (!raw) break;

      var list = (raw && raw.movies && Array.isArray(raw.movies)) ? raw.movies : [];
      console.log('DEBUG: Parsed movie list:', list);
      console.group('🎬 LLM RAW OUTPUT');
      console.log('Raw LLM JSON:', raw);
      console.log('Raw movies array:', list);
      console.log('Count from LLM:', list.length);
      console.groupEnd();

      var globalNorm = (globalHistory || []).map(function (t) { return normalizeTitle(t); });
      var seenTitles = {};
      var titlesToResolve = [];
      for (var i = 0; i < list.length && titlesToResolve.length < BATCH_SIZE; i++) {
        var item = list[i];
        var title = (item && (item.title != null || item.original_title != null)) ? String(item.title || item.original_title).trim() : '';
        if (!title) continue;
        var key = normalizeTitle(title);
        if (seenTitles[key]) continue;
        seenTitles[key] = true;
        if (globalNorm.indexOf(key) !== -1) continue;
        titlesToResolve.push(title);
      }

      console.group('🧹 AFTER TITLE FILTERING');
      console.log('Titles to resolve:', titlesToResolve);
      console.log('Session history:', getSessionHistory(sessionId));
      console.log('Global history:', globalHistory);
      console.groupEnd();

      var seenIds = {};
      recommendations = [];
      for (var t = 0; t < titlesToResolve.length; t++) {
        var llmItem = list.find(function (x) {
          var xt = (x && (x.title != null || x.original_title != null)) ? String(x.title || x.original_title).trim() : '';
          return xt && normalizeTitle(xt) === normalizeTitle(titlesToResolve[t]);
        });
        var year = llmItem && llmItem.year != null ? llmItem.year : null;
        console.log('DEBUG: Searching TMDB for:', titlesToResolve[t]);
        var resolved = await resolveMovieViaTmdb(titlesToResolve[t], tmdbApiKey, year);
        if (resolved) {
          console.log('✅ RESOLVED MOVIE:', resolved);
        } else {
          console.log('❌ SKIPPED (TMDB failed or filtered):', titlesToResolve[t]);
        }
        if (!resolved) continue;
        if (isInHistory(sessionId, resolved.tmdb_id)) continue;
        if (seenIds[normId(resolved.tmdb_id)]) continue;
        seenIds[normId(resolved.tmdb_id)] = true;
        recommendations.push(resolved);
      }

      console.log('DEBUG: After filtering count:', recommendations.length);
      if (recommendations.length > 0) break;
    }

    for (var r = 0; r < recommendations.length; r++) {
      addToSessionHistory(sessionId, recommendations[r].tmdb_id);
    }
    console.group('🚀 FINAL RESPONSE');
    console.log('DEBUG: FINAL recommendations:', recommendations);
    console.log('Resolved recommendations:', recommendations);
    console.log('Count returned to frontend:', recommendations.length);
    console.groupEnd();
    res.status(200).json({ recommendations: recommendations, sessionId: sessionId });
  } catch (err) {
    console.error('GROQ ERROR:', err);
    res.status(500).json({ error: err.message || 'Recommendation failed', details: 'Check Groq API Key or Quota' });
  }
};
