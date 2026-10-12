import { List, Tag, Typography } from 'antd';
import { CHECK_LABELS } from './constants.js';

// Список проверок сервисов: в норме или проблема с текстом ошибки
export default function ChecksList({ checks }) {
  return (
    <List
      size="small"
      dataSource={Object.entries(CHECK_LABELS)}
      renderItem={([key, label]) => (
        <List.Item>
          <span>
            {label}:{' '}
            <Tag color={checks[key].ok ? 'green' : 'red'}>{checks[key].ok ? 'в норме' : 'проблема'}</Tag>
            {checks[key].error && <Typography.Text type="secondary"> — {checks[key].error}</Typography.Text>}
          </span>
        </List.Item>
      )}
    />
  );
}
