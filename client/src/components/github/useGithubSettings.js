import { useState } from 'react';
import { fetchGithub, saveGithub, deleteGithub } from '../../api.js';
import { useResource } from '../../lib/useResource.js';

// Состояние подключения GitHub, подключение и отключение
export function useGithubSettings() {
  const { data: state, setData: setState, error, setError } = useResource(fetchGithub, null);
  const [busy, setBusy] = useState(false);

  async function run(action) {
    setBusy(true);
    setError('');
    try {
      const next = await action();
      setState(next);
      return next;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  const connect = (token) => run(() => saveGithub(token)).then(Boolean);
  const disconnect = () => run(deleteGithub);

  return { state, error, busy, connect, disconnect };
}
