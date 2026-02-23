'use strict';

/** @typedef {{ id: string, title: string, originalTitle: string, imdb: number, ageRating: string, year: number, countries: string[], genres: string[], moods: string[], era: string, poster: { type: string, src: string|null, aspectRatio: string }, description: string }} Movie */

const EPOCH_MAP = {
  modern: 'modern',
  '2000s': '2000s',
  '80s90s': '80-90s',
  before80: 'pre-1980',
  early: 'classic'
};

const MOVIES = [
    {
      id: '1',
      title: 'Не шутите с Зоханом!',
      originalTitle: 'You Don\'t Mess with the Zohan',
      imdb: 8.1,
      ageRating: '18+',
      year: 2008,
      countries: ['США'],
      genres: ['Комедия', 'Боевик', 'Приключения'],
      moods: ['laugh', 'zone'],
      era: '2000s',
      poster: { type: 'image', src: null, aspectRatio: '2:3' },
      description: 'Зохан — легендарный израильский боец, который устал от военных действий и мечтает стать парикмахером в Нью-Йорке. Притворившись мёртвым, он едет в Америку, чтобы осуществить свою мечту. Но его прошлое не хочет его отпускать.'
    },
    {
      id: '2',
      title: 'Начало',
      originalTitle: 'Inception',
      imdb: 8.8,
      ageRating: '12+',
      year: 2010,
      countries: ['США', 'Великобритания'],
      genres: ['Фантастика', 'Триллер', 'Драма'],
      moods: ['think', 'inspire', 'zone'],
      era: 'modern',
      poster: { type: 'image', src: null, aspectRatio: '2:3' },
      description: 'Доминик Кобб — редкий специалист по извлечению информации из снов. Его умение проникать в подсознание сделало его ценным игроком в корпоративном шпионаже. Теперь ему предлагают невероятную задачу — внедрить идею, а не украсть её.'
    },
    {
      id: '3',
      title: 'Одержимость',
      originalTitle: 'Whiplash',
      imdb: 8.5,
      ageRating: '16+',
      year: 2014,
      countries: ['США'],
      genres: ['Драма', 'Музыка'],
      moods: ['inspire', 'think', 'cry'],
      era: 'modern',
      poster: { type: 'image', src: null, aspectRatio: '2:3' },
      description: 'Амбициозный молодой барабанщик мечтает стать одним из величайших джазовых музыкантов. Жёсткий наставник толкает его к пределам возможного. Каждая репетиция превращается в битву за совершенство.'
    },
    {
      id: '4',
      title: 'Король Лев',
      originalTitle: 'The Lion King',
      imdb: 8.5,
      ageRating: '0+',
      year: 1994,
      countries: ['США'],
      genres: ['Мультфильм', 'Драма', 'Приключения'],
      moods: ['inspire', 'cry', 'romance'],
      era: '80-90s',
      poster: { type: 'image', src: null, aspectRatio: '2:3' },
      description: 'Юный львёнок Симба мечтает о дне, когда займёт место отца — короля саванны. После трагической гибели отца Симба бежит из родных земель и находит новых друзей. Но пришло время вернуться и принять свою судьбу.'
    },
    {
      id: '5',
      title: 'Побег из Шоушенка',
      originalTitle: 'The Shawshank Redemption',
      imdb: 9.3,
      ageRating: '16+',
      year: 1994,
      countries: ['США'],
      genres: ['Драма'],
      moods: ['think', 'inspire'],
      era: '80-90s',
      poster: { type: 'image', src: null, aspectRatio: '2:3' },
      description: 'Банкир Энди Дюфрейн приговорён к пожизненному заключению в тюрьме Шоушенк. Несмотря на жестокость системы, он сохраняет надежду и человеческое достоинство, меняя жизни окружающих.'
    },
    {
      id: '6',
      title: 'Форрест Гамп',
      originalTitle: 'Forrest Gump',
      imdb: 8.8,
      ageRating: '12+',
      year: 1994,
      countries: ['США'],
      genres: ['Драма', 'Романтика'],
      moods: ['laugh', 'cry', 'inspire'],
      era: '80-90s',
      poster: { type: 'image', src: null, aspectRatio: '2:3' },
      description: 'Форрест Гамп — простой человек с низким IQ, но добрым сердцем. Его жизнь пересекается с ключевыми событиями американской истории второй половины XX века.'
    },
    {
      id: '7',
      title: 'Звёздные войны: Эпизод IV',
      originalTitle: 'Star Wars: Episode IV - A New Hope',
      imdb: 8.6,
      ageRating: '12+',
      year: 1977,
      countries: ['США'],
      genres: ['Фантастика', 'Приключения', 'Боевик'],
      moods: ['inspire', 'zone'],
      era: 'pre-1980',
      poster: { type: 'image', src: null, aspectRatio: '2:3' },
      description: 'Люк Скайуокер присоединяется к повстанцам в борьбе против Галактической Империи. Вместе с ханом Соло и принцессой Лейей он должен уничтожить Звезду Смерти.'
    },
    {
      id: '8',
      title: 'Интерстеллар',
      originalTitle: 'Interstellar',
      imdb: 8.6,
      ageRating: '12+',
      year: 2014,
      countries: ['США', 'Великобритания'],
      genres: ['Фантастика', 'Драма', 'Приключения'],
      moods: ['think', 'inspire', 'cry'],
      era: 'modern',
      poster: { type: 'image', src: null, aspectRatio: '2:3' },
      description: 'Группа исследователей отправляется в космос через червоточину в поисках нового дома для человечества. Путешествие займёт годы, а на Земле время течёт иначе.'
    },
    {
      id: '9',
      title: 'Однажды в Голливуде',
      originalTitle: 'Once Upon a Time in Hollywood',
      imdb: 7.6,
      ageRating: '18+',
      year: 2019,
      countries: ['США'],
      genres: ['Драма', 'Комедия'],
      moods: ['laugh', 'zone', 'neutral'],
      era: 'modern',
      poster: { type: 'image', src: null, aspectRatio: '2:3' },
      description: 'Лос-Анджелес, 1969 год. Актриса Шэрон Тейт и её сосед — каскадёр Рик Далтон — живут в эпицентре заката золотой эры Голливуда.'
    },
    {
      id: '10',
      title: 'Бойцовский клуб',
      originalTitle: 'Fight Club',
      imdb: 8.8,
      ageRating: '18+',
      year: 1999,
      countries: ['США'],
      genres: ['Драма', 'Триллер'],
      moods: ['think', 'inspire'],
      era: '80-90s',
      poster: { type: 'image', src: null, aspectRatio: '2:3' },
      description: 'Страдающий бессонницей офисный работник встречает загадочного торговца мылом Тайлера Дёрдена. Вместе они создают подпольный бойцовский клуб.'
    },
    {
      id: '11',
      title: 'Паразиты',
      originalTitle: 'Gisaengchung',
      imdb: 8.5,
      ageRating: '16+',
      year: 2019,
      countries: ['Южная Корея'],
      genres: ['Драма', 'Триллер', 'Комедия'],
      moods: ['think', 'laugh', 'cry'],
      era: 'modern',
      poster: { type: 'image', src: null, aspectRatio: '2:3' },
      description: 'Семья Ки-тхэка живёт в подвале и перебивается случайными заработками. Случайная возможность устроиться в богатый дом переворачивает их жизнь.'
    },
    {
      id: '12',
      title: 'Крестный отец',
      originalTitle: 'The Godfather',
      imdb: 9.2,
      ageRating: '18+',
      year: 1972,
      countries: ['США'],
      genres: ['Драма', 'Криминал'],
      moods: ['think'],
      era: 'pre-1980',
      poster: { type: 'image', src: null, aspectRatio: '2:3' },
      description: 'Семья Корлеоне — одна из могущественных мафиозных семей Америки. Дон Вито передаёт дело младшему сыну Майклу, который не хотел быть частью этого мира.'
    },
    {
      id: '13',
      title: 'Отступники',
      originalTitle: 'The Departed',
      imdb: 8.5,
      ageRating: '18+',
      year: 2006,
      countries: ['США'],
      genres: ['Драма', 'Триллер', 'Криминал'],
      moods: ['think', 'zone'],
      era: '2000s',
      poster: { type: 'image', src: null, aspectRatio: '2:3' },
      description: 'В полиции Бостона внедряют крота мафии, а в мафию — крота полиции. Оба пытаются вычислить друг друга, не раскрыв себя.'
    },
    {
      id: '14',
      title: 'Титаник',
      originalTitle: 'Titanic',
      imdb: 7.9,
      ageRating: '12+',
      year: 1997,
      countries: ['США'],
      genres: ['Драма', 'Романтика'],
      moods: ['romance', 'cry'],
      era: '80-90s',
      poster: { type: 'image', src: null, aspectRatio: '2:3' },
      description: 'Юная аристократка и бедный художник влюбляются на борту лайнера «Титаник» во время его первого рейса. Роскошь, любовь и трагедия в одном путешествии.'
    },
    {
      id: '15',
      title: 'Тихое место',
      originalTitle: 'A Quiet Place',
      imdb: 7.5,
      ageRating: '16+',
      year: 2018,
      countries: ['США'],
      genres: ['Ужасы', 'Драма', 'Фантастика'],
      moods: ['zone', 'cry'],
      era: 'modern',
      poster: { type: 'image', src: null, aspectRatio: '2:3' },
      description: 'Семья вынуждена жить в полной тишине, скрываясь от существ, которые охотятся по звуку. Один неверный шаг — и смерть.'
    }
  ];

