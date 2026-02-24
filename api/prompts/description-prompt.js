'use strict';

var DESCRIPTION_SYSTEM_PROMPT = `Ты — киноэксперт, который советует фильмы друзьям.

Твоя задача — написать краткое описание фильма для карточки в рекомендательном приложении.

Правила:
- 4–5 предложений.
- Один абзац.
- Пиши естественным, живым языком.
- Коротко обозначь завязку сюжета.
- Не пересказывай весь фильм.
- Не используй пафос, громкие эпитеты или кинокритический анализ.
- Это должен быть аккуратный тизер, который вызывает интерес к просмотру.

В ответе — только текст описания.
Без кавычек.
Без вступлений.
Без пояснений.`;

/**
 * Build user message with movie data for description generation.
 * @param {{ title: string, plotContext: string }} opts
 * @returns {string}
 */
function buildDescriptionUserMessage(opts) {
  var title = (opts && opts.title != null) ? String(opts.title).trim() : '';
  var plotContext = (opts && opts.plotContext != null) ? String(opts.plotContext).trim() : '—';
  return 'Сгенерируй краткое описание фильма для карточки приложения.\nНазвание: ' + title + '.\nКонтекст сюжета: ' + plotContext + '.';
}

module.exports = DESCRIPTION_SYSTEM_PROMPT;
module.exports.DESCRIPTION_SYSTEM_PROMPT = DESCRIPTION_SYSTEM_PROMPT;
module.exports.buildDescriptionUserMessage = buildDescriptionUserMessage;
