import { useEffect, useState } from 'react';
import { fetchStorage, saveStorage } from '../../api.js';

// Состояние выбора хранилища и сохранение выбранного провайдера
export function useStorageSettings() {
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

  return { state, error, busy, choose };
}
