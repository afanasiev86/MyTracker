import Login from '../components/Login.jsx';

// Экран до входа: в Telegram — статус входа по подписи, в браузере — форма пароля
export default function SignInGate({ inTelegram, tgError, notice, onSuccess }) {
  if (inTelegram) {
    return tgError
      ? <p className="error center">{tgError}</p>
      : <p className="muted center">Входим через Telegram…</p>;
  }
  return <Login notice={notice} onSuccess={onSuccess} />;
}
