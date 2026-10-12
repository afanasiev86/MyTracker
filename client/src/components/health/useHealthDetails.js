import { useEffect } from 'react';
import { fetchHealthDetails } from '../../api.js';
import { useResource } from '../../lib/useResource.js';
import { REFRESH_MS } from './constants.js';

// Подробное состояние для владельца; обновляется каждые REFRESH_MS
export function useHealthDetails() {
  const { data, error, load } = useResource(fetchHealthDetails, null);

  useEffect(() => {
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  return { data, error, load };
}
