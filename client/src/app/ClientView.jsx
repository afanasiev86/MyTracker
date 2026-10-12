import { Button, Layout } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import AppHeader from './AppHeader.jsx';
import Portal from '../components/Portal.jsx';

// Заказчик видит только свой портал, без вкладок владельца
export default function ClientView({ inTelegram, onLogout }) {
  return (
    <Layout className="app-layout">
      <Layout.Content className="app-content">
        <AppHeader>
          {!inTelegram && <Button icon={<LogoutOutlined />} onClick={onLogout}>Выйти</Button>}
        </AppHeader>
        <Portal />
      </Layout.Content>
    </Layout>
  );
}
