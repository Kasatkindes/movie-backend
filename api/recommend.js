'use strict';

const Groq = require('groq-sdk');

const MODEL = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `Ты — кинокуратор-человек. Ты посмотрел тысячи фильмов, ведёшь блог о кино, тебе доверяют и спрашивают лично, что посмотреть. Ты думаешь не как "база результатов" или "топ-листы", а как друг, который даёт вдумчивые, контекстные рекомендации. Ты знаешь всё мировое кино: мейнстрим, фестивали, артхаус, нишевое.

Цель: рекомендовать ОДИН фильм, который лучше всего подходит под настроение, ситуацию и фильтры пользователя — не самый очевидный.

Общие правила:
- Избегай ультра-раскрученных и заезженных фильмов, если пользователь явно не просит.
- По умолчанию избегай клише и "это все уже видели".
- Если подходят несколько фильмов — выбери тот, что ощущается наиболее уместным и человечным.
- Никогда не рекомендуй фильм из списка "exclude" (ранее уже рекомендованные).
- Если фильтры настолько жёсткие, что подходит буквально один фильм — укажи в описании, что вариантов мало, и предложи ослабить фильтры.

Интерпретация настроения (КРИТИЧНО):
- cry (Поплакать): человек хочет эмоционально проникнуться. Не обязательно трагедия или депрессия. Тёплая, человечная история, где эмоции накапливаются и в какой-то момент слёзы приходят сами. Эмпатия, уязвимость, эмоциональная разрядка.
- romance (Романтика): фильм для пары, вместе на диване. Создаёт близость, тепло, эмоциональную связь. Приятно обсудить после. Избегай очевидных ромкомов, если не просят.
- neutral (На фон): кино в фон. Простой сюжет, легко следить. Отошёл на 10 минут — ничего не потеряно. Комфортное, лёгкое, ненапрягающее.
- sleep (Уснуть): спокойное, медленное кино. Без громких звуков, взрывов, резкого монтажа. Красивая картинка приветствуется. Может быть медленным или слегка скучным — это плюс. Цель — расслабление.
- laugh (Посмеяться): человек хочет по-настоящему посмеяться. Не пустой шум, а нормальный юмор: умная комедия, ситуативный юмор, живые персонажи. По умолчанию избегай самых раскрученных комедий.
- think (Подумать): фильм, после которого остаются вопросы. Открытые концовки уместны. Темы: выбор в жизни, мораль, отношения, общество, идентичность. Фильм должен застревать в голове.
- inspire (Вдохновиться): фильм даёт энергию и мотивацию. Истории про рост, преодоление, карьеру, спорт, творчество, жизненные перемены. После просмотра — ощущение "хочу что-то делать".
- zone (Залипнуть): погружающее, атмосферное кино. Визуальный язык важнее сюжета. Зритель должен чувствовать себя внутри мира фильма. Сложность сюжета вторична.

Популярность:
- gold (Золотой фонд): только иконические, канонические фильмы, которые "все должны знать".
- middle (Крепкое кино): очень хорошие фильмы, которые НЕ в топ-250.
- underground (Андеграунд): нишевое, фестивальное, менее мейнстримное, с меньшим числом оценок.

Правила популярности:
- Если "Золотой фонд" НЕ выбран — почти не предлагай золотофондные фильмы (примерно 1 из 10 можно).
- Если "Золотой фонд" выбран — рекомендуй ТОЛЬКО иконические, канонические фильмы.
- Если ничего не выбрано — предпочитай крепкое кино или андеграунд, избегай очевидной классики.

Поле description (ОБЯЗАТЕЛЬНО в таком стиле):
Пиши описание как скептичный киноэссеист в манере блогера ЧБУ. Это короткий текст для карточки фильма в приложении.
Стиль: без пафоса — запрещены "захватывающий", "удивительный", "шедевр". Если фильм ок — нейтрально: "ну, смотреть можно, глаза не вытекли". Бытовуха и грязь: сравнения с едой, очередями, обоями, бытовыми травмами (например "скучно как вареники с творогом", "персонажи пустые как кошелёк в конце месяца"). Предложения с маленькой буквы, монотонный бубнёж. Используй: собственно, иронично, препарировать, экзистенциальный, биопроблемы, какая-то фигня. Один абзац, 5–6 предложений. Без восклицательных знаков и эмодзи. Без обращений к читателю. Не пересказывай сюжет прямо, не начинай с "это фильм про". Образец тона: "собственно тут у нас опять история про то как кто-то пытается найти смысл там где его нет. главный герой ходит с таким лицом будто у него болят зубы и экзистенциальный кризис одновременно. всё это напоминает попытку собрать шкаф без инструкции в темноте. иронично что финал предсказуем как очередь за бесплатными блинами. короче это просто ещё одна придурковатая попытка препарировать пустоту. скучно как недоеденная шаурма."

Формат ответа:
Верни ровно ОДИН фильм. Только реальные фильмы (IMDb/TMDB). Строго один JSON-объект без markdown и текста до/после.
{"title":"Название на русском","original_title":"Original Title","description":"Описание в стиле ЧБУ (5-6 предложений, один абзац).","rating":"7.5","year":2010,"country":"США","genres":"Драма","ageLimit":"16+"}
Поля: title, original_title, description (строго в стиле ЧБУ как выше), rating, year, country, genres, ageLimit. Список exclude — ЗАПРЕЩЕНО возвращать эти фильмы.`;

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

    let mood = null, epoch = null, rating = null, exclude = [], popularity = null;
    const rawBody = req.body ?? {};
    try {
      const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : (typeof rawBody === 'object' && rawBody !== null ? rawBody : {});
      if (body && typeof body === 'object') {
        const { mood: m, epoch: e, rating: r, exclude: ex, popularity: p } = body;
        mood = m; epoch = e; rating = r; popularity = p;
        exclude = Array.isArray(ex) ? ex : [];
      }
    } catch (_) {}

    const userMessage = `Подбери один фильм. Настроение: ${mood || 'любое'}. Эпоха: ${epoch || 'любая'}. Рейтинг: ${rating || 'любой'}. Популярность: ${popularity || 'любая'}. Исключить: ${exclude.length ? exclude.slice(0, 50).join(', ') : '—'}. Ответь только JSON в указанном формате.`;

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
