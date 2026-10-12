import { fetchProjects } from '../../api.js';
import { useResource } from '../../lib/useResource.js';

// Список проектов со статистикой. load() перечитывает список с сервера.
export function useProjectList() {
  const { data, loaded, error, setError, load } = useResource(fetchProjects, []);
  return { projects: data, loaded, error, setError, load };
}
