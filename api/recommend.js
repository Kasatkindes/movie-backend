'use strict';

const Groq = require('groq-sdk');

const MODEL = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `Ты — сервис подбора фильмов. Выдай ОДИН фильм строго в формате JSON.
Если в запросе передан список "exclude" — КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО возвращать фильмы из этого списка. Дай один фильм под указанные фильтры, кроме списка exclude.
Только реальные фильмы (IMDb/TMDB). Один JSON-объект без markdown. Формат:
{"title":"Название на русском","original_title":"Original Title","description":"Краткое описание.","rating":"7.5","year":2010,"country":"США","genres":"Драма","ageLimit":"16+"}
Поля: title, original_title, description, rating, year, country, genres, ageLimit.`;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function toRecommendation(parsed) {
  return {
    title: parsed && parsed.title != null ? String(parsed.title) : '',
    original_title: parsed && (parsed.original_title != null || parsed.originalTitle != null) ? String(parsed.original_title || parsed.originalTitle) : '',
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

    let mood = null, epoch = null, rating = null, exclude = [];
    const rawBody = req.body ?? {};
    try {
      const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : (typeof rawBody === 'object' && rawBody !== null ? rawBody : {});
      if (body && typeof body === 'object') {
        mood = body.mood;
        epoch = body.epoch;
        rating = body.rating;
        exclude = Array.isArray(body.exclude) ? body.exclude : [];
      }
    } catch (_) {}

    const userMessage = `Подбери один фильм. Настроение: ${mood || 'любое'}. Эпоха: ${epoch || 'любая'}. Рейтинг: ${rating || 'любой'}. Исключить (запрещено предлагать): ${exclude.length ? exclude.slice(0, 50).join(', ') : '—'}. Ответь только JSON в указанном формате.`;

    const client = new Groq({ apiKey });
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
      max_tokens: 800
    });

    const content = completion?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      res.status(502).json({ error: 'Empty Groq response' });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (_) {
      res.status(502).json({ error: 'Invalid JSON from model' });
      return;
    }

    const recommendation = toRecommendation(parsed);
    res.status(200).json({ recommendation });
  } catch (err) {
    console.error('GROQ ERROR:', err);
    res.status(500).json({ error: err.message || 'Recommendation failed', details: 'Check Groq API Key or Quota' });
  }
};
