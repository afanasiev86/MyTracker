// Даты из JSON приходят строками: переводим в Date, пустую дату — в null
export function normalize(data) {
  const out = { ...data };
  if (out.dueDate !== undefined) out.dueDate = out.dueDate ? new Date(out.dueDate) : null;
  return out;
}

// Экранирует спецсимволы, чтобы поиск по названию был обычным текстом
export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
