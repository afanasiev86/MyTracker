import { useEffect } from 'react';
import { fetchOps } from '../../api.js';
import { useResource } from '../../lib/useResource.js';

const REFRESH_MS = 15000;
const REFRESH_WHILE_DEPLOY_MS = 4000;

// Состояние сервера. Обновляется само: чаще, пока идёт обновление MyTracker.
export function useOpsStatus() {
  const { data: state, error, setError, load } = useResource(fetchOps, null);
  const deploying = Boolean(state?.deploy?.running);

  useEffect(() => {
    const timer = setInterval(load, deploying ? REFRESH_WHILE_DEPLOY_MS : REFRESH_MS);
    return () => clearInterval(timer);
  }, [load, deploying]);

  return { state, error, setError, load };
}
