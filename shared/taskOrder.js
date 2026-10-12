// Порядок карточек в колонке доски. Меньше ключ — выше карточка.
// У задачи без ручной сортировки (поле order не задано) ключ берётся из updatedAt: новее выше, как было до перетаскивания.
export const orderKey = (task) => task.order ?? -new Date(task.updatedAt).getTime();

export const compareByOrder = (a, b) => orderKey(a) - orderKey(b);

export const sortByOrder = (tasks) => [...tasks].sort(compareByOrder);

// Значение order для карточки, которая встаёт между соседями (любой из них может отсутствовать)
export function orderBetween(prev, next) {
  if (!prev && !next) return -Date.now();
  if (!prev) return orderKey(next) - 1;
  if (!next) return orderKey(prev) + 1;
  return (orderKey(prev) + orderKey(next)) / 2;
}
