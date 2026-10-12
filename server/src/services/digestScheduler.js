import Task from '../models/Task.js';
import Settings from '../models/Settings.js';
import { buildDigest, moscowParts } from './digest.js';
import { notify } from './notify.js';
import { telegramEnabled } from './telegram.js';

const DIGEST_HOUR = 9;
const CHECK_EVERY_MS = 60 * 1000;

// День последней отправки хранится в базе, поэтому перезапуск не даёт повтора в тот же день
async function lastDigestDay() {
  const doc = await Settings.findOne({ key: 'digest' }).lean();
  return doc?.digestDay ?? '';
}

async function saveDigestDay(day) {
  await Settings.updateOne({ key: 'digest' }, { $set: { digestDay: day } }, { upsert: true });
}

// Раз в минуту проверяем московское время. В 09:xx отправляем дайджест один раз за день.
export function startDigestScheduler({ now = () => new Date(), intervalMs = CHECK_EVERY_MS } = {}) {
  if (!telegramEnabled()) return null;

  const timer = setInterval(async () => {
    const current = now();
    const { day, hour } = moscowParts(current);
    if (hour !== DIGEST_HOUR) return;

    try {
      if (await lastDigestDay() === day) return;
      await saveDigestDay(day);

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
