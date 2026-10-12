import { fetchPortalMe, fetchPortalTasks } from '../../api.js';
import { useResource } from '../../lib/useResource.js';

// Имя заказчика и его задачи. load() перечитывает данные.
const loadPortal = () =>
  Promise.all([fetchPortalMe(), fetchPortalTasks()]).then(([me, list]) => ({
    name: me.name,
    tasks: list,
  }));

export function usePortal() {
  const { data, loaded, error, load } = useResource(loadPortal, { name: '', tasks: [] });
  return { name: data.name, tasks: data.tasks, loaded, error, load };
}