/** LOCAL FALLBACK - sync, uses only MOVIES, no GPT/fetch/async */
function pickMovie(options) {
  var mood = options.mood;
  var epoch = options.epoch;
  var rating = options.rating;
  var minImdb = rating ? parseFloat(rating) : 0;
  var eraValue = epoch ? EPOCH_MAP[epoch] : null;
  var candidates = MOVIES.filter(function (m) {
    if (m.imdb < minImdb) return false;
    if (eraValue && m.era !== eraValue) return false;
    if (mood && m.moods.indexOf(mood) === -1) return false;
    return true;
  });
  if (candidates.length === 0) {
    candidates = MOVIES.filter(function (m) { return m.imdb >= minImdb; });
  }
  if (candidates.length === 0) {
    candidates = MOVIES;
  }
  var movie = candidates[Math.floor(Math.random() * candidates.length)];
  return { movie: movie, reason: 'Подобрано по вашему настроению' };
}

/** Backend must return { recommendation: { title, description, rating, year, country, genres, ageLimit } } */
var API_RECOMMEND_URL = '/api/recommend';

var TMDB_API_KEY = '7d7983a4442f13b2d23ad89cfea14294';
var TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';
var TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
var FALLBACK_BACKDROP_URL = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=780&q=80';

/**
 * Performs one TMDB search and returns best image URL (by popularity). Returns FALLBACK_BACKDROP_URL if none.
 * @param {string} query - search query (e.g. original title or Russian title)
 * @param {string|number} year
 * @returns {Promise<string>}
 */
