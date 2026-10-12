import { useCallback, useEffect, useState } from 'react';
import { fetchClients } from '../../api.js';

// Список клиентов. load() перечитывает список с сервера.
export function useClients() {
  const [clients, setClients] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    () =>
      fetchClients()
        .then(setClients)
        .catch((err) => setError(err.message))
        .finally(() => setLoaded(true)),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  return { clients, loaded, error, setError, load };
}
