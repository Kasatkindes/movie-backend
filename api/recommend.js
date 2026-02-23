/**
 * Normalizes AI response to strict frontend contract.
 * Never returns raw AI output. Fills missing fields with defaults.
 * @param {unknown} raw - Raw parsed AI response
 * @param {string} rawText - Raw AI response text (for debugging)
 * @returns {{ movie: object, reason: string }}
 */
function normalizeToContract(raw, rawText) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  const m = obj.movie && typeof obj.movie === 'object' ? obj.movie : {};

  const toNum = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : typeof v === 'string' ? parseFloat(v) || 0 : 0);
  const toStr = (v) => (v != null && String(v).trim() ? String(v).trim() : '');
  const toArr = (v) => {
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    if (v != null && typeof v === 'string') return v.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
    return [];
  };

  const rawDesc = toStr(m.description);
  const debugSuffix = rawText ? `\n\n[DEBUG: raw AI response]\n${rawText}` : '';

  const movie = {
    title: toStr(m.title) || 'Без названия',
    year: Math.max(1900, Math.min(2100, toNum(m.year) || new Date().getFullYear())),
    imdb: Math.max(0, Math.min(10, toNum(m.imdb) || 0)),
    ageRating: toStr(m.ageRating) || '0+',
    genres: toArr(m.genres).length ? toArr(m.genres) : ['Драма'],
    countries: Array.isArray(m.countries)
      ? m.countries.map((x) => String(x).trim()).filter(Boolean)
      : m.country
        ? [String(m.country).trim()].filter(Boolean)
        : ['США'],
    description: rawDesc ? rawDesc + debugSuffix : 'Нет описания.' + debugSuffix
  };

  const reason = toStr(obj.reason) || 'Подобрано по вашему настроению';

  return { movie, reason };
}

function safeParseJson(content) {
  if (typeof content !== 'string') return null;
  const trimmed = content.trim();
  const stripped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mood, epoch, rating } = req.body || {};

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        temperature: 0.8,
        messages: [
          {
            role: 'system',
            content: 'You are a movie recommendation engine. Respond ONLY with valid JSON. No explanations.'
          },
          {
            role: 'user',
            content: `
Return a movie recommendation in Russian.

STRICT JSON FORMAT:
{
  "movie": {
    "title": "string",
    "year": number,
    "countries": ["string"],
    "genres": ["string"],
    "ageRating": "string",
    "imdb": number,
    "description": "string"
  },
  "reason": "string"
}

Mood: ${mood || 'any'}
Era: ${epoch || 'any'}
Minimum IMDb: ${rating || 'any'}
`
          }
        ]
      })
    });

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content ?? '';

    if (!rawText) {
      return res.status(502).json({ error: 'Empty AI response' });
    }

    const parsed = safeParseJson(rawText);
    const normalized = normalizeToContract(parsed, rawText);

    return res.status(200).json(normalized);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'AI error' });
  }
}
