import { useEffect, useState } from 'react';
import { fetchStorage, saveStorage } from '../api.js';

// Настройки: выбор хранилища для вложений. Ключи доступа здесь не показываются и не меняются.
export default function Settings() {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchStorage().then(setState).catch((err) => setError(err.message));
  }, []);

  async function choose(provider) {
    setBusy(true);
    setError('');
    try {
      setState(await saveStorage(provider));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return <section className="panel">{error || 'Загрузка…'}</section>;
  }

  return (
    <section className="panel">
      <h2>Хранилище вложений</h2>
      <p className="muted">
        Новые скриншоты сохраняются в выбранное хранилище. Уже загруженные файлы остаются там, где были.
      </p>
      <fieldset className="radio-list">
        <legend>Куда сохранять</legend>
        {state.providers.map((p) => (
          <label key={p.id} className="radio-row">
            <input
              type="radio"
              name="storage"
              value={p.id}
              checked={state.active === p.id}
              disabled={busy || !p.configured}
              onChange={() => choose(p.id)}
            />
            <span>{p.label}</span>
            <span className="muted">
              {p.configured ? `бакет ${p.bucket}` : 'не настроено: задайте переменные окружения на сервере'}
            </span>
          </label>
        ))}
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
