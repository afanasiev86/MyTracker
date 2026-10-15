import { useState } from 'react';
import { fetchClaude, saveClaude, deleteClaude, startClaudeLogin, finishClaudeLogin, cancelClaudeLogin } from '../../api.js';
import { useResource } from '../../lib/useResource.js';

// Состояние подключения аккаунта Claude, подключение, отключение и вход через подписку (ссылка, затем код)
export function useClaudeSettings() {
  const { data: state, setData: setState, error, setError } = useResource(fetchClaude, null);
  const [busy, setBusy] = useState(false);
  // Ссылка для входа в подписку, пока вход идёт; пустая строка, если вход не начат
  const [loginUrl, setLoginUrl] = useState('');

  // Выполняет действие с индикатором и ошибкой. Ответ действия возвращается, null при ошибке.
  async function run(action) {
    setBusy(true);
    setError('');
    try {
      return await action();
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  // Действие, ответ которого — новое состояние подключения
  async function runState(action) {
    const next = await run(action);
    if (next) setState(next);
    return next;
  }

  const connect = (payload) => runState(() => saveClaude(payload)).then(Boolean);
  const disconnect = () => runState(deleteClaude);

  async function startLogin() {
    const result = await run(startClaudeLogin);
    if (result?.url) setLoginUrl(result.url);
    return Boolean(result?.url);
  }

  async function finishLogin(payload) {
    const next = await runState(() => finishClaudeLogin(payload));
    if (next) setLoginUrl('');
    return Boolean(next);
  }

  async function cancelLogin() {
    await run(cancelClaudeLogin);
    setLoginUrl('');
  }

  return { state, error, busy, connect, disconnect, loginUrl, startLogin, finishLogin, cancelLogin };
}
