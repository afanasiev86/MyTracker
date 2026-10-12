import { useStorageSettings } from './storage/useStorageSettings.js';
import ProviderOption from './storage/ProviderOption.jsx';

// Настройки: выбор хранилища для вложений. Ключи доступа здесь не показываются и не меняются.
export default function Settings() {
  const { state, error, busy, choose } = useStorageSettings();

  if (!state) {
    return <section className="panel">{error || 'Загрузка…'}</section>;
  }

  return (
    <section className="panel">
      <h2>Хранилище вложений</h2>
      <p className="muted">
        Новые скриншоты сохраняются в выбранное хранилище. Уже загруженные файлы остаются там, где были.
      </p>
      <fieldset className="radio-list">
        <legend>Куда сохранять</legend>
        {state.providers.map((p) => (
          <ProviderOption key={p.id} provider={p} active={state.active} busy={busy} onChoose={choose} />
        ))}
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
