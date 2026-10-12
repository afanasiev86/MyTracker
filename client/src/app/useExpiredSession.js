import { useEffect } from 'react';
import { clearToken, UNAUTHORIZED_EVENT } from '../api.js';

// Любой запрос с истёкшим токеном возвращает на вход с понятным сообщением
export function useExpiredSession(onExpired) {
  useEffect(() => {
    const handler = () => {
      clearToken();
      onExpired();
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [onExpired]);
}
