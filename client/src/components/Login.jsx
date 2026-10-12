import { useState } from 'react';
import { Alert, Button, Card, Flex, Form, Input, Layout, Typography } from 'antd';
import { login, setToken } from '../api.js';

export default function Login({ onSuccess, notice = '' }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const { token } = await login(password);
      setToken(token);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout className="app-layout">
      <Flex justify="center" style={{ marginTop: '20vh', padding: '0 16px' }}>
        <Card style={{ width: 360, maxWidth: '100%' }}>
          <Typography.Title level={3} style={{ marginTop: 0 }}>MyTracker</Typography.Title>
          <Form layout="vertical" onFinish={submit}>
            {notice && <Alert type="warning" showIcon message={notice} style={{ marginBottom: 16 }} />}
            <Form.Item>
              <Input.Password
                autoComplete="current-password"
                aria-label="Пароль"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={busy} disabled={!password}>
              {busy ? 'Входим…' : 'Войти'}
            </Button>
            {error && <Alert type="error" showIcon message={error} style={{ marginTop: 16 }} />}
          </Form>
        </Card>
      </Flex>
    </Layout>
  );
}
