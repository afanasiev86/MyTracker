import { Col, Input } from 'antd';
import Field from '../Field.jsx';

// Имя, компания, email и телефон клиента
export default function ContactFields({ form, set }) {
  return (
    <>
      <Col xs={24} md={12}>
        <Field label="Имя" required>
          <Input value={form.name} onChange={set('name')} />
        </Field>
      </Col>
      <Col xs={24} md={12}>
        <Field label="Компания">
          <Input value={form.company} onChange={set('company')} />
        </Field>
      </Col>
      <Col xs={24} md={12}>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={set('email')} />
        </Field>
      </Col>
      <Col xs={24} md={12}>
        <Field label="Телефон">
          <Input value={form.phone} onChange={set('phone')} />
        </Field>
      </Col>
    </>
  );
}
