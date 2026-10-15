import { useState } from 'react';
import { Alert, Button, Card, Divider, Flex, Form, Input, Select, Tag } from 'antd';
import { confirmAction } from '../lib/telegram/confirm.js';
import Field from './Field.jsx';
import Loading from './Loading.jsx';
import { useClaudeSettings } from './claude/useClaudeSettings.js';
import ClaudeLogin from './claude/ClaudeLogin.jsx';

const TYPE_OPTIONS = [
  { value: 'api_key', label: 'API-ключ (console.anthropic.com)' },
  { value: 'oauth_token', label: 'Долгоживущий токен (claude setup-token)' },
];

// Подключение аккаунта Claude: если на одном аккаунте закончился лимит, можно переключить задачи на другой —
// ключ или токен вводится здесь, запрос к Anthropic при сохранении не делается (нет общего «whoami»).
export default function ClaudeSettings() {
  const claude = useClaudeSettings();
  const { state, error } = claude;

  if (!state) {
    return error ? <Alert type="error" showIcon message={error} /> : <Loading text="Загрузка…" />;
  }

  return <ClaudeForm {...claude} />;
}

function ClaudeForm({ state, error, busy, connect, disconnect, loginUrl, startLogin, finishLogin, cancelLogin }) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('api_key');
  const [token, setToken] = useState('');

  async function submit() {
    if (await connect({ token: token.trim(), type, label: label.trim() })) {
      setLabel('');
      setToken('');
    }
  }

  async function remove() {
    if (!(await confirmAction('Отключить аккаунт Claude? Задачи вернутся на аккаунт, залогиненный на сервере.'))) return;
    await disconnect();
  }

  const canSubmit = token.trim() !== '' && label.trim() !== '';

  return (
    <Card
      title="Claude"
      style={{ marginBottom: 16 }}
      extra={state.connected
        ? <Tag color="green">{`Подключён: ${state.label}`}</Tag>
        : <Tag>Аккаунт сервера</Tag>}
    >
      <ClaudeLogin loginUrl={loginUrl} busy={busy} onStart={startLogin} onFinish={finishLogin} onCancel={cancelLogin} />

      <Divider plain>или вставьте ключ вручную</Divider>

      <Form layout="vertical" onFinish={submit}>
        <Field label="Метка аккаунта" extra="Любое имя, чтобы отличать аккаунты между собой">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Например, «Второй аккаунт»" />
        </Field>

        <Field label="Тип ключа">
          <Select value={type} onChange={setType} options={TYPE_OPTIONS} />
        </Field>

        <Field
          label="Ключ или токен"
          extra="API-ключ из console.anthropic.com или токен из claude setup-token. Сохраняется зашифрованным и после сохранения не показывается."
        >
          <Input.Password
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
            placeholder={state.connected ? 'Сохранён. Введите новый, чтобы сменить аккаунт' : 'sk-ant-…'}
          />
        </Field>

        <Flex wrap gap={8}>
          <Button type="primary" htmlType="submit" loading={busy} disabled={!canSubmit}>
            Сменить аккаунт
          </Button>
          {state.connected && <Button danger disabled={busy} onClick={remove}>Отключить</Button>}
        </Flex>
      </Form>

      {error && <Alert type="error" showIcon message={error} style={{ marginTop: 16 }} />}
    </Card>
  );
}
