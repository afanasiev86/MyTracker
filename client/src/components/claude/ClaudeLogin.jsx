import { useState } from 'react';
import { Button, Flex, Input, Steps, Typography } from 'antd';
import Field from '../Field.jsx';

const DEFAULT_LABEL = 'Подписка Pro';

// Вход в подписку Claude без доступа к серверу: сервер даёт ссылку, владелец открывает её в браузере (на телефоне тоже),
// входит в аккаунт с подпиской и вставляет сюда код со страницы. Токен получает и хранит сервер, сюда он не приходит.
export default function ClaudeLogin({ loginUrl, busy, onStart, onFinish, onCancel }) {
  const [code, setCode] = useState('');
  const [label, setLabel] = useState(DEFAULT_LABEL);

  async function finish() {
    if (await onFinish({ code: code.trim(), label: label.trim() })) setCode('');
  }

  if (!loginUrl) {
    return (
      <Flex vertical gap={8}>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Подходит для подписки Claude Pro или Max. Доступ к серверу не нужен: войдёте через браузер, а токен сервер сохранит сам.
        </Typography.Paragraph>
        <div>
          <Button type="primary" loading={busy} onClick={onStart}>Войти через подписку</Button>
        </div>
      </Flex>
    );
  }

  return (
    <Flex vertical gap={12}>
      <Steps
        direction="vertical"
        size="small"
        current={-1}
        items={[
          { title: 'Откройте страницу входа', description: 'Войдите в аккаунт с подпиской и разрешите доступ' },
          { title: 'Скопируйте код', description: 'Страница покажет длинный код, скопируйте его целиком' },
          { title: 'Вставьте код ниже', description: 'Код действует недолго, вход закроется сам через 10 минут' },
        ]}
      />
      <div>
        <Button href={loginUrl} target="_blank" rel="noopener noreferrer">Открыть страницу входа</Button>
      </div>
      <Field label="Код со страницы входа">
        <Input.TextArea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          autoSize={{ minRows: 2, maxRows: 4 }}
          placeholder="Вставьте код"
        />
      </Field>
      <Field label="Метка аккаунта" extra="Любое имя, чтобы отличать аккаунты между собой">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} />
      </Field>
      <Flex wrap gap={8}>
        <Button type="primary" loading={busy} disabled={code.trim() === '' || label.trim() === ''} onClick={finish}>
          Завершить вход
        </Button>
        <Button disabled={busy} onClick={onCancel}>Отмена</Button>
      </Flex>
    </Flex>
  );
}
