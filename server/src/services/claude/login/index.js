import { domainError } from '../../errors.js';
import { describeClaude, saveClaudeSettings } from '../settings.js';
import { cancelLogin, finishLogin, startLogin } from './session.js';

export { cancelLogin, startLogin };

// Завершение входа: код со страницы входа превращается в токен подписки и сохраняется как токен нового типа oauth_token.
export async function completeLogin({ code, label }) {
  const clean = code.replace(/\s+/g, '');
  if (!clean) throw domainError('invalid', 'Вставьте код со страницы входа');
  const token = await finishLogin(clean);
  await saveClaudeSettings({ token, type: 'oauth_token', label });
  return describeClaude();
}
