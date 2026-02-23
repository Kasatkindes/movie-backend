const Groq = require('groq-sdk').default || require('groq-sdk');

const MODEL = 'llama3-8b-8192';

const SYSTEM_PROMPT = `Ты — сервис подбора фильмов. Отвечай ТОЛЬКО валидным JSON без markdown и пояснений.
Формат ответа (строго придерживайся):
{"title":"Название фильма на русском","description":"Краткое описание 2-4 предложения.","rating":"7.5","year":2010,"country":"США","genres":"Драма, Комедия","ageLimit":"16+"}
Поля: title (строка), description (строка), rating (строка, число с точкой), year (число), country (строка), genres (строка через запятую), ageLimit (строка, например 0+ или 16+).`;

function allowCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  allowCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GROQ_API_KEY not configured' });
    return;
  }

  let body = {};
  try {
    if (req.method === 'POST' && req.body) body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (_) {}

  const mood = body.mood || null;
  const epoch = body.epoch || null;
  const rating = body.rating || null;
  const exclude = Array.isArray(body.exclude) ? body.exclude : [];

  const userPrompt = `Подбери один фильм. Настроение: ${mood || 'любое'}. Эпоха: ${epoch || 'любая'}. Рейтинг: ${rating || 'любой'}. Не предлагай: ${exclude.length ? exclude.join(', ') : '—'}. Ответь только JSON в указанном формате.`;

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1024
    });

    const raw = completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content;
    if (!raw || typeof raw !== 'string') {
      res.status(502).json({ error: 'Empty model response' });
      return;
    }

    const parsed = JSON.parse(raw);
    const rec = {
      title: parsed.title != null ? String(parsed.title) : '',
      description: parsed.description != null ? String(parsed.description) : '',
      rating: parsed.rating != null ? String(parsed.rating) : '',
      year: typeof parsed.year === 'number' ? parsed.year : (parsed.year != null ? parseInt(String(parsed.year), 10) : null),
      country: parsed.country != null ? String(parsed.country) : '',
      genres: parsed.genres != null ? String(parsed.genres) : '',
      ageLimit: parsed.ageLimit != null ? String(parsed.ageLimit) : ''
    };

    res.status(200).json({ recommendation: rec });
  } catch (err) {
    console.error('recommend error', err);
    res.status(500).json({ error: err.message || 'Recommendation failed' });
  }
};
