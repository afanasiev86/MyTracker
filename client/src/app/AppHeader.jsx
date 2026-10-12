import { Flex, Typography } from 'antd';

// Верхняя панель: название и действия справа
export default function AppHeader({ children }) {
  return (
    <Flex component="header" justify="space-between" align="center" wrap gap={8} className="app-header">
      <Typography.Title level={3} style={{ margin: 0 }}>MyTracker</Typography.Title>
      {children}
    </Flex>
  );
}
