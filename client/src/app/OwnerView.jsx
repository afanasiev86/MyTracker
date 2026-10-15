import { Navigate, Route, Routes } from 'react-router-dom';
import { Button, Layout, Space } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import Board from '../components/Board.jsx';
import Projects from '../components/Projects.jsx';
import Clients from '../components/Clients.jsx';
import Health from '../components/Health.jsx';
import Server from '../components/Server.jsx';
import TelegramSettings from '../components/TelegramSettings.jsx';
import GithubSettings from '../components/GithubSettings.jsx';
import { NewTaskRoute, TaskRoute } from '../components/board/TaskRoutes.jsx';
import ProjectRoute from '../components/projects/ProjectRoute.jsx';
import ClientRoute from '../components/clients/ClientRoute.jsx';
import AppHeader from './AppHeader.jsx';
import SectionTabs from './SectionTabs.jsx';

// Экран владельца: шапка, вкладки и маршруты разделов. Формы и карточки открываются вложенными адресами.
export default function OwnerView({ inTelegram, onLogout, onLogoutEverywhere }) {
  return (
    <Layout className="app-layout">
      <Layout.Content className="app-content">
        <AppHeader>
          {!inTelegram && (
            <Space wrap>
              <Button icon={<LogoutOutlined />} onClick={onLogout}>Выйти</Button>
              <Button onClick={onLogoutEverywhere}>Выйти на всех устройствах</Button>
            </Space>
          )}
        </AppHeader>

        <SectionTabs />

        <Routes>
          <Route path="/tasks" element={<Board />}>
            <Route path="new" element={<NewTaskRoute />} />
            <Route path=":id" element={<TaskRoute />} />
          </Route>
          <Route path="/projects" element={<Projects />}>
            <Route path="new" element={<ProjectRoute />} />
            <Route path=":id" element={<ProjectRoute />} />
          </Route>
          <Route path="/clients" element={<Clients />}>
            <Route path="new" element={<ClientRoute />} />
            <Route path=":id" element={<ClientRoute />} />
          </Route>
          <Route path="/server" element={<Server />} />
          <Route path="/settings" element={<><Health /><TelegramSettings /><GithubSettings /></>} />
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
      </Layout.Content>
    </Layout>
  );
}
