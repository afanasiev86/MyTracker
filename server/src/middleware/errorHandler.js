export function errorHandler(err, _req, res, _next) {
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Некорректные данные', details: err.issues });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Некорректный ID' });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  return res.status(status).json({ error: status >= 500 ? 'Внутренняя ошибка' : err.message });
}
