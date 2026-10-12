import { Radio, Typography } from 'antd';

// Один вариант хранилища: переключатель, бакет или подсказка «не настроено»
export default function ProviderOption({ provider, busy }) {
  return (
    <div>
      <Radio value={provider.id} disabled={busy || !provider.configured}>{provider.label}</Radio>
      <Typography.Text type="secondary" style={{ display: 'block', marginLeft: 24 }}>
        {provider.configured ? `бакет ${provider.bucket}` : 'не настроено: задайте переменные окружения на сервере'}
      </Typography.Text>
    </div>
  );
}
