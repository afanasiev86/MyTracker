import { Space, Spin, Typography } from 'antd';

// Индикатор загрузки с подписью
export default function Loading({ text }) {
  return (
    <Space style={{ margin: '8px 0' }}>
      <Spin size="small" />
      <Typography.Text type="secondary">{text}</Typography.Text>
    </Space>
  );
}
