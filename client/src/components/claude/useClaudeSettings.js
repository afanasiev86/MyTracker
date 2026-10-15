import { useState } from 'react';
import { fetchClaude, saveClaude, deleteClaude } from '../../api.js';
import { useResource } from '../../lib/useResource.js';

// Состояние подключения аккаунта Claude, подключение и отключение
export function useClaudeSettings() {
  const { data: state, setData: setState, error, setError } = useResource(fetchClaude, null);
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

  const connect = (payload) => run(() => saveClaude(payload)).then(Boolean);
  const disconnect = () => run(deleteClaude);

  return { state, error, busy, connect, disconnect };
}