function fetchImageFromTmdbSearch(query, year) {
  if (!query || !String(query).trim()) return Promise.resolve(FALLBACK_BACKDROP_URL);
  var q = encodeURIComponent(String(query).trim());
  var yearParam = year != null && year !== '' ? '&year=' + encodeURIComponent(String(year)) : '';
  var url = 'https://api.themoviedb.org/3/search/movie?api_key=' + TMDB_API_KEY + '&query=' + q + yearParam;
  return fetch(url)
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) {
      try {
        var results = data && data.results;
        if (!Array.isArray(results) || results.length === 0) return FALLBACK_BACKDROP_URL;
        var sorted = results.slice().sort(function (a, b) {
          var pa = typeof a.popularity === 'number' ? a.popularity : 0;
          var pb = typeof b.popularity === 'number' ? b.popularity : 0;
          return pb - pa;
        });
        for (var i = 0; i < sorted.length; i++) {
          var item = sorted[i];
          if (item.backdrop_path) return TMDB_BACKDROP_BASE + item.backdrop_path;
          if (item.poster_path) return TMDB_POSTER_BASE + item.poster_path;
        }
        return FALLBACK_BACKDROP_URL;
      } catch (e) {
        return FALLBACK_BACKDROP_URL;
      }
    })
    .catch(function () {
      return FALLBACK_BACKDROP_URL;
    });
}

