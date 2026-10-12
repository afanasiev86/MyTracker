import { fetchTasks, fetchCosts } from '../../api.js';
import { useResource } from '../../lib/useResource.js';
import { sortByOrder } from '../../../../shared/taskOrder.js';

// Задачи и расходы для доски. load() перечитывает оба списка.
const loadBoard = () =>
  Promise.all([fetchTasks(), fetchCosts()]).then(([tasks, costs]) => ({ tasks, costs }));

export function useBoardData() {
  const { data, setData, loaded, error, setError, load } = useResource(loadBoard, { tasks: [], costs: [] });

  // Карточка сразу встаёт на новое место, не дожидаясь ответа сервера (порядок считается так же, как на сервере)
  const patchTaskLocally = (id, patch) =>
    setData((prev) => ({
      ...prev,
      tasks: sortByOrder(prev.tasks.map((t) => (t._id === id ? { ...t, ...patch } : t))),
    }));

  return { tasks: data.tasks, costs: data.costs, error, setError, loaded, load, patchTaskLocally };
}
