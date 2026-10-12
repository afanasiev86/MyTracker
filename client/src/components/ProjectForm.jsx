import { useEffect, useState } from 'react';
import { createProject, updateProject, fetchClients } from '../api.js';
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, SLUG_PATTERN } from '../../../shared/crm.js';
import { toForm } from './project/toForm.js';
import { buildProjectBody } from './project/buildProjectBody.js';
import SlugField from './project/SlugField.jsx';
import PriceField from './project/PriceField.jsx';

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
    const body = buildProjectBody(form);
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
        <SlugField value={form.slug} onChange={set('slug')} isEdit={isEdit} valid={slugOk} />
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
        <PriceField
          amount={form.priceAmount}
          currency={form.priceCurrency}
          onAmount={set('priceAmount')}
          onCurrency={set('priceCurrency')}
        />
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
