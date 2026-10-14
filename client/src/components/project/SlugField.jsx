import { Input } from 'antd';
import Field from '../Field.jsx';

// Код проекта строится сервером из названия при создании и дальше только показывается:
// по нему привязаны задачи, а он же служит именем папки репозитория на сервере.
export default function SlugField({ value }) {
  return (
    <Field label="Код проекта" extra="Создаётся автоматически и совпадает с папкой репозитория. Менять нельзя.">
      <Input value={value} disabled />
    </Field>
  );
}
