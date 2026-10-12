import { useState } from 'react';
import { fetchStorage, saveStorage } from '../../api.js';
import { useResource } from '../../lib/useResource.js';

// Состояние выбора хранилища и сохранение выбранного провайдера
export function useStorageSettings() {
  const { data: state, setData: setState, error, setError } = useResource(fetchStorage, null);
  const [busy, setBusy] = useState(false);

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
