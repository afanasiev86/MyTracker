import { useCallback, useEffect, useState } from 'react';
import { fetchProjects } from '../../api.js';

// Список проектов со статистикой. load() перечитывает список с сервера.
export function useProjectList() {
  const [projects, setProjects] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    () =>
      fetchProjects()
        .then(setProjects)
        .catch((err) => setError(err.message))
        .finally(() => setLoaded(true)),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  return { projects, loaded, error, setError, load };
}
