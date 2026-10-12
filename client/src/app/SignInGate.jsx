import { Alert, Flex, Space, Spin, Typography } from 'antd';
import Login from '../components/Login.jsx';

// Экран до входа: в Telegram — статус входа по подписи, в браузере — форма пароля
export default function SignInGate({ inTelegram, tgError, notice, onSuccess }) {
  if (inTelegram) {
    return (
      <Flex justify="center" style={{ marginTop: '30vh' }}>
        {tgError
          ? <Alert type="error" showIcon message={tgError} />
          : (
            <Space>
              <Spin />
              <Typography.Text type="secondary">Входим через Telegram…</Typography.Text>
            </Space>
          )}
      </Flex>
    );
  }
  return <Login notice={notice} onSuccess={onSuccess} />;
}
