'use strict';

const Groq = require('groq-sdk');

const MODEL = 'llama-3.1-8b-instant';
const EXCLUDE_MAX = 10;
const SESSION_HISTORY_MAX = 100;

/** Session history: sessionId -> array of original_title (exact strings) of all movies shown. Backend-only, in-memory. */
const sessionStore = new Map();

/** Per-session queue of pre-fetched recommendations. Refill via LLM when empty. */
const sessionQueue = new Map();

/** Per-session filter signature. When it changes, history and queue are reset. */
const sessionParams = new Map();
const BATCH_SIZE = 5;

function normalizeTitle(s) {
  return (s == null ? '' : String(s)).trim().toLowerCase();
}

function getSessionHistory(sessionId) {
  if (!sessionId) return [];
  var arr = sessionStore.get(sessionId);
  return Array.isArray(arr) ? arr : [];
}

/** Adds one original_title to history. Stores exact string; dedup by normalized comparison. */
function addToSessionHistory(sessionId, originalTitle) {
  if (!sessionId || originalTitle == null || !String(originalTitle).trim()) return;
  var exact = String(originalTitle).trim();
  var arr = getSessionHistory(sessionId);
  var norm = normalizeTitle(exact);
  if (arr.some(function (t) { return normalizeTitle(t) === norm; })) return;
  arr.push(exact);
  if (arr.length > SESSION_HISTORY_MAX) arr.splice(0, arr.length - SESSION_HISTORY_MAX);
  sessionStore.set(sessionId, arr);
}

function isInHistory(sessionId, normalizedTitle) {
  var arr = getSessionHistory(sessionId);
  return arr.some(function (t) { return normalizeTitle(t) === normalizedTitle; });
}

/** Last EXCLUDE_MAX original_title strings for LLM exclude. Used only at refill. */
function getExcludeList(sessionId) {
  return getSessionHistory(sessionId).slice(-EXCLUDE_MAX);
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

Правила описания: пиши коротко, разговорным тоном, атмосферу и послевкусие. Не пересказывай сюжет целиком. Название фильма не выдумывай и не включай в текст описания — только метаданные в полях.

Популярность: gold — только иконические фильмы; middle — крепкое кино не из топ-250; underground — нишевое, фестивальное. Если не указано — предпочитай middle/underground.

---

НАЗВАНИЯ ФИЛЬМОВ (ОБЯЗАТЕЛЬНО):
- original_title — оригинальное, каноническое название на английском (как в IMDb/TMDB).
- ru_title — ТОЛЬКО официальное русское название: прокат, постеры, кинотеатры, IMDb/TMDB/Wikipedia. Никакого дословного или смыслового перевода, никаких придуманных или адаптированных названий. Если официального русского названия нет или ты не уверен в нём — верни ru_title = "очко". Это обязательно. Лучше "очко", чем неверное название.

СТРОГО ЗАПРЕЩЕНО:
- переводить название дословно или по смыслу;
- придумывать или адаптировать русское название;
- возвращать приблизительный или «логичный» перевод.

---

Формат ответа (STRICT):
Верни РОВНО 5 РАЗНЫХ фильмов. Строго один JSON без markdown и текста до/после. Не добавляй других полей.

{
  "movies": [
    {
      "original_title": "Exact English canonical movie title",
      "ru_title": "Официальное русское название ИЛИ очко",
      "year": 2010,
      "description": "Short description.",
      "rating": "7.5",
      "genres": "Drama",
      "ageLimit": "16+"
    }
  ]
}

Поля каждого элемента: original_title, ru_title, year, description, rating, genres, ageLimit. country — опционально.
- ru_title: только официальное русское название; иначе строго "очко".
- Список exclude — ЗАПРЕЩЕНО возвращать эти фильмы в массиве.`;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function toRecommendation(parsed) {
  var originalTitle = parsed && (parsed.original_title != null || parsed.originalTitle != null) ? String(parsed.original_title || parsed.originalTitle).trim() : '';
  var ruTitle = parsed && (parsed.ru_title != null || parsed.ruTitle != null) ? String(parsed.ru_title || parsed.ruTitle).trim() : '';
  if (ruTitle === 'очко' || !ruTitle) ruTitle = '';
  var title = ruTitle || originalTitle;
  return {
    title: title,
    original_title: originalTitle,
    ru_title: ruTitle || null,
    description: parsed && parsed.description != null ? String(parsed.description) : '',
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

/** Fallback when no valid recommendations from batch. Same shape as toRecommendation output. */
var FALLBACK_RECOMMENDATION = {
  title: 'Побег из Шоушенка',
  original_title: 'The Shawshank Redemption',
  ru_title: 'Побег из Шоушенка',
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

    var signature = JSON.stringify({ mood: mood || null, epoch: epoch || null, rating: rating || null, popularity: popularity || null });
    var storedSignature = sessionParams.get(sessionId);
    if (storedSignature !== undefined && storedSignature !== signature) {
      sessionStore.delete(sessionId);
      sessionQueue.delete(sessionId);
    }
    sessionParams.set(sessionId, signature);

    var queue = sessionQueue.get(sessionId);
    if (!Array.isArray(queue)) queue = [];
    if (queue.length > 0) {
      var next = queue.shift();
      sessionQueue.set(sessionId, queue);
      addToSessionHistory(sessionId, next.original_title);
      res.status(200).json({ recommendation: next, sessionId: sessionId });
      return;
    }

    var excludeList = getExcludeList(sessionId);
    var likedBlock = '';
    if (likedMovies.length > 0) {
      likedBlock = '\n\nUser liked these movies:\n• ' + likedMovies.slice(0, 30).join('\n• ') + '\n\nWhen generating recommendations, take these preferences slightly into account. Do not repeat the same movies.';
    }

    function buildUserMessage(excludeTitles) {
      var excludePart = '';
      if (Array.isArray(excludeTitles) && excludeTitles.length > 0) {
        excludePart = '\n\nНе включай в массив фильмы из списка (уже показаны в этой сессии): ' + excludeTitles.join(', ') + '.';
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
      addToSessionHistory(sessionId, FALLBACK_RECOMMENDATION.original_title);
      res.status(200).json({ recommendation: FALLBACK_RECOMMENDATION, sessionId: sessionId });
      return;
    }
    var one = recommendations.shift();
    sessionQueue.set(sessionId, recommendations);
    addToSessionHistory(sessionId, one.original_title);
    res.status(200).json({ recommendation: one, sessionId: sessionId });
  } catch (err) {
    console.error('GROQ ERROR:', err);
    res.status(500).json({ error: err.message || 'Recommendation failed', details: 'Check Groq API Key or Quota' });
  }
};
