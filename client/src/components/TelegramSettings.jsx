import { useState } from 'react';
import { Alert, Button, Card, Flex, Form, Input, Tag } from 'antd';
import { confirmAction } from '../lib/telegram/confirm.js';
import { fieldSetter } from '../lib/fieldValue.js';
import Field from './Field.jsx';
import Loading from './Loading.jsx';
import { useTelegramSettings } from './telegram/useTelegramSettings.js';

const SOURCE_NOTE = {
  env: 'Бот настроен переменными окружения на сервере. Значения ниже заменят их.',
};

// Подключение Telegram-бота: токен и ID владельца вводятся здесь. Токен после сохранения не показывается.
export default function TelegramSettings() {
  const { state, error, busy, result, connect, disconnect } = useTelegramSettings();

  if (!state) {
    return error ? <Alert type="error" showIcon message={error} /> : <Loading text="Загрузка…" />;
  }
  return <TelegramForm state={state} error={error} busy={busy} result={result} connect={connect} disconnect={disconnect} />;
}

function TelegramForm({ state, error, busy, result, connect, disconnect }) {
  const [form, setForm] = useState({ botToken: '', ownerId: state.ownerId, miniAppUrl: state.miniAppUrl });
  const set = fieldSetter(setForm);

  const tokenOk = form.botToken.trim() !== '' || state.hasToken;
  const ownerOk = /^\d+$/.test(form.ownerId.trim());

  async function submit() {
    const ok = await connect({
      botToken: form.botToken.trim(),
      ownerId: form.ownerId.trim(),
      miniAppUrl: form.miniAppUrl.trim(),
    });
    if (ok) setForm((f) => ({ ...f, botToken: '' }));
  }

  async function remove() {
    if (!(await confirmAction('Отключить бота? Он перестанет отвечать и присылать уведомления.'))) return;
    const next = await disconnect();
    if (next) setForm({ botToken: '', ownerId: next.ownerId, miniAppUrl: next.miniAppUrl });
  }

  return (
    <Card
      title="Telegram-бот"
      style={{ marginBottom: 16 }}
      extra={state.connected
        ? <Tag color="green">{state.botUsername ? `Подключён @${state.botUsername}` : 'Подключён'}</Tag>
        : <Tag>Не подключён</Tag>}
    >
      {SOURCE_NOTE[state.source] && (
        <Alert type="info" showIcon message={SOURCE_NOTE[state.source]} style={{ marginBottom: 16 }} />
      )}

      <Form layout="vertical" onFinish={submit}>
        <Field
          label="Токен бота"
          extra="Его выдаёт @BotFather при создании бота. После сохранения токен не показывается."
        >
          <Input.Password
            value={form.botToken}
            onChange={set('botToken')}
            autoComplete="off"
            placeholder={state.hasToken ? 'Токен сохранён. Введите новый, чтобы заменить' : '123456789:AA…'}
          />
        </Field>
        <Field
          label="Ваш Telegram ID"
          extra="Число. Бот отвечает только на сообщения с этого ID, остальные получают запрос доступа к порталу. Свой ID показывает, например, @userinfobot."
        >
          <Input value={form.ownerId} onChange={set('ownerId')} inputMode="numeric" placeholder="123456789" />
        </Field>
        <Field
          label="Адрес Mini App (необязательно)"
          extra="Публичный адрес трекера по https. Нужен, чтобы трекер открывался кнопкой «Трекер» в боте."
        >
          <Input value={form.miniAppUrl} onChange={set('miniAppUrl')} placeholder="https://tracker.example.com" />
        </Field>

        <Flex wrap gap={8}>
          <Button type="primary" htmlType="submit" loading={busy} disabled={!tokenOk || !ownerOk}>
            Сохранить и подключить
          </Button>
          {state.source === 'ui' && <Button danger disabled={busy} onClick={remove}>Отключить</Button>}
        </Flex>
      </Form>

      {result?.ownerReachable === true && (
        <Alert
          type="success"
          showIcon
          style={{ marginTop: 16 }}
          message="Бот подключён. Он отправил вам сообщение в Telegram: проверьте, что оно пришло."
        />
      )}
      {result?.ownerReachable === false && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
          message="Настройки сохранены, но бот не смог вам написать"
          description="Откройте бота в Telegram, нажмите Start и сохраните настройки ещё раз. Проверьте также, что ID верный."
        />
      )}
      {error && <Alert type="error" showIcon message={error} style={{ marginTop: 16 }} />}
    </Card>
  );
}
