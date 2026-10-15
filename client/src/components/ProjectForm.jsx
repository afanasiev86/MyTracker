import { useEffect, useState } from 'react';
import { Alert, AutoComplete, Button, Card, Checkbox, Col, DatePicker, Flex, Form, Input, Row, Select, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { createProject, updateProject, fetchClients, fetchGithubRepos, syncProjectGithub } from '../api.js';
import { fieldSetter } from '../lib/fieldValue.js';
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from '../../../shared/crm.js';
import { toForm } from './project/toForm.js';
import { buildProjectBody } from './project/buildProjectBody.js';
import SlugField from './project/SlugField.jsx';
import PriceField from './project/PriceField.jsx';
import Field from './Field.jsx';

// Сообщение о результате синхронизации с GitHub (поле github в ответе сервера)
function githubNotice(github) {
  if (!github) return null;
  if (github.status === 'failed') return `GitHub: ${github.error}. Проект сохранён, повторите синхронизацию позже.`;
  if (github.status === 'created') return `Создан приватный репозиторий ${github.fullName}.`;
  return null;
}

export default function ProjectForm({ project, onSaved, onCancel, onDelete }) {
  const [form, setForm] = useState(() => toForm(project));
  const [clients, setClients] = useState([]);
  const [github, setGithub] = useState({ enabled: false, repos: [] });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(project);

  useEffect(() => {
    fetchClients().then(setClients).catch(() => setClients([]));
    fetchGithubRepos().then(setGithub).catch(() => setGithub({ enabled: false, repos: [] }));
  }, []);

  const set = fieldSetter(setForm);

  // Подсказки из GitHub; ссылку можно и просто ввести вручную
  const query = form.repoUrl.toLowerCase();
  const repoOptions = github.repos
    .filter((r) => !query || r.fullName.toLowerCase().includes(query) || r.sshUrl === form.repoUrl)
    .map((r) => ({ value: r.sshUrl, label: `${r.fullName}${r.private ? ' 🔒' : ''}` }));

  async function submit() {
    setBusy(true);
    setError('');
    const body = buildProjectBody(form);
    try {
      const saved = isEdit ? await updateProject(project._id, body) : await createProject(body);
      if (saved.repo?.status === 'failed') {
        message.warning(`Проект сохранён, но репозиторий не склонирован: ${saved.repo.error}. Исправьте ссылку или доступ и сохраните проект ещё раз.`, 12);
      }
      const notice = githubNotice(saved.github);
      if (notice) {
        if (saved.github.status === 'failed') message.warning(notice, 12);
        else message.success(notice);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function syncNow() {
    setBusy(true);
    setError('');
    try {
      const saved = await syncProjectGithub(project._id);
      if (saved.github?.status === 'failed') message.warning(githubNotice(saved.github), 12);
      else message.success('Синхронизация с GitHub выполнена.');
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
            <Field label="Статус" extra={form.status === 'done' ? 'Репозиторий на GitHub будет архивирован' : undefined}>
              <Select
                value={form.status}
                onChange={set('status')}
                options={PROJECT_STATUSES.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] }))}
              />
            </Field>
          </Col>
          <Col xs={24} md={12}>
            <Field
              label="Репозиторий"
              extra={github.enabled
                ? 'Выберите из своих репозиториев GitHub или вставьте ссылку. Без ссылки репозиторий создастся автоматически.'
                : 'Ссылка git@github.com:владелец/имя.git или https://github.com/... Чтобы выбирать репозитории из списка и создавать их автоматически, подключите GitHub в «Настройках».'}
            >
              <AutoComplete
                value={form.repoUrl}
                onChange={(value) => set('repoUrl')(value ?? '')}
                options={repoOptions}
                placeholder="Выберите или вставьте ссылку"
                allowClear
                style={{ width: '100%' }}
              />
            </Field>
          </Col>
          <Col xs={24} md={12}>
            <Field label="Основная ветка" extra="При выборе репозитория подтянется из GitHub">
              <Input value={form.defaultBranch} onChange={set('defaultBranch')} />
            </Field>
            <Checkbox
              checked={form.commitToBase}
              onChange={(e) => setForm((f) => ({ ...f, commitToBase: e.target.checked }))}
              style={{ marginBottom: 16 }}
            >
              Коммитить сразу в эту ветку
            </Checkbox>
            <Typography.Paragraph type="secondary" style={{ marginTop: -8, fontSize: 13 }}>
              {form.commitToBase
                ? `Результат задач попадает прямо в «${form.defaultBranch.trim() || 'main'}», без отдельной ветки и без Pull request. Если ветку успели изменить, коммиты Claude ложатся поверх. При конфликте задача уходит в «Ошибку», а работа сохраняется в ветке task/<id>.`
                : 'Выключено: результат каждой задачи лежит в отдельной ветке task/<id>, в основную ветку его нужно влить самому.'}
            </Typography.Paragraph>
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

        <Field label="Описание" extra="Отправляется в описание репозитория на GitHub">
          <Input.TextArea value={form.description} onChange={set('description')} rows={3} />
        </Field>

        <Flex wrap gap={8}>
          <Button type="primary" htmlType="submit" loading={busy} disabled={!form.name.trim()}>
            {busy ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Создать проект'}
          </Button>
          {isEdit && form.repoUrl && github.enabled && (
            <Button onClick={syncNow} disabled={busy}>Синхронизировать с GitHub</Button>
          )}
          <Button onClick={onCancel}>Отмена</Button>
          {onDelete && <Button danger onClick={onDelete}>Удалить проект</Button>}
        </Flex>
        {error && <Alert type="error" showIcon message={error} style={{ marginTop: 16 }} />}
      </Form>
    </Card>
  );
}
