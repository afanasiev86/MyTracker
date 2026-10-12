import { useEffect, useState } from 'react';
import { getToken, clearToken, setToken, loginWithTelegram } from './api.js';
import { getInitData, initTelegramUi } from './lib/telegram.js';
import Login from './components/Login.jsx';
import Board from './components/Board.jsx';

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getToken()));
  const [tgError, setTgError] = useState('');
  const inTelegram = Boolean(getInitData());

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
      return <p className="error center">{tgError || 'Входим через Telegram…'}</p>;
    }
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  const logout = () => {
    clearToken();
    setAuthed(false);
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>MyTracker</h1>
        {!inTelegram && <button className="ghost" onClick={logout}>Выйти</button>}
      </header>
      <Board onUnauthorized={logout} />
    </div>
  );
}
