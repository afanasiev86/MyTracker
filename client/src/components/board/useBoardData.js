import { fetchTasks, fetchCosts } from '../../api.js';
import { useResource } from '../../lib/useResource.js';

// Задачи и расходы для доски. load() перечитывает оба списка.
const loadBoard = () =>
  Promise.all([fetchTasks(), fetchCosts()]).then(([tasks, costs]) => ({ tasks, costs }));

export function useBoardData() {
  const { data, loaded, error, load } = useResource(loadBoard, { tasks: [], costs: [] });
  return { tasks: data.tasks, costs: data.costs, error, loaded, load };
}