/**
 * Fetches movie backdrop (or poster fallback) URL from TMDB. Tries original_title + year first, then title + year.
 * Always returns an image URL (https://image.tmdb.org/t/p/... or fallback).
 * @param {string} originalTitle - English/original title (for TMDB)
 * @param {string} title - Russian or display title (fallback search)
 * @param {string|number} year
 * @returns {Promise<string>}
 */
function fetchMovieBackdrop(originalTitle, title, year) {
  var hasOriginal = originalTitle != null && String(originalTitle).trim() !== '';
  var hasTitle = title != null && String(title).trim() !== '';
  if (!hasOriginal && !hasTitle) return Promise.resolve(FALLBACK_BACKDROP_URL);
  return fetchImageFromTmdbSearch(hasOriginal ? String(originalTitle).trim() : '', year).then(function (url) {
    if (url !== FALLBACK_BACKDROP_URL) return url;
    return fetchImageFromTmdbSearch(hasTitle ? String(title).trim() : '', year);
  });
}

/** Calls external backend. Returns { movie, reason } or null on failure. */
function getRecommendationFromApi(options) {
  return fetch(API_RECOMMEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mood: options.mood || null,
      epoch: options.epoch || null,
      rating: options.rating || null,
      exclude: options.exclude || []
    })
  }).then(function (res) {
    if (!res.ok) return null;
    return res.json();
  }).then(function (data) {
    if (!data || !data.recommendation) return null;
    return data;
  }).catch(function () {
    return null;
  });
}

