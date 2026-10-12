import { useState } from 'react';
import { getToken, clearToken, revokeAllSessions, getRole, setRole } from './api.js';
import { getInitData, confirmAction } from './lib/telegram.js';
import { useExpiredSession } from './app/useExpiredSession.js';
import { useTelegramLogin } from './app/useTelegramLogin.js';
import SignInGate from './app/SignInGate.jsx';
import ClientView from './app/ClientView.jsx';
import OwnerView from './app/OwnerView.jsx';

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getToken()));
  const [tgError, setTgError] = useState('');
  const [notice, setNotice] = useState('');
  const [section, setSection] = useState('board');
  const [role, setRoleState] = useState(getRole());
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
      <SignInGate
        inTelegram={inTelegram}
        tgError={tgError}
        notice={notice}
        onSuccess={() => { setRole('owner'); signIn('owner'); }}
      />
    );
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
    return <ClientView inTelegram={inTelegram} onLogout={logout} />;
  }

  return (
    <OwnerView
      section={section}
      onSection={setSection}
      inTelegram={inTelegram}
      onLogout={logout}
      onLogoutEverywhere={logoutEverywhere}
    />
  );
}
