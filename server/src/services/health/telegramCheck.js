import { telegramApi, telegramEnabled } from '../telegram/api.js';
import { withTimeout } from './withTimeout.js';

export async function telegramCheck() {
  if (!telegramEnabled()) return { enabled: false, ok: true };
  try {
    await withTimeout(telegramApi('getMe', {}));
    return { enabled: true, ok: true };
  } catch (err) {
    return { enabled: true, ok: false, error: err.message };
  }
}
