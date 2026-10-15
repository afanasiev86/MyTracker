import { useState } from 'react';
import { Alert, Button, Card, Flex, Form, Input, Tag } from 'antd';
import { confirmAction } from '../lib/telegram/confirm.js';
import Field from './Field.jsx';
import Loading from './Loading.jsx';
import { useGithubSettings } from './github/useGithubSettings.js';

const SOURCE_NOTE = {
  env: 'Токен задан переменной окружения на сервере. Токен ниже заменит его.',
};

// Подключение GitHub: токен вводится здесь и после сохранения не показывается.
export default function GithubSettings() {
  const { state, error, busy, connect, disconnect } = useGithubSettings();

  if (!state) {
    return error ? <Alert type="error" showIcon message={error} /> : <Loading text="Загрузка…" />;
  }

  return <GithubForm state={state} error={error} busy={busy} connect={connect} disconnect={disconnect} />;
}

function GithubForm({ state, error, busy, connect, disconnect }) {
  const [token, setToken] = useState('');

  async function submit() {
    if (await connect(token.trim())) setToken('');
  }

  async function remove() {
    if (!(await confirmAction('Отключить GitHub? Проекты перестанут создавать репозитории и синхронизироваться.'))) return;
    await disconnect();
  }

  return (
    <Card
      title="GitHub"
      style={{ marginBottom: 16 }}
      extra={state.connected
        ? <Tag color="green">{state.login ? `Подключён ${state.login}` : 'Подключён'}</Tag>
        : <Tag>Не подключён</Tag>}
    >
      {SOURCE_NOTE[state.source] && (
        <Alert type="info" showIcon message={SOURCE_NOTE[state.source]} style={{ marginBottom: 16 }} />
      )}

      <Form layout="vertical" onFinish={submit}>
        <Field
          label="Токен GitHub"
          extra={(
            <>
              Нужен fine-grained токен (GitHub → Settings → Developer settings → Personal access tokens) с доступом
              ко всем репозиториям и правами: Administration и Contents на чтение и запись, Metadata на чтение.
              Токен проверяется при сохранении и потом не показывается.
            </>
          )}
        >
          <Input.Password
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
            placeholder={state.connected ? 'Токен сохранён. Введите новый, чтобы заменить' : 'github_pat_…'}
          />
        </Field>

        <Flex wrap gap={8}>
          <Button type="primary" htmlType="submit" loading={busy} disabled={token.trim() === ''}>
            Проверить и сохранить
          </Button>
          {state.source === 'ui' && <Button danger disabled={busy} onClick={remove}>Отключить</Button>}
        </Flex>
      </Form>

      {error && <Alert type="error" showIcon message={error} style={{ marginTop: 16 }} />}
    </Card>
  );
}
