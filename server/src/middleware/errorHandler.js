export function errorHandler(err, _req, res, _next) {
  if (err.name === 'ZodError') {
    const message = err.issues[0]?.message || 'Некорректные данные';
    return res.status(400).json({ error: message, details: err.issues });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Некорректный ID' });
  }
  // Нарушение уникальности (например, slug проекта)
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Такая запись уже существует' });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  return res.status(status).json({ error: status >= 500 ? 'Внутренняя ошибка' : err.message });
}
