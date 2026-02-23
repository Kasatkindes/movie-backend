module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Тестовый ответ без нейронки
  res.status(200).json({
    movie: {
      title: "Связь установлена!",
      year: 2024,
      countries: ["Vercel"],
      genres: ["Тест"],
      ageRating: "0+",
      imdb: 10.0,
      description: "Если ты видишь это, значит бэкенд ожил. Теперь можно возвращать нейронку."
    },
    reason: "Проверка связи"
  });
};