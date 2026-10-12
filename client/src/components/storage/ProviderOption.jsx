// Один вариант хранилища: переключатель, бакет или подсказка «не настроено»
export default function ProviderOption({ provider, active, busy, onChoose }) {
  return (
    <label className="radio-row">
      <input
        type="radio"
        name="storage"
        value={provider.id}
        checked={active === provider.id}
        disabled={busy || !provider.configured}
        onChange={() => onChoose(provider.id)}
      />
      <span>{provider.label}</span>
      <span className="muted">
        {provider.configured ? `бакет ${provider.bucket}` : 'не настроено: задайте переменные окружения на сервере'}
      </span>
    </label>
  );
}
