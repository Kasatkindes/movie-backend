'use strict';

const Groq = require('groq-sdk');

const MODEL = 'llama-3.1-8b-instant';
const EXCLUDE_MAX = 10;
const SESSION_HISTORY_MAX = 100;
const BATCH_SIZE = 5;

/** In-memory session storage: sessionId -> array of normalized original_title (all movies shown in this session). */
const sessionStore = new Map();

/** Per-session queue of pre-fetched recommendations. Refill via LLM when empty. */
const sessionQueue = new Map();

/** Per-session last filter key. When it changes, history and queue are reset. */
const sessionFilterKey = new Map();

function normalizeTitle(s) {
  return (s == null ? '' : String(s)).trim().toLowerCase();
}

function getSessionHistory(sessionId) {
  if (!sessionId) return [];
  var arr = sessionStore.get(sessionId);
  return Array.isArray(arr) ? arr : [];
}

function addToSessionHistory(sessionId, normalizedTitle) {
  if (!sessionId || !normalizedTitle) return;
  var arr = getSessionHistory(sessionId);
  if (arr.indexOf(normalizedTitle) === -1) arr.push(normalizedTitle);
  if (arr.length > SESSION_HISTORY_MAX) arr.splice(0, arr.length - SESSION_HISTORY_MAX);
  sessionStore.set(sessionId, arr);
}

function isInHistory(sessionId, normalizedTitle) {
  return getSessionHistory(sessionId).indexOf(normalizedTitle) !== -1;
}

function containsCyrillic(str) {
  return /[а-яё]/i.test(str);
}

