import { useEffect, useState } from 'react';
import { fetchHealthDetails } from '../../api.js';
import { REFRESH_MS } from './constants.js';

// Подробное состояние для владельца; обновляется каждые REFRESH_MS
export function useHealthDetails() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    fetchHealthDetails()
      .then((d) => { setData(d); setError(''); })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  return { data, error, load };
}
