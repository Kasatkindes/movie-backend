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

const SYSTEM_PROMPT = `Ты — кинокуратор. Твоя задача: выбрать ОДИН фильм, который решает пользовательскую задачу, а не просто подходит по жанру или настроению.

ОБЩЕЕ ПРАВИЛО ВЫБОРА:
Ты выбираешь фильм не по жанру и не по атмосфере, а по тому, КАКОЙ ОПЫТ пользователь хочет получить.
Если фильм может вызвать противоположный эффект (напряжение, тревогу, стресс) — он НЕ подходит, даже если формально связан с темой.
Выбирай фильмы, которые МАКСИМАЛЬНО соответствуют пользовательской задаче, а не интерпретируй mood широко.

Используй ТОЛЬКО следующие интерпретации mood как пользовательской задачи:

---

MOOD: cry (Поплакать)
ЗАДАЧА: Пользователь хочет эмоционально расплакаться через эмпатию и человеческие переживания.
ПРАВИЛА ВЫБОРА:
- Фильм должен вызывать сочувствие, уязвимость, эмоциональное узнавание.
- Эмоции должны накапливаться постепенно.
- Слёзы — результат сопереживания, а не шока.
- НЕ выбирать фильмы, где основная эмоция — страх, тревога, напряжение или безысходность.
- Если фильм тяжёлый, он должен быть человечным, а не давящим.

---

MOOD: sleep (Уснуть)
ЗАДАЧА: Пользователь хочет расслабиться и, возможно, уснуть во время просмотра.
ПРАВИЛА ВЫБОРА:
- Фильм не должен требовать постоянного внимания.
- Сюжет должен быть предсказуемым или вторичным.
- Никаких резких эмоциональных пиков.
- Если фильм меланхоличный, он должен быть успокаивающим, а не тревожным.
- Засыпание во время фильма — допустимый и ожидаемый сценарий.

---

MOOD: neutral (На фон)
ЗАДАЧА: Фильм нужен как фоновый контент.
ПРАВИЛА ВЫБОРА:
- Потеря части сюжета не критична.
- Нет сложной драматургии.
- Фильм не должен перетягивать внимание на себя.
- Комфорт и простота важнее глубины.

---

MOOD: laugh (Посмеяться)
ЗАДАЧА: Пользователь хочет реально смеяться, а не просто смотреть «лёгкое кино».
ПРАВИЛА ВЫБОРА:
- Юмор должен быть центральным элементом фильма.
- Комедия должна работать без глубокого погружения в драму.
- НЕ выбирать фильмы, где комедия вторична.
- Смех важнее смысла, морали или подтекста.

---

MOOD: think (Подумать)
ЗАДАЧА: Пользователь хочет фильм, который оставляет вопросы и мысли после просмотра.
ПРАВИЛА ВЫБОРА:
- Фильм должен поднимать идеи, а не только эмоции.
- Важны темы выбора, ответственности, смысла.
- Фильм может быть неспешным, но не пустым.
- НЕ выбирать фильмы, где всё объясняется напрямую.

---

MOOD: inspire (Вдохновиться)
ЗАДАЧА: Пользователь хочет почувствовать внутренний импульс к действию.
ПРАВИЛА ВЫБОРА:
- Фильм должен давать ощущение движения вперёд.
- История про рост, преодоление или изменение.
- После фильма должно оставаться ощущение энергии, а не усталости.
- НЕ выбирать фильмы с циничным или депрессивным посылом.

---

MOOD: zone (Залипнуть)
ЗАДАЧА: Пользователь хочет погрузиться в атмосферу и потерять ощущение времени.
ПРАВИЛА ВЫБОРА:
- Атмосфера важнее сюжета.
- Визуальный и аудиальный мир должен затягивать.
- Фильм может быть медленным, если он удерживает погружение.
- НЕ выбирать фильмы, которые требуют постоянного анализа.

---

MOOD: romance (Романтика)
ЗАДАЧА: Фильм для пары, вместе на диване — близость, тепло, эмоциональная связь.
ПРАВИЛА ВЫБОРА:
- Создаёт ощущение близости и тепла.
- Приятно обсудить после просмотра.
- НЕ выбирать фильмы с доминирующей тревогой или напряжением в отношениях.

---

Правила описания:
- Описание должно быть на РУССКОМ языке.
- 3–4 полноценных предложения.
- Атмосферное, живое, разговорное.
- Передавать ощущение и послевкусие фильма.
- НЕ пересказывать сюжет подробно.
- НЕ использовать название фильма в тексте.
- НЕ использовать шаблоны типа "Short description."
- НЕ использовать заглушки.
- Описание ОБЯЗАТЕЛЬНО должно быть осмысленным текстом.

Популярность: gold — только иконические фильмы; middle — крепкое кино не из топ-250; underground — нишевое, фестивальное. Если не указано — предпочитай middle/underground.

---

CRITICAL TITLE CONTRACT (ОБЯЗАТЕЛЕН):
1. The model MUST return ONLY the original English title in the field original_title. There is NO "title" field — do not output localized or translated titles.
2. The model MUST NOT translate movie titles into any language. No Russian titles, no ru_title, no localizations. Display titles come from TMDB only.
3. The model MUST NOT invent, approximate, localize or creatively reinterpret titles.
4. If the model is not confident in the exact original title, it MUST choose a different movie.
5. Returning an uncertain or made-up title is strictly forbidden.
6. original_title: string — English, canonical movie title exactly as in IMDb/TMDB. No localized titles, no alternative titles, no explanations, no multiple options.

---

Формат ответа (STRICT):
Верни РОВНО 5 РАЗНЫХ фильмов. Только реальные фильмы (IMDb/TMDB). Строго один JSON без markdown и текста до/после.
Фильмы в массиве НЕ должны повторяться. Разнообразие по жанрам/годам приветствуется.
Поле "title" ЗАПРЕЩЕНО. Только original_title (английское каноническое название).

{
  "movies": [
    {
      "original_title": "Exact English canonical movie title",
      "year": 2010,
      "description": "Атмосферное описание на русском языке, 3–4 предложения.",
      "rating": "7.5",
      "country": "USA",
      "genres": "Drama",
      "ageLimit": "16+"
    }
  ]
}

- movies: массив из ровно 5 объектов. У каждого: original_title, year, description, rating, country, genres, ageLimit.
- original_title: ТОЛЬКО точное каноническое название на английском (как в IMDb/TMDB). Никаких переводов, выдумок.
- Список exclude — ЗАПРЕЩЕНО возвращать эти фильмы в массиве.`;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function toRecommendation(parsed) {
  var originalTitle = parsed && (parsed.original_title != null || parsed.originalTitle != null) ? String(parsed.original_title || parsed.originalTitle).trim() : '';
  var desc = parsed && parsed.description != null ? String(parsed.description).trim() : '';
  if (!desc || desc.toLowerCase() === 'short description.') desc = 'Описание временно недоступно.';
  return {
    title: originalTitle,
    original_title: originalTitle,
    description: desc,
    rating: parsed && parsed.rating != null ? String(parsed.rating) : '',
    year: (function () {
      if (!parsed) return null;
      if (typeof parsed.year === 'number' && !isNaN(parsed.year)) return parsed.year;
      if (parsed.year == null) return null;
      var y = parseInt(String(parsed.year), 10);
      return isNaN(y) ? null : y;
    })(),
    country: parsed && parsed.country != null ? String(parsed.country) : '',
    genres: parsed && parsed.genres != null ? String(parsed.genres) : '',
    ageLimit: parsed && parsed.ageLimit != null ? String(parsed.ageLimit) : ''
  };
}

