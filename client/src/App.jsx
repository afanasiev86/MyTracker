import { useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { getToken, clearToken, revokeAllSessions, getRole, setRole } from './api.js';
import { getInitData } from './lib/telegram/webApp.js';
import { confirmAction } from './lib/telegram/confirm.js';
import { useExpiredSession } from './app/useExpiredSession.js';
import { useTelegramLogin } from './app/useTelegramLogin.js';
import SignInGate from './app/SignInGate.jsx';
import ClientView from './app/ClientView.jsx';
import OwnerView from './app/OwnerView.jsx';

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getToken()));
  const [tgError, setTgError] = useState('');
  const [notice, setNotice] = useState('');
  const [role, setRoleState] = useState(getRole());
  const location = useLocation();
  const inTelegram = Boolean(getInitData());

  const signIn = (userRole) => {
    setRoleState(userRole);
    setAuthed(true);
  };

  useExpiredSession(() => {
    setNotice('Сессия истекла. Войдите снова.');
    setAuthed(false);
  });

  useTelegramLogin({
    authed,
    onLogin: signIn,
    onError: setTgError,
  });

  if (!authed) {
    return (
      <Routes>
        <Route
          path="/login"
          element={(
            <SignInGate
              inTelegram={inTelegram}
              tgError={tgError}
              notice={notice}
              onSuccess={() => { setRole('owner'); signIn('owner'); }}
            />
          )}
        />
        <Route
          path="*"
          element={<Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />}
        />
      </Routes>
    );
  }

  if (location.pathname === '/login') {
    return <Navigate to={location.state?.from ?? '/'} replace />;
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

  if (role === 'client') {
    return (
      <Routes>
        <Route path="/portal" element={<ClientView inTelegram={inTelegram} onLogout={logout} />} />
        <Route path="*" element={<Navigate to="/portal" replace />} />
      </Routes>
    );
  }

  return (
    <OwnerView
      inTelegram={inTelegram}
      onLogout={logout}
      onLogoutEverywhere={logoutEverywhere}
    />
  );
}
