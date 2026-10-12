import { useCallback, useEffect, useState } from 'react';
import { fetchPortalMe, fetchPortalTasks } from '../../api.js';

// Имя заказчика и его задачи. load() перечитывает данные.
export function usePortal() {
  const [name, setName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    () =>
      Promise.all([fetchPortalMe(), fetchPortalTasks()])
        .then(([me, list]) => {
          setName(me.name);
          setTasks(list);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoaded(true)),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  return { name, tasks, loaded, error, load };
}
