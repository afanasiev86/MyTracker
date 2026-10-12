import { RATE_KINDS, RATE_LABELS, CURRENCIES } from '../../../../shared/crm.js';

// Тип оплаты, ставка или сумма и валюта
export default function RateFields({ form, set }) {
  return (
    <>
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
    </>
  );
}
