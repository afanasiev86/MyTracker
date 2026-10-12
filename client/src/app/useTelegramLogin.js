import { useEffect } from 'react';
import { loginWithTelegram, setToken, setRole } from '../api.js';
import { getInitData, initTelegramUi } from '../lib/telegram.js';

// Открыто внутри Telegram: входим по подписи initData, пароль не нужен.
// Запускается один раз при открытии приложения.
export function useTelegramLogin({ authed, onLogin, onError }) {
  useEffect(() => {
    initTelegramUi();
    if (authed || !getInitData()) return;
    loginWithTelegram(getInitData())
      .then(({ token, role: userRole }) => {
        setToken(token);
        setRole(userRole);
        onLogin(userRole);
      })
      .catch((err) => onError(err.message));
  }, []);
}
