import { useEffect, useState } from 'react';
import { fetchProjects } from '../../api.js';

// Список проектов для выбора. Если форма ещё без проекта, выбирается первый активный.
export function useProjects(setForm, setError) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects()
      .then((list) => {
        setProjects(list);
        const active = list.find((p) => p.status === 'active');
        if (active) setForm((f) => ({ ...f, project: f.project || active.slug }));
      })
      .catch((err) => setError(err.message));
  }, [setForm, setError]);

  return projects;
}
