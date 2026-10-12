import { useState } from 'react';
import { login, setToken } from '../api.js';

export default function Login({ onSuccess, notice = '' }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token } = await login(password);
      setToken(token);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="login" onSubmit={submit}>
      <h1>MyTracker</h1>
      {notice && <p className="muted">{notice}</p>}
      <input
        type="password"
        autoComplete="current-password"
        aria-label="Пароль"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
      />
      <button type="submit" disabled={busy || !password}>
        {busy ? 'Входим…' : 'Войти'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
