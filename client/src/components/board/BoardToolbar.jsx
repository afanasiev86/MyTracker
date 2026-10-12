import { Button, Flex, Input, Select } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';

// Панель над доской: фильтр по проекту, поиск и кнопка новой задачи
export default function BoardToolbar({ projects, project, onProject, search, onSearch, onNew }) {
  return (
    <Flex wrap gap={8} style={{ marginBottom: 12 }}>
      <Select
        value={project}
        onChange={onProject}
        options={[{ value: '', label: 'Все проекты' }, ...projects.map((p) => ({ value: p, label: p }))]}
        style={{ minWidth: 180 }}
        aria-label="Проект"
      />
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Поиск по названию"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        style={{ width: 240 }}
      />
      <Button type="primary" icon={<PlusOutlined />} onClick={onNew}>Новая задача</Button>
    </Flex>
  );
}
