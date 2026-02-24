'use strict';

var DESCRIPTION_SYSTEM_PROMPT = "Ты — скептичный киноэссеист в стиле блогера ЧБУ. Твоя задача: написать описание фильма. Будто ты сидишь на кухне с корешами и вообще не стесняешься в сравнениях и прочим. ПРичем в тебя уже залито пару пив .\n\nОБЪЕМ: Строго 2-3 предложения. Не больше и не меньше.";

/**
 * Build user message with movie data for description generation.
 * @param {{ title: string, plotContext: string }} opts
 * @returns {string}
 */
function buildDescriptionUserMessage(opts) {
  var title = (opts && opts.title != null) ? String(opts.title).trim() : '';
  var plotContext = (opts && opts.plotContext != null) ? String(opts.plotContext).trim() : '—';
  return 'Сгенерируй только текст описания для фильма: ' + title + '.\nКонтекст: ' + plotContext + '.';
}

module.exports = DESCRIPTION_SYSTEM_PROMPT;
module.exports.DESCRIPTION_SYSTEM_PROMPT = DESCRIPTION_SYSTEM_PROMPT;
module.exports.buildDescriptionUserMessage = buildDescriptionUserMessage;
