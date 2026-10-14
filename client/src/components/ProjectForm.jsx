import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Flex, Form, Input, Row, Select, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { createProject, updateProject, fetchClients } from '../api.js';
import { fieldSetter } from '../lib/fieldValue.js';
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from '../../../shared/crm.js';
import { toForm } from './project/toForm.js';
import { buildProjectBody } from './project/buildProjectBody.js';
import SlugField from './project/SlugField.jsx';
import PriceField from './project/PriceField.jsx';
import Field from './Field.jsx';

export default function ProjectForm({ project, onSaved, onCancel, onDelete }) {
  const [form, setForm] = useState(() => toForm(project));
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(project);

  useEffect(() => {
    fetchClients().then(setClients).catch(() => setClients([]));
  }, []);

  const set = fieldSetter(setForm);

  async function submit() {
    setBusy(true);
    setError('');
    const body = buildProjectBody(form);
    try {
      const saved = isEdit ? await updateProject(project._id, body) : await createProject(body);
      if (saved.repo?.status === 'failed') {
        message.warning(`Проект сохранён, но репозиторий не склонирован: ${saved.repo.error}. Исправьте ссылку или доступ и сохраните проект ещё раз.`, 12);
      }
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
        {isEdit ? 'Редактирование проекта' : 'Новый проект'}
      </Typography.Title>
      <Form layout="vertical" onFinish={submit}>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Field label="Название" required>
              <Input value={form.name} onChange={set('name')} />
            </Field>
          </Col>
          {isEdit && (
            <Col xs={24} md={12}>
              <SlugField value={form.slug} />
            </Col>
          )}
          <Col xs={24} md={12}>
            <Field label="Клиент">
              <Select
                value={form.client}
                onChange={set('client')}
                options={[{ value: '', label: 'Без клиента' }, ...clients.map((c) => ({ value: c._id, label: c.name }))]}
              />
            </Field>
          </Col>
          <Col xs={24} md={12}>
            <Field label="Статус">
              <Select
                value={form.status}
                onChange={set('status')}
                options={PROJECT_STATUSES.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] }))}
              />
            </Field>
          </Col>
          <Col xs={24} md={12}>
            <Field
              label="Репозиторий (ссылка)"
              extra="Сервер сам склонирует его в папку проекта. Для приватного: git@github.com:владелец/имя.git, нужен ключ сервера."
            >
              <Input value={form.repoUrl} onChange={set('repoUrl')} placeholder="https://github.com/..." />
            </Field>
          </Col>
          <Col xs={24} md={12}>
            <Field label="Основная ветка">
              <Input value={form.defaultBranch} onChange={set('defaultBranch')} />
            </Field>
          </Col>
          <Col xs={24} md={12}>
            <Field label="Срок сдачи">
              <DatePicker
                value={form.deadline ? dayjs(form.deadline) : null}
                onChange={(date) => set('deadline')(date ? date.format('YYYY-MM-DD') : '')}
                style={{ width: '100%' }}
              />
            </Field>
          </Col>
          <Col xs={24} md={12}>
            <PriceField
              amount={form.priceAmount}
              currency={form.priceCurrency}
              onAmount={set('priceAmount')}
              onCurrency={set('priceCurrency')}
            />
          </Col>
        </Row>

        <Field label="Описание">
          <Input.TextArea value={form.description} onChange={set('description')} rows={3} />
        </Field>

        <Flex wrap gap={8}>
          <Button type="primary" htmlType="submit" loading={busy} disabled={!form.name.trim()}>
            {busy ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Создать проект'}
          </Button>
          <Button onClick={onCancel}>Отмена</Button>
          {onDelete && <Button danger onClick={onDelete}>Удалить проект</Button>}
        </Flex>
        {error && <Alert type="error" showIcon message={error} style={{ marginTop: 16 }} />}
      </Form>
    </Card>
  );
}
