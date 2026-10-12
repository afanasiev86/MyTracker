import { Alert, Select } from 'antd';
import Field from '../Field.jsx';

// Выбор проекта, либо подсказка, если проектов ещё нет
export default function ProjectField({ projects, value, onChange }) {
  if (projects.length === 0) {
    return <Alert type="info" showIcon message="Сначала создайте проект на вкладке «Проекты»." style={{ marginBottom: 16 }} />;
  }
  return (
    <Field label="Проект" required>
      <Select
        value={value}
        onChange={onChange}
        options={projects.map((p) => ({ value: p.slug, label: p.name }))}
      />
    </Field>
  );
}
