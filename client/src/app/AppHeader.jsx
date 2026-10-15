import { Flex, Typography } from 'antd';
import { ProjectOutlined } from '@ant-design/icons';

// Верхняя панель: логотип, название и действия справа
export default function AppHeader({ children }) {
  return (
    <Flex component="header" justify="space-between" align="center" wrap gap={8} className="app-header">
      <Flex align="center" gap={8}>
        <ProjectOutlined className="app-logo" aria-label="Логотип MyTracker" />
        <Typography.Title level={3} style={{ margin: 0 }}>MyTracker</Typography.Title>
      </Flex>
      {children}
    </Flex>
  );
}
