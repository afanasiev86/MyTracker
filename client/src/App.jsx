import { useEffect, useState } from 'react';
import {
  getToken,
  clearToken,
  setToken,
  loginWithTelegram,
  revokeAllSessions,
  UNAUTHORIZED_EVENT,
} from './api.js';
import { getInitData, initTelegramUi, confirmAction } from './lib/telegram.js';
import Login from './components/Login.jsx';
import Board from './components/Board.jsx';
import Projects from './components/Projects.jsx';
import Clients from './components/Clients.jsx';
import Settings from './components/Settings.jsx';

const SECTIONS = [
  { id: 'board', title: 'Задачи' },
  { id: 'projects', title: 'Проекты' },
  { id: 'clients', title: 'Клиенты' },
  { id: 'settings', title: 'Настройки' },
];

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getToken()));
  const [tgError, setTgError] = useState('');
  const [notice, setNotice] = useState('');
  const [section, setSection] = useState('board');
  const inTelegram = Boolean(getInitData());

  // Любой запрос с истёкшим токеном возвращает на вход с понятным сообщением
  useEffect(() => {
    const onExpired = () => {
      clearToken();
      setNotice('Сессия истекла. Войдите снова.');
      setAuthed(false);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onExpired);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    initTelegramUi();
    if (authed || !inTelegram) return;
    // Открыто внутри Telegram: входим по подписи initData, пароль не нужен
    loginWithTelegram(getInitData())
      .then(({ token }) => {
        setToken(token);
        setAuthed(true);
      })
      .catch((err) => setTgError(err.message));
  }, []);

  if (!authed) {
    if (inTelegram) {
      return tgError
        ? <p className="error center">{tgError}</p>
        : <p className="muted center">Входим через Telegram…</p>;
    }
    return <Login notice={notice} onSuccess={() => setAuthed(true)} />;
  }

  const logout = () => {
    clearToken();
    setNotice('');
    setAuthed(false);
  };

  const logoutEverywhere = async () => {
    const ok = await confirmAction('Выйти на всех устройствах? Войти снова придётся везде, включая Telegram.');
    if (!ok) return;
    try {
      await revokeAllSessions();
    } catch {
      // Если сеть недоступна, всё равно выходим здесь: токен отзовёт следующий вход
    }
    logout();
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>MyTracker</h1>
        {!inTelegram && (
          <div className="topbar-actions">
            <button className="ghost" onClick={logout}>Выйти</button>
            <button className="ghost" onClick={logoutEverywhere}>Выйти на всех устройствах</button>
          </div>
        )}
      </header>

      <nav className="tabs" role="tablist" aria-label="Разделы">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={section === s.id}
            className={section === s.id ? 'tab active' : 'tab'}
            onClick={() => setSection(s.id)}
          >
            {s.title}
          </button>
        ))}
      </nav>

      {section === 'board' && <Board />}
      {section === 'projects' && <Projects />}
      {section === 'clients' && <Clients />}
      {section === 'settings' && <Settings />}
    </div>
  );
}