(function () {
  const MOOD_TO_CHARACTER = {
    laugh: 'Mood=laugh.png',
    think: 'Mood=think.png',
    romance: 'Mood=romance.png',
    inspire: 'Mood=inspire.png',
    zone: 'Mood=neutral.png',
    cry: 'Mood=cry.png',
    sleep: 'Mood=sleep.png',
    neutral: 'Mood=zone.png'
  };

  const MOODS = [
    { id: 'laugh', label: 'Посмеяться' },
    { id: 'think', label: 'Подумать' },
    { id: 'romance', label: 'Романтика' },
    { id: 'inspire', label: 'Вдохновиться' },
    { id: 'zone', label: 'Залипнуть' },
    { id: 'cry', label: 'Поплакать' },
    { id: 'sleep', label: 'Уснуть' },
    { id: 'neutral', label: 'На фон' }
  ];

  const EPOCHS = [
    { id: 'modern', label: 'Современное' },
    { id: '2000s', label: 'Нулевые' },
    { id: '80s90s', label: '80–90-е' },
    { id: 'before80', label: 'До 1980' },
    { id: 'early', label: 'Раннее кино' }
  ];

  const RATINGS = [
    { id: '7', label: '7+' },
    { id: '7.5', label: '7.5+' },
    { id: '8', label: '8+' }
  ];

  const TEXTS = {
    addParamsDefault: 'Добавить эпоху и рейтинг',
    addParamsSelected: 'Изменить эпоху и рейтинг'
  };

  const MOOD_BACKGROUND_MAP = {
    laugh: '#FFE396',
    zone: '#B8A9ED',
    neutral: '#C2B8FF',
    sleep: '#C2D9FB',
    inspire: '#FFE396',
    cry: '#91DAFB',
    think: '#A3E0F7',
    romance: '#FDCBCA',
    romantic: '#FDCBCA'
  };

  const DEFAULT_MOOD_BACKGROUND = '#C2B8FF';

  const VIEWED_MOVIES_KEY = 'movieAppViewedMovies';
  const state = {
    selectedMood: null,
    selectedEpoch: null,
    selectedRating: null,
    viewedMovies: (function () {
      try {
        var raw = localStorage.getItem(VIEWED_MOVIES_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    })()
  };

  var loadingPhraseIntervalId = null;

  var LOADING_PHRASES = [
    'Просматриваем каталог…',
    'Учитываем ваше настроение…',
    'Подбираем по эпохе…',
    'Сверяем с рейтингами…',
    'Ищем идеальное совпадение…',
    'Проверяем описания…',
    'Почти готово…',
    'Ещё чуть-чуть…',
    'Выбираем лучшее…',
    'Секундочку…'
  ];

  const app = document.getElementById('app');

  function getCharacterSrc(mood) {
    if (!mood) return 'assets/characters/Mood=simple.png';
    var file = MOOD_TO_CHARACTER[mood] || MOOD_TO_CHARACTER.neutral;
    return 'assets/characters/' + file;
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function formatMovieMeta(movie) {
    var countries = movie.countries.join(', ');
    var genres = movie.genres.join(', ');
    return movie.ageRating + ' · ' + countries + ' ' + movie.year + ' · ' + genres;
  }

  function renderMoodScreen() {
    var hasParams = !!(state.selectedEpoch || state.selectedRating);
    var addParamsText = hasParams ? TEXTS.addParamsSelected : TEXTS.addParamsDefault;
    var addParamsIcon = hasParams ? 'assets/icons/edit.svg' : 'assets/icons/plus.svg';
    var characterSrc = getCharacterSrc(state.selectedMood);

    var moodChipsHtml = MOODS.map(function (m) {
      var active = state.selectedMood === m.id ? ' chip--active' : '';
      var chipIcon = (m.id === 'zone' ? 'Mood=neutral.png' : m.id === 'neutral' ? 'Mood=zone.png' : 'Mood=' + m.id + '.png');
      return '<button type="button" class="chip chip--mood' + active + '" data-mood="' + m.id + '">' +
        '<img class="chip__icon" src="assets/characters/' + chipIcon + '" alt="" width="20" height="20">' +
        '<span class="chip__label">' + m.label + '</span></button>';
    }).join('');

    app.innerHTML =
      '<section class="screen screen-mood">' +
        '<div class="screen-content">' +
          '<h1 class="title">Подберем фильм под настроение</h1>' +
          '<div class="chips-mood-scroll" role="group" aria-label="Выберите настроение">' +
            '<div class="chips chips-mood">' + moodChipsHtml + '</div>' +
          '</div>' +
          '<button type="button" id="btn-add-params" class="btn-secondary">' +
            '<img class="btn-secondary__icon btn-secondary__icon--plus" src="' + addParamsIcon + '" alt="" width="24" height="24">' +
            '<span id="btn-add-params-text" class="btn-secondary__text">' + addParamsText + '</span>' +
          '</button>' +
        '</div>' +
        '<div class="bottom-panel">' +
          '<div class="bottom-panel__inner">' +
            '<div class="character-wrapper">' +
              '<img id="character-img" class="character" src="' + characterSrc + '" alt="">' +
            '</div>' +
            '<button type="button" id="btn-find-movie" class="btn-primary">' +
              '<img class="btn-primary__icon btn-icon" src="assets/icons/play.svg" alt=""> Подобрать фильм' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    var characterCard = app.querySelector('.screen-mood .bottom-panel__inner');
    if (characterCard) {
      if (!state.selectedMood) {
        characterCard.style.backgroundColor = '#CDD9F3';
      } else if (state.selectedMood === 'neutral') {
        characterCard.style.backgroundColor = '';
      } else {
        characterCard.style.backgroundColor = MOOD_BACKGROUND_MAP[state.selectedMood] || '';
      }
    }

    app.querySelector('.chips-mood').addEventListener('click', onMoodClick);
    app.querySelector('#btn-add-params').addEventListener('click', function () {
      renderFiltersScreen();
    });
    app.querySelector('#btn-find-movie').addEventListener('click', onFindMovieClick);

    if (state.savedMoodScrollLeft != null) {
      var scrollEl = app.querySelector('.chips-mood-scroll');
      if (scrollEl) scrollEl.scrollLeft = state.savedMoodScrollLeft;
      state.savedMoodScrollLeft = null;
    }
  }

  function renderFiltersScreen() {
    var characterSrc = getCharacterSrc(state.selectedMood);

    var epochChipsHtml = EPOCHS.map(function (e) {
      var active = state.selectedEpoch === e.id ? ' chip--active' : '';
      return '<button type="button" class="chip chip--filter chip-epoch' + active + '" data-epoch="' + e.id + '"><span class="chip__label">' + e.label + '</span></button>';
    }).join('');

    var ratingChipsHtml = RATINGS.map(function (r) {
      var active = String(state.selectedRating) === r.id ? ' chip--active' : '';
      return '<button type="button" class="chip chip--filter chip-rating' + active + '" data-rating="' + r.id + '"><span class="chip__label">' + r.label + '</span></button>';
    }).join('');

    app.innerHTML =
      '<section class="screen screen-filters">' +
        '<div class="screen-content">' +
          '<h1 class="title">Сузим рандом</h1>' +
          '<p class="section-label">Эпоха</p>' +
          '<div class="chips-epoch-scroll" role="group">' +
            '<div class="chips chips-epoch-row">' + epochChipsHtml + '</div>' +
          '</div>' +
          '<p class="section-label">IMDb рейтинг</p>' +
          '<div class="chips chips-rating" role="group">' + ratingChipsHtml + '</div>' +
          '<button type="button" id="btn-change-mood" class="btn-back">' +
            '<img src="assets/icons/back.svg" alt="" width="24" height="24"> Сменить настроение' +
          '</button>' +
        '</div>' +
        '<div class="bottom-panel">' +
          '<div class="bottom-panel__inner">' +
            '<div class="character-wrapper">' +
              '<img id="character-img" class="character" src="' + characterSrc + '" alt="">' +
            '</div>' +
            '<button type="button" id="btn-find-movie" class="btn-primary">' +
              '<img class="btn-primary__icon btn-icon" src="assets/icons/play.svg" alt=""> Подобрать фильм' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    var filtersCharacterCard = app.querySelector('.screen-filters .bottom-panel__inner');
    if (filtersCharacterCard) {
      if (!state.selectedMood) {
        filtersCharacterCard.style.backgroundColor = '#CDD9F3';
      } else if (state.selectedMood === 'neutral') {
        filtersCharacterCard.style.backgroundColor = '';
      } else {
        filtersCharacterCard.style.backgroundColor = MOOD_BACKGROUND_MAP[state.selectedMood] || '';
      }
    }

    app.querySelector('.chips-epoch-row').addEventListener('click', onEpochClick);
    app.querySelector('.chips-rating').addEventListener('click', onRatingClick);
    app.querySelector('#btn-change-mood').addEventListener('click', function () {
      renderMoodScreen();
    });
    app.querySelector('#btn-find-movie').addEventListener('click', onFindMovieClick);
  }

  function renderLoadingScreen() {
    if (loadingPhraseIntervalId) {
      clearInterval(loadingPhraseIntervalId);
      loadingPhraseIntervalId = null;
    }
    app.innerHTML =
      '<section class="screen screen-loading">' +
        '<div class="loading-bg" aria-hidden="true"></div>' +
        '<div class="loading-blobs" aria-hidden="true">' +
          '<div class="loading-blob loading-blob--1"></div>' +
          '<div class="loading-blob loading-blob--2"></div>' +
          '<div class="loading-blob loading-blob--3"></div>' +
        '</div>' +
        '<div class="loading-content">' +
          '<p class="loading-headline">Ищем шедевр…</p>' +
          '<p id="loading-sub" class="loading-sub">' + (LOADING_PHRASES[0] || 'Загрузка…') + '</p>' +
        '</div>' +
      '</section>';
    var subEl = document.getElementById('loading-sub');
    var phraseIndex = 0;
    function nextPhrase() {
      if (!subEl || !subEl.parentNode) return;
      subEl.classList.add('loading-sub--fade');
      setTimeout(function () {
        if (!subEl || !subEl.parentNode) return;
        phraseIndex = (phraseIndex + 1) % LOADING_PHRASES.length;
        subEl.textContent = LOADING_PHRASES[phraseIndex] || 'Загрузка…';
        subEl.classList.remove('loading-sub--fade');
      }, 350);
    }
    loadingPhraseIntervalId = setInterval(nextPhrase, 2000);
  }

  function fadeOutLoadingThenShowMovie(data, opts) {
    var section = app.querySelector('.screen-loading');
    if (section) {
      section.classList.add('screen-loading--fade-out');
      if (loadingPhraseIntervalId) {
        clearInterval(loadingPhraseIntervalId);
        loadingPhraseIntervalId = null;
      }
      setTimeout(function () {
        if (data && data.recommendation) renderMovieFromBackendResponse(data);
        else if (opts) renderMovieScreen(pickMovie(opts).movie);
        else renderMoodScreen();
      }, 400);
    } else {
      if (data && data.recommendation) renderMovieFromBackendResponse(data);
      else if (opts) renderMovieScreen(pickMovie(opts).movie);
      else renderMoodScreen();
    }
  }

  var minimalMovieStub = { title: '', year: '', countries: [], genres: [], ageRating: '', imdb: '', description: '' };

  /**
   * Renders movie result from backend response. Uses recommendation shape.
   * @param {{ recommendation: object|string }} data
   */
  function renderMovieFromBackendResponse(data) {
    try {
      renderMovieScreen(minimalMovieStub);
      var rec = data.recommendation;
      var titleEl = document.getElementById('result-title');
      var descEl = document.getElementById('result-description');
      var imdbEl = document.getElementById('result-imdb');
      var metaEl = document.getElementById('result-meta');
      var backdropEl = document.getElementById('result-backdrop');

      if (typeof rec === 'string') {
        if (titleEl) titleEl.textContent = 'Ваша рекомендация';
        if (descEl) descEl.textContent = rec;
        if (imdbEl) imdbEl.textContent = '';
        if (metaEl) metaEl.textContent = '';
      } else {
        if (titleEl) titleEl.textContent = rec.title != null ? String(rec.title) : '';
        if (descEl) descEl.textContent = rec.description != null ? String(rec.description) : '';
        if (imdbEl) imdbEl.textContent = rec.rating != null && rec.rating !== '' ? 'IMDb ≈ ' + rec.rating : '';
        var recAge = rec.ageLimit != null ? String(rec.ageLimit) : (rec.ageRating != null ? String(rec.ageRating) : '');
        var recCountry = rec.country != null ? String(rec.country) : (Array.isArray(rec.countries) ? rec.countries.join(', ') : (rec.countries != null ? String(rec.countries) : ''));
        var recGenres = rec.genres != null ? String(rec.genres) : '';
        var recMetaRest = [recAge, rec.year, recCountry, recGenres].filter(Boolean).join(' • ');
        if (metaEl) metaEl.textContent = recMetaRest;
        if (backdropEl) {
          var backdropTitle = (rec.title != null && String(rec.title).trim()) ? String(rec.title).trim() : '';
          var backdropOriginalTitle = (rec.original_title != null && String(rec.original_title).trim()) ? String(rec.original_title).trim() : '';
          backdropEl.innerHTML = '';
          var skeleton = document.createElement('div');
          skeleton.className = 'poster-skeleton';
          backdropEl.appendChild(skeleton);
          (function (el, originalTitle, title, recYear) {
            fetchMovieBackdrop(originalTitle, title, recYear).then(function (backdropUrl) {
              if (!el.parentNode) return;
              var img = new Image();
              img.alt = title || '';
              img.className = 'result-backdrop__img';
              img.onload = function () {
                if (!el.parentNode) return;
                el.innerHTML = '';
                el.appendChild(img);
                img.classList.add('loaded');
              };
              img.onerror = function () {
                if (!el.parentNode) return;
                el.innerHTML = '';
                var fallback = document.createElement('div');
                fallback.className = 'result-backdrop__placeholder';
                fallback.textContent = title || '🎬';
                el.appendChild(fallback);
              };
              img.src = backdropUrl;
            }).catch(function () {
              if (!el.parentNode) return;
              el.innerHTML = '';
              var fb = document.createElement('div');
              fb.className = 'result-backdrop__placeholder';
              fb.textContent = title || '🎬';
              el.appendChild(fb);
            });
          })(backdropEl, backdropOriginalTitle, backdropTitle, rec.year);
        }
        if (rec.title != null && String(rec.title).trim()) {
          state.viewedMovies.push(String(rec.title).trim());
          try {
            localStorage.setItem(VIEWED_MOVIES_KEY, JSON.stringify(state.viewedMovies));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('renderMovieFromBackendResponse', err);
      var opts = { mood: state.selectedMood || 'neutral', epoch: state.selectedEpoch, rating: state.selectedRating };
      renderMovieScreen(pickMovie(opts).movie);
    }
  }

  /**
   * Renders movie screen from Movie object only.
   * @param {Movie} movie
   */
  function renderMovieScreen(movie) {
    var poster = movie && movie.poster;
    var posterHtml = (poster && poster.type === 'image' && poster.src)
      ? '<img src="' + escapeHtml(poster.src) + '" alt="">'
      : escapeHtml(movie.title);
    var countriesStr = movie.countries && movie.countries.length ? movie.countries.join(', ') : '';
    var genresStr = movie.genres && movie.genres.length ? movie.genres.join(', ') : '';
    var metaRest = [movie.ageRating, movie.year, countriesStr, genresStr].filter(Boolean).join(' • ');

    app.innerHTML =
      '<section class="screen screen-movie">' +
        '<header class="result-header" id="result-header">' +
          '<button type="button" id="btn-back" class="btn-back-inline">' +
            '<img src="assets/icons/back.svg" alt="" width="24" height="24">' +
          '</button>' +
          '<h1 class="result-header-title">Выбрать настроение</h1>' +
        '</header>' +
        '<main class="result-content">' +
          '<div id="result-backdrop" class="result-backdrop">' + posterHtml + '</div>' +
          '<div class="result-meta-row">' +
            '<span id="result-imdb" class="imdb-badge">IMDb ≈ ' + movie.imdb + '</span>' +
            '<span id="result-meta" class="result-meta">' + escapeHtml(metaRest) + '</span>' +
          '</div>' +
          '<div class="result-desc-card">' +
            '<h2 id="result-title" class="result-card-title">' + escapeHtml(movie.title) + '</h2>' +
            '<p id="result-description" class="result-description">' + escapeHtml(movie.description) + '</p>' +
          '</div>' +
        '</main>' +
        '<footer class="result-footer">' +
          '<button type="button" id="btn-another" class="btn-primary">' +
            '<img class="btn-primary__icon" src="assets/icons/reload.svg" alt="" width="24" height="24">' +
            ' Хочу другой' +
          '</button>' +
        '</footer>' +
      '</section>';

    app.querySelector('#btn-back').addEventListener('click', function () {
      renderMoodScreen();
    });
    app.querySelector('#btn-another').addEventListener('click', function () {
      renderLoadingScreen();
      var opts = { mood: state.selectedMood || 'neutral', epoch: state.selectedEpoch, rating: state.selectedRating, exclude: state.viewedMovies };
      getRecommendationFromApi(opts).then(function (data) {
        fadeOutLoadingThenShowMovie(data, opts);
      });
    });
  }

  function onMoodClick(e) {
    var chip = e.target.closest('.chip[data-mood]');
    if (!chip) return;
    var scrollContainer = app.querySelector('.chips-mood-scroll');
    if (scrollContainer) state.savedMoodScrollLeft = scrollContainer.scrollLeft;
    state.selectedMood = chip.dataset.mood;
    renderMoodScreen();
  }

  function onEpochClick(e) {
    var chip = e.target.closest('.chip[data-epoch]');
    if (!chip) return;
    var epoch = chip.dataset.epoch;
    state.selectedEpoch = state.selectedEpoch === epoch ? null : epoch;
    renderFiltersScreen();
  }

  function onRatingClick(e) {
    var chip = e.target.closest('.chip[data-rating]');
    if (!chip) return;
    var rating = chip.dataset.rating;
    state.selectedRating = state.selectedRating === rating ? null : rating;
    renderFiltersScreen();
  }

  function onFindMovieClick() {
    renderLoadingScreen();
    var opts = { mood: state.selectedMood || 'neutral', epoch: state.selectedEpoch, rating: state.selectedRating, exclude: state.viewedMovies };
    getRecommendationFromApi(opts).then(function (data) {
      fadeOutLoadingThenShowMovie(data, opts);
    });
  }

  (function initWelcomeOverlay() {
    var overlay = document.getElementById('welcome-overlay');
    var btn = document.getElementById('welcome-overlay-btn');
    if (!overlay || !btn) return;
    btn.addEventListener('click', function () {
      overlay.classList.add('welcome-overlay--fade-out');
      overlay.addEventListener('transitionend', function onEnd() {
        overlay.removeEventListener('transitionend', onEnd);
        overlay.remove();
      });
    });
  })();

  renderMoodScreen();
})();