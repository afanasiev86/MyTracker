import { CURRENCIES } from '../../../../shared/crm.js';

// Сумма по проекту и валюта
export default function PriceField({ amount, currency, onAmount, onCurrency }) {
  return (
    <label>
      Сумма по проекту
      <div className="inline">
        <input type="number" min="0" value={amount} onChange={onAmount} />
        <select value={currency} onChange={onCurrency}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </label>
  );
}
