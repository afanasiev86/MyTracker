import Task from '../models/Task.js';
import { buildDigest, moscowParts } from './digest.js';
import { notify } from './notify.js';
import { telegramEnabled } from './telegram.js';

const DIGEST_HOUR = 9;
const CHECK_EVERY_MS = 60 * 1000;

// Раз в минуту проверяем московское время. В 09:xx отправляем дайджест один раз за день.
export function startDigestScheduler({ now = () => new Date(), intervalMs = CHECK_EVERY_MS } = {}) {
  if (!telegramEnabled()) return null;

  let lastSentDay = '';
  const timer = setInterval(async () => {
    const current = now();
    const { day, hour } = moscowParts(current);
    if (hour !== DIGEST_HOUR || day === lastSentDay) return;
    lastSentDay = day;

    try {
      const tasks = await Task.find({ status: { $ne: 'done' } }).lean();
      const text = buildDigest(tasks, current);
      if (text) await notify(text);
    } catch (err) {
      console.error('Digest:', err.message);
    }
  }, intervalMs);
  timer.unref();
  return timer;
}
