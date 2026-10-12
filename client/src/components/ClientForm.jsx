import { useState } from 'react';
import { createClient, updateClient } from '../api.js';
import { RATE_KINDS, RATE_LABELS, CURRENCIES } from '../../../shared/crm.js';

function toForm(client) {
  return {
    name: client?.name || '',
    company: client?.company || '',
    email: client?.email || '',
    phone: client?.phone || '',
    notes: client?.notes || '',
    rateKind: client?.rate?.kind || 'hourly',
    rateAmount: client?.rate?.amount ?? 0,
    rateCurrency: client?.rate?.currency || 'RUB',
  };
}

export default function ClientForm({ client, onSaved, onCancel, onDelete }) {
  const [form, setForm] = useState(() => toForm(client));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(client);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = {
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim(),
      rate: {
        kind: form.rateKind,
        amount: Number(form.rateAmount) || 0,
        currency: form.rateCurrency,
      },
    };
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
      <h2>{isEdit ? 'Клиент' : 'Новый клиент'}</h2>

      <div className="grid-2">
        <label>
          Имя
          <input value={form.name} onChange={set('name')} required />
        </label>
        <label>
          Компания
          <input value={form.company} onChange={set('company')} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={set('email')} />
        </label>
        <label>
          Телефон
          <input value={form.phone} onChange={set('phone')} />
        </label>
        <label>
          Тип оплаты
          <select value={form.rateKind} onChange={set('rateKind')}>
            {RATE_KINDS.map((k) => <option key={k} value={k}>{RATE_LABELS[k]}</option>)}
          </select>
        </label>
        <label>
          Ставка или сумма
          <div className="inline">
            <input type="number" min="0" value={form.rateAmount} onChange={set('rateAmount')} />
            <select value={form.rateCurrency} onChange={set('rateCurrency')}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </label>
      </div>

      <label>
        Заметки
        <textarea value={form.notes} onChange={set('notes')} rows={3} />
      </label>

      <div className="actions">
        <button type="submit" disabled={busy || !form.name.trim()}>
          {isEdit ? 'Сохранить' : 'Создать'}
        </button>
        <button type="button" className="ghost" onClick={onCancel}>Отмена</button>
        {onDelete && <button type="button" className="danger" onClick={onDelete}>Удалить</button>}
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
