import AppHeader from './AppHeader.jsx';
import Portal from '../components/Portal.jsx';

// Заказчик видит только свой портал, без вкладок владельца
export default function ClientView({ inTelegram, onLogout }) {
  return (
    <div className="app">
      <AppHeader>
        {!inTelegram && <button className="ghost" onClick={onLogout}>Выйти</button>}
      </AppHeader>
      <Portal />
    </div>
  );
}
