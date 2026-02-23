'use strict';

// Groq SDK: default export in ESM becomes .default in CommonJS
const Groq = require('groq-sdk').default || require('groq-sdk');

const MODEL = 'llama3-8b-8192';

const JSON_SCHEMA = `Ответь ТОЛЬКО одним JSON-объектом без markdown и текста до/после. Формат строго:
{"title":"Название на русском","description":"Описание 2-4 предложения.","rating":"7.5","year":2010,"country":"США","genres":"Драма, Комедия","ageLimit":"16+"}
Поля: title, description (строка), rating (строка, например 7.5), year (число), country (строка), genres (строка), ageLimit (строка: 0+, 6+, 12+, 16+, 18+).`;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function toRecommendation(parsed) {
  return {
    title: parsed && parsed.title != null ? String(parsed.title) : '',
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || typeof apiKey !== 'string') {
    res.status(500).json({ error: 'GROQ_API_KEY not set' });
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

  const userMessage = `Подбери один фильм. Настроение: ${mood || 'любое'}. Эпоха: ${epoch || 'любая'}. Рейтинг: ${rating || 'любой'}. Не предлагать: ${exclude.length ? exclude.slice(0, 20).join(', ') : '—'}. Ответь только JSON в указанном формате.`;

  try {
    const client = new Groq({ apiKey });
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: JSON_SCHEMA },
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
    console.error('[api/recommend]', err);
    res.status(500).json({ error: err.message || 'Recommendation failed' });
  }
};
