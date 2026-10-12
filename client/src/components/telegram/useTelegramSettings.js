import { useState } from 'react';
import { fetchTelegram, saveTelegram, deleteTelegram } from '../../api.js';
import { useResource } from '../../lib/useResource.js';

// Состояние Telegram-бота, подключение и отключение. result — итог последнего сохранения.
export function useTelegramSettings() {
  const { data: state, setData: setState, error, setError } = useResource(fetchTelegram, null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  async function run(action) {
    setBusy(true);
    setError('');
    setResult(null);
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

  const connect = (settings) => run(() => saveTelegram(settings)).then((next) => {
    if (next) setResult({ ownerReachable: next.ownerReachable });
    return Boolean(next);
  });
  const disconnect = () => run(deleteTelegram);

  return { state, error, busy, result, connect, disconnect };
}