const SYSTEM_PROMPT = `
You are a film curator. Your task is to choose ONE film that solves the user's emotional goal — not just something that matches genre or mood superficially.

GENERAL SELECTION RULE:
You choose films not by genre or atmosphere, but by the EXPERIENCE the user wants to have.
STRICT CONTROL: If a film may produce an emotional effect opposite to the selected mood — it is FORBIDDEN. If in doubt — choose another film.
Select films that MAXIMALLY align with the user's goal. Do not interpret moods broadly.

Use ONLY the following interpretations of mood as the user's emotional goal:

---

MOOD: cry
GOAL: The user wants to emotionally cry through empathy and human vulnerability.
SELECTION RULES:
- The film must evoke compassion, vulnerability, emotional recognition.
- Emotions should build gradually.
- Tears must come from empathy, not shock.
- DO NOT choose films where the main emotion is fear, anxiety, tension, or hopelessness.
- If the film is heavy, it must feel human, not oppressive.
FORBIDDEN: cruelty without catharsis, hopelessness without emotional release, shock scenes purely for tears.

---

MOOD: sleep
GOAL: The user wants to relax and possibly fall asleep during the movie.
SELECTION RULES:
- The film must not demand constant attention.
- The plot should be predictable or secondary.
- No sharp emotional spikes.
- If melancholic, it must be calming, not disturbing.
- Falling asleep during the film is acceptable and expected.
FORBIDDEN: anxiety, tension, rapid editing, suspense, horror, emotionally stressful dramas.

---

MOOD: neutral
GOAL: Background content.
SELECTION RULES:
- Missing parts of the plot is not critical.
- No complex dramaturgy.
- The film must not aggressively demand attention.
- Comfort and simplicity over depth.

---

MOOD: laugh
GOAL: The user wants to genuinely laugh.
SELECTION RULES:
- Comedy must be the central element.
- The humor must work without deep dramatic immersion.
- DO NOT choose films where comedy is secondary.
- Laughter is more important than meaning, moral, or subtext.

---

MOOD: think
GOAL: The user wants a film that leaves questions and reflections.
SELECTION RULES:
- The film must raise ideas, not just emotions.
- Themes of choice, responsibility, meaning are important.
- It may be slow, but not empty.
- DO NOT choose films where everything is explained directly.

---

MOOD: inspire
GOAL: The user wants to feel internal momentum toward action.
SELECTION RULES:
- The film must create a sense of forward movement.
- Story about growth, overcoming, transformation.
- After the film there should be energy, not emotional exhaustion.
- DO NOT choose films with cynical or depressive messages.
FORBIDDEN: cynical endings, depressive stories, hopeless narratives, dark dystopias without hope.

---

MOOD: zone
GOAL: The user wants to immerse into atmosphere and lose sense of time.
SELECTION RULES:
- Atmosphere is more important than plot.
- Visual and auditory world must be immersive.
- Slow films are acceptable if immersion is strong.
- DO NOT choose films that require constant analysis.
FORBIDDEN: puzzle-heavy films, nonlinear complexity, films that require intellectual decoding.

---

MOOD: romance
GOAL: A film for a couple watching together — intimacy, warmth, emotional connection.
SELECTION RULES:
- Must create a feeling of closeness and warmth.
- Pleasant to discuss after watching.
- DO NOT choose films dominated by anxiety or conflict within relationships.

---

MOOD: explore
Used when no mood is selected.
GOAL: Recommendations as discovery — less obvious, not overused, high quality but non-canonical.
SELECTION RULES:
- DO NOT recommend films from IMDb/TMDB Top-250 (see popularity rule below).
- DO NOT recommend obvious classics widely known to mainstream audiences (Shawshank Redemption, Amélie, Forrest Gump, The Godfather, Schindler's List, etc.).
- Focus on strong but non-canonical films.
- Diversity in countries, decades, and genres is encouraged.
- Top-250 films in explore mode are allowed only with ~7% probability (1 in 12–15 recommendations).

---

POPULARITY RULE:
- popularity = "gold": iconic and Top-250 films are allowed.
- popularity != "gold": Top-250 films are FORBIDDEN by default. Rare probabilistic allowance (~7%) only.

POPULARITY AND TOP-250 RULE:
- popularity = "gold": iconic films and Top-250 titles are allowed. Canonical and obvious classics are acceptable.
- popularity != "gold" (middle, underground, or not specified): Films from IMDb/TMDB Top-250 are FORBIDDEN by default. A rare probabilistic allowance (~7% of recommendations) is acceptable, but no more. Prefer middle/underground cinema: strong films outside Top-250, niche, festival-oriented, less mainstream.

---

CRITICAL TITLE CONTRACT (MANDATORY):
1. The model MUST return ONLY the original English title in the field original_title.
2. DO NOT translate titles into any language.
3. DO NOT invent, approximate, localize or reinterpret titles.
4. If not fully confident in the exact canonical title — choose another film.
5. Returning an uncertain or made-up title is strictly forbidden.
6. original_title must match the canonical IMDb/TMDB English title exactly.

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
  var searchUrl = 'https://api.themoviedb.org/3/search/movie?api_key=' + apiKey + '&query=' + query;
  if (year) searchUrl += '&year=' + year;
  console.group('🔎 TMDB SEARCH');
  console.log('Search title:', title);
  console.log('Search year:', year);
  console.log('Search URL:', searchUrl);
  console.groupEnd();
  try {
    var searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    var searchData = await searchRes.json();
    console.group('📦 TMDB SEARCH RESULTS');
    console.log('Results count:', searchData.results ? searchData.results.length : 0);
    console.log('Results:', searchData.results);
    console.groupEnd();
    if (!searchData.results || !searchData.results.length) return null;
    var exactMatch = searchData.results.find(function (r) {
      return normalizeTitle(r.original_title) === normalizeTitle(title);
    });
    var first = exactMatch || searchData.results[0];
    console.log('Chosen candidate:', first);
    var tmdbId = first.id;
    if (tmdbId == null) return null;

    var movieUrl = 'https://api.themoviedb.org/3/movie/' + tmdbId + '?api_key=' + apiKey + '&language=ru-RU';
    var movieRes = await fetch(movieUrl);
    if (!movieRes.ok) return null;
    var movieData = await movieRes.json();

    var posterPath = movieData.poster_path;
    var backdropPath = movieData.backdrop_path;
    var overview = movieData.overview && String(movieData.overview).trim() ? String(movieData.overview).trim() : '';

    var backdropUrl = movieData.backdrop_path
      ? TMDB_IMAGE_BASE + '/t/p/w1280' + movieData.backdrop_path
      : null;
    var posterUrl = movieData.poster_path
      ? TMDB_IMAGE_BASE + '/t/p/w780' + movieData.poster_path
      : null;

    var year = movieData.release_date
      ? parseInt(String(movieData.release_date).split('-')[0], 10)
      : null;
    if (year != null && isNaN(year)) year = null;

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
      year: year,
      rating: rating,
      country: country,
      genres: genres,
      ageLimit: ageLimit
    };
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

    var history = getSessionHistory(sessionId);
    var excludeList = (globalHistory || []).concat(history).slice(-EXCLUDE_MAX);
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

    const client = new Groq({ apiKey });
    var raw = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(excludeList) }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
      max_tokens: 2000
    }).then(function (completion) {
      var content = completion && completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content;
      if (typeof content !== 'string' || !content.trim()) return null;
      try {
        return JSON.parse(content);
      } catch (_) {
        return null;
      }
    }).catch(function () {
      return null;
    });

    var list = (raw && raw.movies && Array.isArray(raw.movies)) ? raw.movies : [];
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
      if (isInHistory(sessionId, key)) continue;
      if (globalNorm.indexOf(key) !== -1) continue;
      titlesToResolve.push(title);
    }

    console.group('🧹 AFTER TITLE FILTERING');
    console.log('Titles to resolve:', titlesToResolve);
    console.log('Session history:', history);
    console.log('Global history:', globalHistory);
    console.groupEnd();

    var recommendations = [];
    var seenIds = {};
    for (var t = 0; t < titlesToResolve.length; t++) {
      var llmItem = list.find(function (x) {
        var xt = (x && (x.title != null || x.original_title != null)) ? String(x.title || x.original_title).trim() : '';
        return xt && normalizeTitle(xt) === normalizeTitle(titlesToResolve[t]);
      });
      var year = llmItem && llmItem.year != null ? llmItem.year : null;
      var resolved = await resolveMovieViaTmdb(titlesToResolve[t], tmdbApiKey, year);
      if (resolved) {
        console.log('✅ RESOLVED MOVIE:', resolved);
      } else {
        console.log('❌ SKIPPED (TMDB failed or filtered):', titlesToResolve[t]);
      }
      if (!resolved) continue;
      if (seenIds[resolved.tmdb_id]) continue;
      seenIds[resolved.tmdb_id] = true;
      recommendations.push(resolved);
    }

    for (var r = 0; r < recommendations.length; r++) {
      addToSessionHistory(sessionId, normalizeTitle(recommendations[r].title));
    }
    console.group('🚀 FINAL RESPONSE');
    console.log('Resolved recommendations:', recommendations);
    console.log('Count returned to frontend:', recommendations.length);
    console.groupEnd();
    res.status(200).json({ recommendations: recommendations, sessionId: sessionId });
  } catch (err) {
    console.error('GROQ ERROR:', err);
    res.status(500).json({ error: err.message || 'Recommendation failed', details: 'Check Groq API Key or Quota' });
  }
};
