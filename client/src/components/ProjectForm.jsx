import { useEffect, useState } from 'react';
import { createProject, updateProject, fetchClients } from '../api.js';
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  CURRENCIES,
  SLUG_PATTERN,
} from '../../../shared/crm.js';

function toForm(project) {
  if (!project) {
    return {
      slug: '', name: '', client: '', description: '', status: 'active',
      repoUrl: '', defaultBranch: 'main', deadline: '',
      priceAmount: 0, priceCurrency: 'RUB',
    };
  }
  return {
    slug: project.slug,
    name: project.name,
    client: project.client?._id || project.client || '',
    description: project.description || '',
    status: project.status,
    repoUrl: project.repoUrl || '',
    defaultBranch: project.defaultBranch || 'main',
    deadline: project.deadline ? project.deadline.slice(0, 10) : '',
    priceAmount: project.price?.amount ?? 0,
    priceCurrency: project.price?.currency || 'RUB',
  };
}

export default function ProjectForm({ project, onSaved, onCancel, onDelete }) {
  const [form, setForm] = useState(() => toForm(project));
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(project);

  useEffect(() => {
    fetchClients().then(setClients).catch(() => setClients([]));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const slugOk = SLUG_PATTERN.test(form.slug);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = {
      slug: form.slug.trim().toLowerCase(),
      name: form.name.trim(),
      client: form.client || null,
      description: form.description.trim(),
      status: form.status,
      repoUrl: form.repoUrl.trim(),
      defaultBranch: form.defaultBranch.trim() || 'main',
      deadline: form.deadline || null,
      price: { amount: Number(form.priceAmount) || 0, currency: form.priceCurrency },
    };
    try {
      if (isEdit) await updateProject(project._id, body);
      else await createProject(body);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>{isEdit ? 'Редактирование проекта' : 'Новый проект'}</h2>

      <div className="grid-2">
        <label>
          Название
          <input value={form.name} onChange={set('name')} required />
        </label>
        <label>
          Код проекта
          <input
            value={form.slug}
            onChange={set('slug')}
            placeholder="shop-api"
            disabled={isEdit}
            required
            aria-describedby="slug-hint"
          />
          <span id="slug-hint" className="hint">
            {isEdit
              ? 'Код менять нельзя: по нему привязаны задачи.'
              : 'Латиница, цифры и дефис. Должен совпадать с папкой репозитория на сервере.'}
          </span>
          {form.slug && !slugOk && (
            <span className="error" role="alert">Пока не подходит: используйте латиницу, цифры и дефис.</span>
          )}
        </label>
        <label>
          Клиент
          <select value={form.client} onChange={set('client')}>
            <option value="">Без клиента</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          Статус
          <select value={form.status} onChange={set('status')}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </label>
        <label>
          Репозиторий (ссылка)
          <input value={form.repoUrl} onChange={set('repoUrl')} placeholder="https://github.com/..." />
        </label>
        <label>
          Основная ветка
          <input value={form.defaultBranch} onChange={set('defaultBranch')} />
        </label>
        <label>
          Срок сдачи
          <input type="date" value={form.deadline} onChange={set('deadline')} />
        </label>
        <label>
          Сумма по проекту
          <div className="inline">
            <input
              type="number"
              min="0"
              value={form.priceAmount}
              onChange={set('priceAmount')}
            />
            <select value={form.priceCurrency} onChange={set('priceCurrency')}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </label>
      </div>

      <label>
        Описание
        <textarea value={form.description} onChange={set('description')} rows={3} />
      </label>

      <div className="actions">
        <button type="submit" disabled={busy || !slugOk || !form.name.trim()}>
          {busy ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Создать проект'}
        </button>
        <button type="button" className="ghost" onClick={onCancel}>Отмена</button>
        {onDelete && <button type="button" className="danger" onClick={onDelete}>Удалить проект</button>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
