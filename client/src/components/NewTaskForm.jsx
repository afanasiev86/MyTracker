import { useState } from 'react';
import { Alert, Button, Flex, Form } from 'antd';
import { createTask } from '../api.js';
import { fieldSetter } from '../lib/fieldValue.js';
import { applyTemplate } from '../lib/templates/applyTemplate.js';
import { EMPTY_TASK_FORM } from './newTask/emptyForm.js';
import { buildTaskBody } from './newTask/buildTaskBody.js';
import { useProjects } from './newTask/useProjects.js';
import ProjectField from './newTask/ProjectField.jsx';
import BasicFields from './newTask/BasicFields.jsx';
import TemplatePicker from './newTask/TemplatePicker.jsx';
import DetailFields from './newTask/DetailFields.jsx';

export default function NewTaskForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY_TASK_FORM);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const projects = useProjects(setForm, setError);

  const set = fieldSetter(setForm);

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const task = await createTask(buildTaskBody(form));
      onCreated(task);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Form layout="vertical" onFinish={submit}>
      <ProjectField projects={projects} value={form.project} onChange={set('project')} />

      <BasicFields form={form} set={set} />

      <TemplatePicker onPick={(key) => setForm((f) => applyTemplate(f, key))} />

      <DetailFields form={form} set={set} />

      <Flex gap={8}>
        <Button type="primary" htmlType="submit" loading={busy} disabled={!form.project || !form.title.trim()}>
          Создать
        </Button>
        <Button onClick={onCancel}>Отмена</Button>
      </Flex>
      {error && <Alert type="error" showIcon message={error} style={{ marginTop: 16 }} />}
    </Form>
  );
}
