'use strict';

function hasSubmittedFeedback() {
  return localStorage.getItem('feedback_submitted') === 'true';
}

function setFeedbackSubmitted() {
  localStorage.setItem('feedback_submitted', 'true');
}

function setFeedbackDismissedNow() {
  localStorage.setItem('feedback_dismissed_at', Date.now().toString());
}

function canShowFeedback() {
  if (hasSubmittedFeedback()) return false;
  var dismissedAt = localStorage.getItem('feedback_dismissed_at');
  if (!dismissedAt) return true;
  var TWO_DAYS = 1000 * 60 * 60 * 48;
  return Date.now() - Number(dismissedAt) > TWO_DAYS;
}

function sendFeedbackToGoogle(rating, text) {
  fetch("https://docs.google.com/forms/d/e/1FAIpQLSdKzsSIUqjkuYpxOP1CjllnDerG9kMW7YYBNXiF-WG4cQhKNQ/formResponse", {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      "entry.53559483": rating,
      "entry.1289232695": text || ""
    })
  });
}

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

var API_RECOMMEND_URL = '/api/recommend';
var apiSessionId = null;

/** Calls external backend. Returns { recommendations: Movie[], sessionId } or on failure { _error: true, status, message }. */
function getRecommendationFromApi(options) {
  return fetch(API_RECOMMEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mood: options.mood || null,
      epoch: options.epoch || null,
      rating: options.rating || null,
      popularity: options.popularity || null,
      exclude: options.exclude || [],
      likedMovies: options.likedMovies || [],
      globalHistory: options.globalHistory || [],
      sessionId: options.sessionId != null ? options.sessionId : apiSessionId
    })
  }).then(function (res) {
    if (!res.ok) {
      return res.json().then(function (body) {
        return { _error: true, status: res.status, message: (body && body.error) || res.statusText };
      }).catch(function () {
        return { _error: true, status: res.status, message: res.statusText };
      });
    }
    return res.json();
  }).then(function (data) {
    if (data && data.sessionId) apiSessionId = data.sessionId;
    if (data && data._error) return data;
    if (!data) return null;
    return data;
  }).catch(function (e) {
    return { _error: true, status: 0, message: e && e.message };
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
    horror: 'Mood=horor.png'
  };

  const MOODS = [
    { id: 'laugh', label: 'Посмеяться' },
    { id: 'romance', label: 'Романтика' },
    { id: 'zone', label: 'Залипнуть' },
    { id: 'sleep', label: 'Уснуть' },
    { id: 'think', label: 'Подумать' },
    { id: 'inspire', label: 'Вдохновиться' },
    { id: 'cry', label: 'Поплакать' },
    { id: 'horror', label: 'Обделаться' }
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

  const POPULARITY = [
    { id: 'gold', label: 'Золотая классика' },
    { id: 'solid', label: 'Крепкое кинцо' },
    { id: 'underground', label: 'Андеграунд' }
  ];

  const MOOD_BACKGROUND_MAP = {
    laugh: '#FFE396',
    zone: '#B8A9ED',
    sleep: '#C2D9FB',
    inspire: '#FFE396',
    cry: '#91DAFB',
    think: '#A3E0F7',
    romance: '#FDCBCA',
    romantic: '#FDCBCA',
    horror: '#E3C1F2'
  };

  const DEFAULT_MOOD_BACKGROUND = '#C2B8FF';

  const VIEWED_MOVIES_KEY = 'movieAppViewedMovies';
  const LIKED_MOVIES_KEY = 'likedMovies';
  const GLOBAL_HISTORY_KEY = 'globalHistory';
  const HAS_SEEN_LIKE_TOOLTIP_KEY = 'hasSeenLikeTooltip';

  var movieQueue = [];
  var currentIndex = 0;

  function getGlobalHistory() {
    try {
      var raw = localStorage.getItem(GLOBAL_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function addToGlobalHistory(originalTitle) {
    if (!originalTitle || !String(originalTitle).trim()) return;
    var arr = getGlobalHistory();
    var key = String(originalTitle).trim();
    if (arr.indexOf(key) !== -1) return;
    arr.push(key);
    if (arr.length > 200) {
      arr.splice(0, arr.length - 200);
    }
    try {
      localStorage.setItem(GLOBAL_HISTORY_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function getLikedMovies() {
    try {
      var raw = localStorage.getItem(LIKED_MOVIES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLikedMovies(arr) {
    try {
      localStorage.setItem(LIKED_MOVIES_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function addLikedMovie(title) {
    if (!title || !String(title).trim()) return false;
    var key = String(title).trim();
    var arr = getLikedMovies();
    if (arr.indexOf(key) !== -1) return false;
    arr.push(key);
    saveLikedMovies(arr);
    return true;
  }

  function removeLikedMovie(title) {
    if (!title || !String(title).trim()) return;
    var key = String(title).trim();
    var arr = getLikedMovies().filter(function (t) { return t !== key; });
    saveLikedMovies(arr);
  }

  function updateFavoriteButtonState(btn, title) {
    if (!btn) return;
    var img = btn.querySelector('img');
    var key = title != null ? String(title).trim() : '';
    var liked = key && getLikedMovies().indexOf(key) !== -1;
    if (img) img.src = liked ? 'assets/icons/favourite_on.svg' : 'assets/icons/favourite_off.svg';
    btn.classList.toggle('is-active', liked);
  }

  function showLikeTooltip() {
    var toast = document.createElement('div');
    toast.className = 'like-tooltip';
    toast.setAttribute('role', 'status');
    toast.textContent = 'Лайк учтён. Будем учитывать это в будущих рекомендациях.';
    app.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('like-tooltip--visible'); });
    setTimeout(function () {
      toast.classList.remove('like-tooltip--visible');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  }

  var INFO_ICON_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 11v4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function showFavoriteToast() {
    var existing = document.querySelector('.favorite-toast');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    var wrap = document.createElement('div');
    wrap.className = 'favorite-toast favorite-toast--entering';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', 'Уведомление');
    wrap.innerHTML =
      '<button type="button" class="favorite-toast__close" aria-label="Закрыть">' +
        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '</button>' +
      '<div class="favorite-toast__icon">' + INFO_ICON_SVG + '</div>' +
      '<div class="favorite-toast__body">' +
        '<p class="favorite-toast__title">Пока не умеем сохранять фильмы</p>' +
        '<p class="favorite-toast__text">Мы работаем над этим функционалом.<br>В следующих релизах обязательно добавим сохранение.<br>А пока — сделайте скриншот или запомните название фильма.</p>' +
      '</div>';
    document.body.appendChild(wrap);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        wrap.classList.remove('favorite-toast--entering');
        wrap.classList.add('favorite-toast--visible');
      });
    });
    function closeToast() {
      wrap.classList.remove('favorite-toast--visible');
      wrap.classList.add('favorite-toast--leaving');
      setTimeout(function () {
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      }, 220);
    }
    wrap.querySelector('.favorite-toast__close').addEventListener('click', closeToast);
  }

  /** Глобальная история показанных за сессию фильмов (по title). */
  var sessionHistory = [];

  /** Only original_title is used. No fallback to title or localized names. */
  function getRecommendationTitle(rec) {
    if (!rec) return '';
    if (typeof rec === 'string') return String(rec).trim();
    var ot = rec.original_title != null ? String(rec.original_title) : (rec.originalTitle != null ? String(rec.originalTitle) : '');
    return ot.trim();
  }

  function getMovieKey(rec) {
    if (!rec) return null;
    if (typeof rec === 'string') return String(rec).trim() || null;
    if (rec.original_title != null && String(rec.original_title).trim() !== '') return String(rec.original_title).trim();
    if (rec.originalTitle != null && String(rec.originalTitle).trim() !== '') return String(rec.originalTitle).trim();
    if (rec.id != null && String(rec.id).trim() !== '') return String(rec.id).trim();
    if (rec.title != null && String(rec.title).trim() !== '') return String(rec.title).trim();
    return null;
  }

  /** Ensures minimum 1500ms loading: duration = max(1500ms, actual request time). */
  function callWithMinLoading(promiseFactory) {
    var startTime = Date.now();
    return Promise.resolve().then(promiseFactory).then(function (result) {
      var elapsed = Date.now() - startTime;
      var delay = elapsed < 1500 ? 1500 - elapsed : 0;
      if (delay > 0) {
        return new Promise(function (r) { setTimeout(r, delay); }).then(function () { return result; });
      }
      return result;
    });
  }

  /** Safe API call with retry on server/network errors only. Returns raw API result or error object. */
  function getRecommendationWithRetrySafe(options, maxRetries) {
    maxRetries = maxRetries == null ? 1 : maxRetries;
    var fullOpts = {
      mood: options.mood,
      epoch: options.epoch,
      rating: options.rating,
      popularity: options.popularity,
      exclude: sessionHistory.slice(0),
      likedMovies: getLikedMovies(),
      globalHistory: getGlobalHistory(),
      sessionId: apiSessionId
    };
    return (function attempt(n) {
      return getRecommendationFromApi(fullOpts).then(function (result) {
        if (!result || result._error) {
          var isServerError = result && (result.status === 0 || result.status >= 500);
          if (n >= maxRetries || !isServerError) {
            return result;
          }
          return new Promise(function (res) { setTimeout(res, 800); }).then(function () { return attempt(n + 1); });
        }
        return result;
      });
    })(0);
  }

  const state = {
    selectedMood: null,
    selectedEpoch: null,
    selectedRating: null,
    selectedPopularity: null,
    filtersExpanded: false,
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
  var generateCounter = 0;

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

  var IMDB_ICON_SVG = '<svg width="28" height="12" viewBox="0 0 28 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M23.3202 3.67593C23.0666 3.79201 22.8363 3.96809 22.6298 4.20416V1H20.1361V10.8497H22.4665C22.5485 10.5316 22.5993 10.3329 22.6195 10.2537L22.6276 10.2222C22.8386 10.4745 23.0706 10.6641 23.3253 10.7897C23.5789 10.9159 23.9584 10.9787 24.2522 10.9787C24.6612 10.9787 25.0141 10.8727 25.3119 10.6602C25.6092 10.4482 25.7986 10.197 25.8792 9.90818C25.9597 9.61883 26 9.1792 26 8.58816V5.82475C26 5.23035 25.9864 4.84231 25.9597 4.66006C25.9331 4.47781 25.8536 4.2922 25.7215 4.10211C25.5893 3.91201 25.397 3.76453 25.1451 3.65911C24.8933 3.55369 24.596 3.50098 24.2534 3.50098C23.9556 3.50098 23.5743 3.55986 23.3202 3.67593ZM23.4308 9.36313C23.3832 9.48818 23.1744 9.55154 23.0167 9.55154C22.8624 9.55154 22.7597 9.49098 22.7076 9.3693C22.6554 9.24817 22.6298 8.97172 22.6298 8.53882V5.93578C22.6298 5.48718 22.6525 5.20736 22.6985 5.09577C22.7439 4.9853 22.8437 4.92922 22.998 4.92922C23.1557 4.92922 23.3673 4.99259 23.4217 5.11988C23.4756 5.24717 23.5029 5.51914 23.5029 5.93578V8.45975C23.4864 8.97845 23.4626 9.27958 23.4308 9.36313Z" fill="#000000"/><path d="M9.07901 1.08573L8.4794 5.6873L8.37708 4.9966C8.2188 3.92819 8.12932 3.32418 8.10897 3.1852C8.00062 2.38164 7.89738 1.68238 7.79867 1.08573H4.44269V10.9354H6.71008L6.71802 4.43177L7.67217 10.9354H9.2872L10.192 4.28709L10.2005 10.9354H12.4605V1.08573H9.07901Z" fill="#000000"/><path d="M3.58847 1.15031H1V11H3.58847V1.15031Z" fill="#000000"/><path fill-rule="evenodd" clip-rule="evenodd" d="M17.9031 10.8351C18.2112 10.7683 18.4698 10.6506 18.6797 10.4829C18.889 10.3147 19.036 10.082 19.1199 9.78419C19.2045 9.48699 19.2544 8.89651 19.2544 8.01332V4.55457C19.2544 3.62259 19.2175 2.99791 19.1602 2.68052C19.1023 2.36257 18.9588 2.07378 18.7291 1.81471C18.4988 1.55564 18.1629 1.36947 17.7216 1.2562C17.2797 1.14293 16.5593 1.08573 15.3062 1.08573H13.3752V10.9354H16.511C17.2337 10.913 17.6978 10.8799 17.9031 10.8351ZM16.734 3.13474C16.7623 3.26035 16.7771 3.54521 16.7771 3.99045V7.80921C16.7771 8.46473 16.734 8.86623 16.6483 9.01427C16.5621 9.16231 16.3329 9.23577 15.9614 9.23577V2.77024C16.2433 2.77024 16.4356 2.79996 16.5377 2.85828C16.6398 2.91716 16.7056 3.00913 16.734 3.13474Z" fill="#000000"/></svg>';

  function getCharacterSrc(mood) {
    if (!mood) return 'assets/characters/Mood=simple.png';
    var file = MOOD_TO_CHARACTER[mood] || 'Mood=simple.png';
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
    var characterSrc = getCharacterSrc(state.selectedMood);

    var moodChipsHtml = MOODS.map(function (m) {
      var active = state.selectedMood === m.id ? ' chip--active' : '';
      var chipIcon = (m.id === 'zone' ? 'Mood=neutral.png' : m.id === 'horror' ? 'Mood=horor.png' : 'Mood=' + m.id + '.png');
      return '<button type="button" class="chip chip--primary chip--mood' + active + '" data-mood="' + m.id + '">' +
        '<img class="chip__icon" src="assets/characters/' + chipIcon + '" alt="" width="20" height="20">' +
        '<span class="chip__label">' + m.label + '</span></button>';
    }).join('');

    var epochChipsHtml = EPOCHS.map(function (e) {
      var active = state.selectedEpoch === e.id ? ' chip--active' : '';
      return '<button type="button" class="chip chip--filter chip-epoch' + active + '" data-epoch="' + e.id + '"><span class="chip__label">' + e.label + '</span></button>';
    }).join('');

    var ratingChipsHtml = RATINGS.map(function (r) {
      var active = String(state.selectedRating) === r.id ? ' chip--active' : '';
      return '<button type="button" class="chip chip--filter chip-rating' + active + '" data-rating="' + r.id + '"><span class="chip__label">' + r.label + '</span></button>';
    }).join('');

    var popularityChipsHtml = POPULARITY.map(function (p) {
      var active = state.selectedPopularity === p.id ? ' chip--active' : '';
      return '<button type="button" class="chip chip--filter chip-popularity' + active + '" data-popularity="' + p.id + '"><span class="chip__label">' + p.label + '</span></button>';
    }).join('');

    var filtersOpenClass = state.filtersExpanded ? ' filters-inline--open' : '';
    var triggerBtnHtml =
      '<button type="button" id="btn-toggle-filters" class="btn-secondary filters-trigger" aria-expanded="' + state.filtersExpanded + '">' +
        '<img class="btn-secondary__icon" src="' + (state.filtersExpanded ? 'assets/icons/minus.svg' : 'assets/icons/plus.svg') + '" alt="" width="24" height="24">' +
        '<span class="btn-secondary__text">' + (state.filtersExpanded ? 'Скрыть фильтры' : 'Дополнительные фильтры') + '</span>' +
      '</button>';
    var triggerSlotTopContent = state.filtersExpanded ? '' : triggerBtnHtml;
    var triggerSlotBottomContent = state.filtersExpanded ? triggerBtnHtml : '';

    app.innerHTML =
      '<section class="screen screen-mood">' +
        '<div class="main-screen-character" id="main-screen-character">' +
          '<div class="character-wrapper">' +
            '<img id="character-img" class="character" src="' + characterSrc + '" alt="">' +
          '</div>' +
        '</div>' +
        '<div class="screen-content">' +
          '<p class="section-label">Какой вайбец хочешь?</p>' +
          '<div class="chips chips-mood" role="group" aria-label="Выберите настроение">' + moodChipsHtml + '</div>' +
          '<div id="filters-trigger-slot-top" class="filters-trigger-slot">' + triggerSlotTopContent + '</div>' +
          '<div id="filters-inline" class="filters-inline' + filtersOpenClass + '">' +
            '<p class="section-label">Эпоха</p>' +
            '<div class="chips-epoch-scroll" role="group">' +
              '<div class="chips chips-epoch-row">' + epochChipsHtml + '</div>' +
            '</div>' +
            '<p class="section-label">Рейтинг</p>' +
            '<div class="chips chips-rating" role="group">' + ratingChipsHtml + '</div>' +
            '<p class="section-label">Популярность</p>' +
            '<div class="chips-popularity-scroll" role="group">' +
              '<div class="chips chips-popularity-row">' + popularityChipsHtml + '</div>' +
            '</div>' +
            '<div id="filters-trigger-slot-bottom" class="filters-trigger-slot">' + triggerSlotBottomContent + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="bottom-panel bottom-bar-container">' +
          '<div class="bottom-panel__inner bottom-panel__inner--cta-only">' +
            '<button type="button" id="btn-find-movie" class="btn-primary">' +
              '<img class="btn-icon" src="assets/icons/play.svg" alt="" width="24" height="24">' +
              '<span>Подобрать фильм</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    var characterBlock = document.getElementById('main-screen-character');
    if (characterBlock) {
      if (!state.selectedMood) {
        characterBlock.style.backgroundColor = '#CDD9F3';
      } else {
        characterBlock.style.backgroundColor = MOOD_BACKGROUND_MAP[state.selectedMood] || '';
      }
    }

    app.querySelector('.chips-mood').addEventListener('click', onMoodClick);
    var triggerBtn = app.querySelector('#btn-toggle-filters');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', function () {
        state.filtersExpanded = !state.filtersExpanded;
        var inline = document.getElementById('filters-inline');
        var trigger = document.getElementById('btn-toggle-filters');
        var slotTop = document.getElementById('filters-trigger-slot-top');
        var slotBottom = document.getElementById('filters-trigger-slot-bottom');
        if (inline) inline.classList.toggle('filters-inline--open', state.filtersExpanded);
        if (trigger && slotTop && slotBottom) {
          if (state.filtersExpanded) {
            slotBottom.appendChild(trigger);
          } else {
            slotTop.appendChild(trigger);
          }
          trigger.setAttribute('aria-expanded', state.filtersExpanded);
          var icon = trigger.querySelector('img');
          var textSpan = trigger.querySelector('.btn-secondary__text');
          if (icon) icon.src = state.filtersExpanded ? 'assets/icons/minus.svg' : 'assets/icons/plus.svg';
          if (textSpan) textSpan.textContent = state.filtersExpanded ? 'Скрыть фильтры' : 'Дополнительные фильтры';
        }
      });
    }
    var filtersContainer = document.getElementById('filters-inline');
    if (filtersContainer) {
      filtersContainer.addEventListener('click', function (e) {
        var epochChip = e.target.closest('.chip[data-epoch]');
        var ratingChip = e.target.closest('.chip[data-rating]');
        var popularityChip = e.target.closest('.chip[data-popularity]');
        if (epochChip) { onEpochClick(e); return; }
        if (ratingChip) { onRatingClick(e); return; }
        if (popularityChip) { onPopularityClick(e); return; }
      });
    }
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

  function renderServerErrorScreen(message) {
    var text = escapeHtml(message);
    app.innerHTML =
      '<section class="screen screen-movie screen-no-more">' +
        '<header class="result-header">' +
          '<button type="button" id="btn-back-error" class="btn-back-inline">' +
            '<img src="assets/icons/back.svg" alt="" width="24" height="24">' +
          '</button>' +
          '<h1 class="result-header-title">Выбрать настроение</h1>' +
        '</header>' +
        '<main class="result-content">' +
          '<div class="no-more-message">' + text + '</div>' +
        '</main>' +
        '<footer class="result-footer">' +
          '<button type="button" id="btn-retry-later" class="btn-primary">' +
            '<span>Подобрать фильм</span>' +
          '</button>' +
        '</footer>' +
      '</section>';
    app.querySelector('#btn-back-error').addEventListener('click', renderMoodScreen);
    app.querySelector('#btn-retry-later').addEventListener('click', doFetchRecommendations);
  }

  /** Shown when user has seen all movies in current batch. Disables "Поменяй" and shows message. */
  function renderNoMoreInBatchScreen() {
    var message = 'Что-то пошло не так и рекомендации сбросились. Нажмите «Подобрать фильм», и попробуем ещё раз.';
    app.innerHTML =
      '<section class="screen screen-movie screen-no-more">' +
        '<header class="result-header">' +
          '<button type="button" id="btn-back-no-more" class="btn-back-inline">' +
            '<img src="assets/icons/back.svg" alt="" width="24" height="24">' +
          '</button>' +
          '<h1 class="result-header-title">Выбрать настроение</h1>' +
        '</header>' +
        '<main class="result-content">' +
          '<div class="no-more-message">' + escapeHtml(message) + '</div>' +
        '</main>' +
        '<footer class="result-footer">' +
          '<button type="button" id="btn-new-batch" class="btn-primary">' +
            '<span>Подобрать фильм</span>' +
          '</button>' +
        '</footer>' +
      '</section>';
    app.querySelector('#btn-back-no-more').addEventListener('click', renderMoodScreen);
    app.querySelector('#btn-new-batch').addEventListener('click', onFindMovieClick);
  }

  function renderNoMoreVariantsScreen(movieTitle, overrideMessage) {
    var message = overrideMessage
      ? escapeHtml(overrideMessage)
      : 'Похоже, в этой категории «' + escapeHtml(movieTitle || 'этот фильм') + '» непобедим. Попробуйте чуть снизить рейтинг или сменить эпоху!';
    app.innerHTML =
      '<section class="screen screen-movie screen-no-more">' +
        '<header class="result-header">' +
          '<button type="button" id="btn-back-no-more" class="btn-back-inline">' +
            '<img src="assets/icons/back.svg" alt="" width="24" height="24">' +
          '</button>' +
          '<h1 class="result-header-title">Выбрать настроение</h1>' +
        '</header>' +
        '<main class="result-content">' +
          '<div class="no-more-message">' + message + '</div>' +
        '</main>' +
        '<footer class="result-footer">' +
          '<button type="button" id="btn-try-other-filters" class="btn-primary">' +
            '<span>Попробовать другие фильтры</span>' +
          '</button>' +
        '</footer>' +
      '</section>';
    app.querySelector('#btn-back-no-more').addEventListener('click', renderMoodScreen);
    app.querySelector('#btn-try-other-filters').addEventListener('click', renderMoodScreen);
  }

  function closeFeedbackModal() {
    var overlay = document.querySelector('.feedback-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 200);
    }
  }

  function openFeedbackModal() {
    var selectedRating = null;
    var overlay = document.createElement('div');
    overlay.className = 'feedback-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Обратная связь');
    overlay.innerHTML = '<div class="feedback-modal"><button type="button" class="feedback-close-btn" aria-label="Закрыть">&times;</button><h3 class="feedback-title">Как тебе рекомендации?</h3><div class="feedback-stars"></div><textarea class="feedback-textarea" placeholder="Комментарий (необязательно)" rows="3"></textarea><button type="button" class="btn-primary feedback-submit-btn">Отправить</button></div>';
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        setFeedbackDismissedNow();
        closeFeedbackModal();
      }
    });
    var modal = overlay.querySelector('.feedback-modal');
    var starsContainer = overlay.querySelector('.feedback-stars');
    var textareaEl = overlay.querySelector('.feedback-textarea');
    var submitBtn = overlay.querySelector('.feedback-submit-btn');
    var closeBtn = overlay.querySelector('.feedback-close-btn');
    for (var i = 0; i < 5; i++) {
      var star = document.createElement('span');
      star.className = 'feedback-star';
      star.textContent = '★';
      star.dataset.index = String(i);
      star.addEventListener('click', function () {
        selectedRating = parseInt(this.dataset.index, 10) + 1;
        starsContainer.querySelectorAll('.feedback-star').forEach(function (s, idx) {
          s.classList.toggle('active', idx < selectedRating);
        });
      });
      starsContainer.appendChild(star);
    }
    closeBtn.addEventListener('click', function () {
      setFeedbackDismissedNow();
      closeFeedbackModal();
    });
    submitBtn.addEventListener('click', function () {
      if (selectedRating == null) return;
      if (window.plausible) {
        plausible('feedback_submitted', {
          props: {
            rating: selectedRating,
            movies_seen: generateCounter
          }
        });
      }
      sendFeedbackToGoogle(selectedRating, textareaEl ? textareaEl.value : '');
      setFeedbackSubmitted();
      modal.innerHTML = '<button type="button" class="feedback-close-btn" aria-label="Закрыть">&times;</button><p class="feedback-thanks">Спасибо, что оценили, это важно для развития приложения ❤️</p>';
      var successCloseBtn = modal.querySelector('.feedback-close-btn');
      if (successCloseBtn) {
        successCloseBtn.addEventListener('click', function () {
          closeFeedbackModal();
        });
      }
      setTimeout(closeFeedbackModal, 2000);
    });
    document.body.appendChild(overlay);
  }
  window.openFeedbackModal = openFeedbackModal;

  /** Renders one ready movie object (backend-resolved). No TMDB calls. Skips if missing critical data. */
  function renderMovie(movie) {
    if (!movie || !(movie.title && String(movie.title).trim())) return;
    if (loadingPhraseIntervalId) {
      clearInterval(loadingPhraseIntervalId);
      loadingPhraseIntervalId = null;
    }
    var displayTitle = String(movie.title).trim();
    var overview = (movie.overview && String(movie.overview).trim()) ? String(movie.overview).trim() : '';
    // Priority: 1. horizontal backdrop (16:9), 2. vertical poster (2:3), 3. placeholder
    var posterUrl = null;
    if (movie.backdrop_url && String(movie.backdrop_url).trim()) {
      posterUrl = movie.backdrop_url;
    } else if (movie.poster_url && String(movie.poster_url).trim()) {
      posterUrl = movie.poster_url;
    } else {
      posterUrl = null;
    }
    var year = movie.year;
    var ratingVal = (movie.rating != null && movie.rating !== '') ? String(movie.rating) : '';
    if (movie.original_title && String(movie.original_title).trim()) {
      addToGlobalHistory(String(movie.original_title).trim());
    }
    renderMovieCardFinal({
      title: displayTitle,
      posterUrl: posterUrl,
      description: overview,
      rec: {
        title: displayTitle,
        original_title: movie.original_title || displayTitle,
        year: year,
        rating: ratingVal,
        country: movie.country,
        genres: movie.genres,
        ageLimit: movie.ageLimit
      }
    });
  }

  /** Handler for "Поменяй": show next from queue or show "No more in batch" and disable. */
  function onAnotherMovieClick() {
    generateCounter++;
    if (generateCounter >= 5 && canShowFeedback() && !sessionStorage.getItem('feedback_shown_this_session')) {
      sessionStorage.setItem('feedback_shown_this_session', 'true');
      openFeedbackModal();
    }
    if (window.plausible) {
      plausible('change_movie_click', {
        props: {
          mood: state.selectedMood || 'none',
          epoch: state.selectedEpoch || 'none'
        }
      });
    }
    if (Math.random() < 0.1) {
      try {
        var snd = new Audio('assets/sound/core_sound.mp3');
        snd.play().catch(function () {});
      } catch (e) {}
    }

    currentIndex++;

    if (currentIndex >= movieQueue.length) {
      onFindMovieClick();
      return;
    }

    renderLoadingScreen();
    callWithMinLoading(function () {
      return Promise.resolve(movieQueue[currentIndex]);
    }).then(function (movie) {
      renderMovie(movie);
    });
  }

  /**
   * Renders the movie card once after TMDB. Title from TMDB only; never original_title in UI.
   * @param {{ title: string|null, posterUrl: string|null, description: string, rec: object|null }} finalData
   */
  function renderMovieCardFinal(finalData) {
    var rec = finalData.rec || null;
    var displayTitle = String(finalData.title || (rec && rec.original_title) || '').trim();

    var baseDesc = (rec && rec.description && String(rec.description).trim()) ? String(rec.description).trim() : '';
    var desc = (finalData.description && String(finalData.description).trim())
      ? String(finalData.description).trim()
      : baseDesc;

    var posterUrlRaw = finalData.posterUrl || null;
    var hasRealImage = posterUrlRaw && String(posterUrlRaw).trim();
    var posterHtml = hasRealImage
      ? '<img src="' + escapeHtml(posterUrlRaw) + '" alt="" class="result-backdrop__img loaded">'
      : '<div class="result-backdrop__placeholder">🎬</div>';

    var metaParts = [];
    if (rec && rec.ageLimit) metaParts.push(rec.ageLimit);
    if (rec && rec.year != null) metaParts.push(rec.year);
    if (rec && rec.country) metaParts.push(rec.country);
    if (rec && rec.genres) metaParts.push(rec.genres);
    var recMetaRest = metaParts.join(' • ');
    var ratingVal = (rec && rec.rating != null && rec.rating !== '') ? escapeHtml(String(rec.rating)) : '';
    var imdbBadgeHtml = ratingVal
      ? '<span id="result-imdb" class="imdb-badge">' + IMDB_ICON_SVG + '<span class="imdb-badge__rating">≈ ' + ratingVal + '</span></span>'
      : '<span id="result-imdb" class="imdb-badge" style="display:none">' + IMDB_ICON_SVG + '<span class="imdb-badge__rating"></span></span>';
    var favoriteKey = displayTitle;

    app.innerHTML =
      '<section class="screen screen-movie">' +
        '<main class="result-content">' +
          '<div id="result-backdrop" class="result-backdrop">' + posterHtml + '</div>' +
          '<div class="result-meta-row">' +
            imdbBadgeHtml +
            '<span id="result-meta" class="result-meta">' + escapeHtml(recMetaRest) + '</span>' +
          '</div>' +
          '<div class="result-desc-card">' +
            '<h2 id="result-title" class="result-card-title">' + escapeHtml(displayTitle) + '</h2>' +
            '<p id="result-description" class="result-description">' + escapeHtml(desc) + '</p>' +
          '</div>' +
        '</main>' +
        '<div class="movie-result-bottom-panel bottom-bar-container">' +
          '<div class="bottom-actions">' +
            '<button type="button" id="btn-back" class="btn-secondary-circle" aria-label="Назад">' +
              '<img src="assets/icons/back.svg" alt="" width="24" height="24">' +
            '</button>' +
            '<button type="button" id="btn-another" class="btn-primary">' +
              '<img class="btn-icon" src="assets/icons/reload.svg" alt="" width="24" height="24">' +
              '<span>Сменить</span>' +
            '</button>' +
            '<button type="button" id="btn-favorite" class="btn-secondary-circle" aria-label="В избранное">' +
              '<img src="assets/icons/favourite_off.svg" alt="" width="24" height="24">' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    if (rec && getRecommendationTitle(rec) && sessionHistory.indexOf(getRecommendationTitle(rec)) === -1) {
      sessionHistory.push(getRecommendationTitle(rec));
    }
    if (rec && (rec.original_title != null ? String(rec.original_title).trim() : '')) {
      state.viewedMovies.push(String(rec.original_title).trim());
      try { localStorage.setItem(VIEWED_MOVIES_KEY, JSON.stringify(state.viewedMovies)); } catch (e) {}
    }

    app.querySelector('#btn-back').addEventListener('click', renderMoodScreen);
    app.querySelector('#btn-another').addEventListener('click', onAnotherMovieClick);
    var btnFavorite = app.querySelector('#btn-favorite');
    updateFavoriteButtonState(btnFavorite, favoriteKey);
    if (btnFavorite) {
      btnFavorite.addEventListener('click', function () {
        showFavoriteToast();
      });
    }
    if (window.plausible) {
      plausible('movie_loaded', {
        props: {
          title: displayTitle || 'unknown',
          rating: ratingVal || 'unknown'
        }
      });
    }
  }

  /**
   * Renders movie screen from Movie object only.
   * @param {Movie} movie
   */
  function renderMovieScreen(movie) {
    var poster = movie && movie.poster;
    var displayTitle = (movie && (movie.original_title || movie.originalTitle || movie.title)) ? String(movie.original_title || movie.originalTitle || movie.title) : '';
    var posterHtml = (poster && poster.type === 'image' && poster.src)
      ? '<img src="' + escapeHtml(poster.src) + '" alt="">'
      : escapeHtml(displayTitle);
    var countriesStr = movie.countries && movie.countries.length ? movie.countries.join(', ') : '';
    var genresStr = movie.genres && movie.genres.length ? movie.genres.join(', ') : '';
    var metaRest = [movie.ageRating, movie.year, countriesStr, genresStr].filter(Boolean).join(' • ');
    var ratingVal = (movie.imdb != null && movie.imdb !== '') ? escapeHtml(String(movie.imdb)) : '';
    var imdbBadgeHtml = ratingVal
      ? '<span id="result-imdb" class="imdb-badge">' + IMDB_ICON_SVG + '<span class="imdb-badge__rating">≈ ' + ratingVal + '</span></span>'
      : '<span id="result-imdb" class="imdb-badge" style="display:none">' + IMDB_ICON_SVG + '<span class="imdb-badge__rating"></span></span>';

    app.innerHTML =
      '<section class="screen screen-movie">' +
        '<main class="result-content">' +
          '<div id="result-backdrop" class="result-backdrop">' + posterHtml + '</div>' +
          '<div class="result-meta-row">' +
            imdbBadgeHtml +
            '<span id="result-meta" class="result-meta">' + escapeHtml(metaRest) + '</span>' +
          '</div>' +
          '<div class="result-desc-card">' +
            '<h2 id="result-title" class="result-card-title">' + escapeHtml(displayTitle) + '</h2>' +
            '<p id="result-description" class="result-description">' + escapeHtml(movie.description) + '</p>' +
          '</div>' +
        '</main>' +
        '<div class="movie-result-bottom-panel bottom-bar-container">' +
          '<div class="bottom-actions">' +
            '<button type="button" id="btn-back" class="btn-secondary-circle" aria-label="Назад">' +
              '<img src="assets/icons/back.svg" alt="" width="24" height="24">' +
            '</button>' +
            '<button type="button" id="btn-another" class="btn-primary">' +
              '<img class="btn-icon" src="assets/icons/reload.svg" alt="" width="24" height="24">' +
              '<span>Сменить</span>' +
            '</button>' +
            '<button type="button" id="btn-favorite" class="btn-secondary-circle" aria-label="В избранное">' +
              '<img src="assets/icons/favourite_off.svg" alt="" width="24" height="24">' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    app.querySelector('#btn-back').addEventListener('click', renderMoodScreen);
    app.querySelector('#btn-another').addEventListener('click', onAnotherMovieClick);

    var btnFavorite = app.querySelector('#btn-favorite');
    updateFavoriteButtonState(btnFavorite, displayTitle);
    if (btnFavorite) {
      btnFavorite.addEventListener('click', function () {
        showFavoriteToast();
      });
    }
  }

  function onMoodClick(e) {
    var chip = e.target.closest('.chip[data-mood]');
    if (!chip) return;
    state.selectedMood = chip.dataset.mood;
    renderMoodScreen();
  }

  function onEpochClick(e) {
    var chip = e.target.closest('.chip[data-epoch]');
    if (!chip) return;
    var epoch = chip.dataset.epoch;
    state.selectedEpoch = state.selectedEpoch === epoch ? null : epoch;
    var container = app.querySelector('.chips-epoch-row');
    if (container) {
      container.querySelectorAll('.chip-epoch').forEach(function (c) {
        c.classList.toggle('chip--active', c.dataset.epoch === state.selectedEpoch);
      });
    }
  }

  function onRatingClick(e) {
    var chip = e.target.closest('.chip[data-rating]');
    if (!chip) return;
    var rating = chip.dataset.rating;
    state.selectedRating = state.selectedRating === rating ? null : rating;
    var container = app.querySelector('.chips-rating');
    if (container) {
      container.querySelectorAll('.chip-rating').forEach(function (c) {
        c.classList.toggle('chip--active', c.dataset.rating === state.selectedRating);
      });
    }
  }

  function onPopularityClick(e) {
    var chip = e.target.closest('.chip[data-popularity]');
    if (!chip) return;
    var id = chip.dataset.popularity;
    state.selectedPopularity = state.selectedPopularity === id ? null : id;
    var container = app.querySelector('.chips-popularity-row');
    if (container) {
      container.querySelectorAll('.chip-popularity').forEach(function (c) {
        c.classList.toggle('chip--active', c.dataset.popularity === state.selectedPopularity);
      });
    }
  }

  function doFetchRecommendations() {
    renderLoadingScreen();
    var opts = {
      mood: state.selectedMood || 'neutral',
      epoch: state.selectedEpoch,
      rating: state.selectedRating,
      popularity: state.selectedPopularity
    };
    callWithMinLoading(function () { return getRecommendationWithRetrySafe(opts, 1); }).then(function (result) {
      if (!result || result._error) {
        renderServerErrorScreen('Интернет немножечко подзабил — рекомендации вернуть не смогли. Попробуй ещё разочек нажать.');
        return;
      }
      movieQueue = result.recommendations || [];
      currentIndex = 0;
      if (!movieQueue.length) {
        renderServerErrorScreen('Интернет немножечко подзабил — рекомендации вернуть не смогли. Попробуй ещё разочек нажать.');
        return;
      }
      renderMovie(movieQueue[0]);
    });
  }

  function onFindMovieClick() {
    generateCounter++;
    if (generateCounter >= 5 && canShowFeedback() && !sessionStorage.getItem('feedback_shown_this_session')) {
      sessionStorage.setItem('feedback_shown_this_session', 'true');
      openFeedbackModal();
    }
    if (window.plausible) {
      plausible('generate_click', {
        props: {
          mood: state.selectedMood || 'none',
          epoch: state.selectedEpoch || 'none',
          rating: state.selectedRating || 'none',
          popularity: state.selectedPopularity || 'none'
        }
      });
    }
    doFetchRecommendations();
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