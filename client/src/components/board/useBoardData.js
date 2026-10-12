import { useCallback, useEffect, useState } from 'react';
import { fetchTasks, fetchCosts } from '../../api.js';

// Задачи и расходы для доски. load() перечитывает оба списка.
export function useBoardData() {
  const [tasks, setTasks] = useState([]);
  const [costs, setCosts] = useState([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(
    () =>
      Promise.all([fetchTasks(), fetchCosts()])
        .then(([taskList, costList]) => {
          setTasks(taskList);
          setCosts(costList);
          setError('');
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoaded(true)),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  return { tasks, costs, error, loaded, load };
}
