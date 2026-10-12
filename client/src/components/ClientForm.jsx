import { useState } from 'react';
import { Alert, Button, Card, Flex, Form, Input, Row, Typography } from 'antd';
import { createClient, updateClient } from '../api.js';
import { fieldSetter } from '../lib/fieldValue.js';
import { toClientForm } from './clientForm/toClientForm.js';
import { buildClientBody } from './clientForm/buildClientBody.js';
import ContactFields from './clientForm/ContactFields.jsx';
import RateFields from './clientForm/RateFields.jsx';
import Field from './Field.jsx';

export default function ClientForm({ client, onSaved, onCancel, onDelete }) {
  const [form, setForm] = useState(() => toClientForm(client));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(client);

  const set = fieldSetter(setForm);

  async function submit() {
    setBusy(true);
    setError('');
    const body = buildClientBody(form);
    try {
      if (isEdit) await updateClient(client._id, body);
      else await createClient(body);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ marginBottom: 16 }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        {isEdit ? 'Редактирование клиента' : 'Новый клиент'}
      </Typography.Title>
      <Form layout="vertical" onFinish={submit}>
        <Row gutter={12}>
          <ContactFields form={form} set={set} />
          <RateFields form={form} set={set} />
        </Row>

        <Field label="Заметки">
          <Input.TextArea value={form.notes} onChange={set('notes')} rows={3} />
        </Field>

        <Flex wrap gap={8}>
          <Button type="primary" htmlType="submit" loading={busy} disabled={!form.name.trim()}>
            {busy ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Добавить клиента'}
          </Button>
          <Button onClick={onCancel}>Отмена</Button>
          {onDelete && <Button danger onClick={onDelete}>Удалить клиента</Button>}
        </Flex>
        {error && <Alert type="error" showIcon message={error} style={{ marginTop: 16 }} />}
      </Form>
    </Card>
  );
}
