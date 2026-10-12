import { Col, DatePicker, Input, Row, Select } from 'antd';
import dayjs from 'dayjs';
import { PRIORITIES, PRIORITY_LABELS } from '../../../../shared/crm.js';
import Field from '../Field.jsx';

// Заголовок, приоритет и срок
export default function BasicFields({ form, set }) {
  return (
    <Row gutter={12}>
      <Col xs={24} md={12}>
        <Field label="Заголовок" required>
          <Input value={form.title} onChange={set('title')} />
        </Field>
      </Col>
      <Col xs={24} md={6}>
        <Field label="Приоритет">
          <Select
            value={form.priority}
            onChange={set('priority')}
            options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
          />
        </Field>
      </Col>
      <Col xs={24} md={6}>
        <Field label="Срок">
          <DatePicker
            value={form.dueDate ? dayjs(form.dueDate) : null}
            onChange={(date) => set('dueDate')(date ? date.format('YYYY-MM-DD') : '')}
            style={{ width: '100%' }}
          />
        </Field>
      </Col>
    </Row>
  );
}
