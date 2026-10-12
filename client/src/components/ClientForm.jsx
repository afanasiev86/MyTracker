import { useState } from 'react';
import { createClient, updateClient } from '../api.js';
import { toClientForm } from './clientForm/toClientForm.js';
import { buildClientBody } from './clientForm/buildClientBody.js';
import ContactFields from './clientForm/ContactFields.jsx';
import RateFields from './clientForm/RateFields.jsx';

export default function ClientForm({ client, onSaved, onCancel, onDelete }) {
  const [form, setForm] = useState(() => toClientForm(client));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(client);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = buildClientBody(form);
    try {
      if (isEdit) await updateClient(client._id, body);
      else await createClient(body);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>{isEdit ? 'Редактирование клиента' : 'Новый клиент'}</h2>

      <div className="grid-2">
        <ContactFields form={form} set={set} />
        <RateFields form={form} set={set} />
      </div>

      <label>
        Заметки
        <textarea value={form.notes} onChange={set('notes')} rows={3} />
      </label>

      <div className="actions">
        <button type="submit" disabled={busy || !form.name.trim()}>
          {busy ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Добавить клиента'}
        </button>
        <button type="button" className="ghost" onClick={onCancel}>Отмена</button>
        {onDelete && <button type="button" className="danger" onClick={onDelete}>Удалить клиента</button>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
