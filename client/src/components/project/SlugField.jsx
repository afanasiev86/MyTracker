import { Input } from 'antd';
import Field from '../Field.jsx';

// Код проекта: латиница, цифры и дефис. После создания менять нельзя.
export default function SlugField({ value, onChange, isEdit, valid }) {
  const invalid = Boolean(value) && !valid;
  return (
    <Field
      label="Код проекта"
      required
      validateStatus={invalid ? 'error' : ''}
      help={invalid ? 'Пока не подходит: используйте латиницу, цифры и дефис.' : undefined}
      extra={isEdit
        ? 'Код менять нельзя: по нему привязаны задачи.'
        : 'Латиница, цифры и дефис. Должен совпадать с папкой репозитория на сервере.'}
    >
      <Input value={value} onChange={onChange} placeholder="shop-api" disabled={isEdit} />
    </Field>
  );
}
