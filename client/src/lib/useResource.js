import { useCallback, useEffect, useRef, useState } from 'react';

// Загрузка данных с сервера: значение, признак «загружено», ошибка и перезагрузка.
// fetcher вызывается при монтировании и при каждом load(). Успешная загрузка сбрасывает ошибку.
export function useResource(fetcher, initial) {
  const [data, setData] = useState(initial);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  // Всегда свежая функция загрузки, но сама load() не меняется между рендерами
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(
    () =>
      fetcherRef.current()
        .then((value) => {
          setData(value);
          setError('');
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoaded(true)),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, loaded, error, setError, load };
}
