import { useState } from 'react';
import { getToken, clearToken } from './api.js';
import Login from './components/Login.jsx';
import Board from './components/Board.jsx';

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getToken()));

  if (!authed) {
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
        <button className="ghost" onClick={logout}>Выйти</button>
      </header>
      <Board onUnauthorized={logout} />
    </div>
  );
}
