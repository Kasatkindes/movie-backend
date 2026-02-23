const Groq = require('groq-sdk');

// Инициализируем Groq с твоим ключом из настроек Vercel
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

module.exports = async (req, res) => {
  // Настройка заголовков, чтобы браузер не блокировал запрос (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Ответ на предварительный запрос браузера
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mood, epoch, rating } = req.body || {};

    // Запрос к нейронке через официальную библиотеку Groq
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: 'You are a movie recommendation engine. Respond ONLY with valid JSON in Russian.' 
        },
        { 
          role: 'user', 
          content: `Порекомендуй фильм на русском языке. Настроение: ${mood}, Эпоха: ${epoch}, Мин. рейтинг: ${rating}. 
          Верни ТОЛЬКО JSON формат: {"movie": {"title": "Название", "year": 2024, "countries": ["Страна"], "genres": ["Жанр"], "ageRating": "18+", "imdb": 8.5, "description": "Описание"}, "reason": "Почему подходит"}` 
        }
      ],
      model: 'llama3-8b-8192', // Используем модель Groq
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.status(200).json(result);
  } catch (error) {
    console.error('Ошибка бэкенда:', error);
    res.status(502).json({ error: 'Ошибка нейронки', details: error.message });
  }
};