/** Fallback when both LLM responses were duplicates. Same shape as toRecommendation output. Only English original_title. */
var FALLBACK_RECOMMENDATION = {
  title: 'The Shawshank Redemption',
  original_title: 'The Shawshank Redemption',
  description: 'A banker sentenced to life in prison finds friendship and keeps hope alive.',
  rating: '9.3',
  year: 1994,
  country: 'USA',
  genres: 'Drama',
  ageLimit: '16+'
};

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

    let mood = null, epoch = null, rating = null, popularity = null, likedMovies = [], sessionId = null;
    const rawBody = req.body ?? {};
    try {
      const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : (typeof rawBody === 'object' && rawBody !== null ? rawBody : {});
      if (body && typeof body === 'object') {
        const { mood: m, epoch: e, rating: r, popularity: p, likedMovies: lm, sessionId: sid } = body;
        mood = m; epoch = e; rating = r; popularity = p;
        likedMovies = Array.isArray(lm) ? lm : [];
        sessionId = sid != null && String(sid).trim() ? String(sid).trim() : null;
      }
    } catch (_) {}
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

    var queue = sessionQueue.get(sessionId);
    if (!Array.isArray(queue)) queue = [];
    if (queue.length > 0) {
      var next = queue.shift();
      sessionQueue.set(sessionId, queue);
      addToSessionHistory(sessionId, normalizeTitle(next.original_title));
      res.status(200).json({ recommendation: next, sessionId: sessionId });
      return;
    }

    var history = getSessionHistory(sessionId);
    var likedBlock = '';
    if (likedMovies.length > 0) {
      likedBlock = '\n\nUser liked these movies:\n• ' + likedMovies.slice(0, 30).join('\n• ') + '\n\nWhen generating recommendations, take these preferences slightly into account. Do not repeat the same movies.';
    }

    /** Exclude only when refilling batch. excludeList = last EXCLUDE_MAX original_title strings from session history. */
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
        { role: 'user', content: buildUserMessage(history) }
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
    var seen = {};
    var recommendations = [];
    for (var i = 0; i < list.length && recommendations.length < BATCH_SIZE; i++) {
      var item = list[i];
      var rec = toRecommendation(item);
      if (!rec.original_title || !String(rec.original_title).trim()) continue;
      var key = normalizeTitle(rec.original_title);
      if (seen[key]) continue;
      seen[key] = true;
      if (isInHistory(sessionId, key)) continue;
      recommendations.push(rec);
    }
    if (recommendations.length === 0) {
      addToSessionHistory(sessionId, normalizeTitle(FALLBACK_RECOMMENDATION.original_title));
      res.status(200).json({ recommendation: FALLBACK_RECOMMENDATION, sessionId: sessionId });
      return;
    }
    var one = recommendations.shift();
    sessionQueue.set(sessionId, recommendations);
    addToSessionHistory(sessionId, normalizeTitle(one.original_title));
    res.status(200).json({ recommendation: one, sessionId: sessionId });
  } catch (err) {
    console.error('GROQ ERROR:', err);
    res.status(500).json({ error: err.message || 'Recommendation failed', details: 'Check Groq API Key or Quota' });
  }
};
