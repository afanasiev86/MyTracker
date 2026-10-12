import Board from '../components/Board.jsx';
import Projects from '../components/Projects.jsx';
import Clients from '../components/Clients.jsx';
import Settings from '../components/Settings.jsx';
import Health from '../components/Health.jsx';
import AppHeader from './AppHeader.jsx';
import SectionTabs from './SectionTabs.jsx';

// Экран владельца: шапка, вкладки и выбранный раздел
export default function OwnerView({ section, onSection, inTelegram, onLogout, onLogoutEverywhere }) {
  return (
    <div className="app">
      <AppHeader>
        {!inTelegram && (
          <div className="topbar-actions">
            <button className="ghost" onClick={onLogout}>Выйти</button>
            <button className="ghost" onClick={onLogoutEverywhere}>Выйти на всех устройствах</button>
          </div>
        )}
      </AppHeader>

      <SectionTabs section={section} onSelect={onSection} />

      {section === 'board' && <Board />}
      {section === 'projects' && <Projects />}
      {section === 'clients' && <Clients />}
      {section === 'settings' && <><Health /><Settings /></>}
    </div>
  );
}
