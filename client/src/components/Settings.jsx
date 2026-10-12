import { Alert, Card, Flex, Radio, Typography } from 'antd';
import { useStorageSettings } from './storage/useStorageSettings.js';
import ProviderOption from './storage/ProviderOption.jsx';
import Loading from './Loading.jsx';

// Настройки: выбор хранилища для вложений. Ключи доступа здесь не показываются и не меняются.
export default function Settings() {
  const { state, error, busy, choose } = useStorageSettings();

  if (!state) {
    return error ? <Alert type="error" showIcon message={error} /> : <Loading text="Загрузка…" />;
  }

  return (
    <Card title="Хранилище вложений" style={{ marginBottom: 16 }}>
      <Typography.Paragraph type="secondary">
        Новые скриншоты сохраняются в выбранное хранилище. Уже загруженные файлы остаются там, где были.
      </Typography.Paragraph>
      <Typography.Text strong>Куда сохранять</Typography.Text>
      <Radio.Group
        value={state.active}
        onChange={(e) => choose(e.target.value)}
        style={{ display: 'block', marginTop: 8 }}
      >
        <Flex vertical gap={12}>
          {state.providers.map((p) => (
            <ProviderOption key={p.id} provider={p} busy={busy} />
          ))}
        </Flex>
      </Radio.Group>
      {error && <Alert type="error" showIcon message={error} style={{ marginTop: 12 }} />}
    </Card>
  );
}
