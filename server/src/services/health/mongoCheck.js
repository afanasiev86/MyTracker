import mongoose from 'mongoose';
import { withTimeout } from './withTimeout.js';

export async function mongoCheck() {
  if (mongoose.connection.readyState !== 1) return { ok: false, error: 'нет соединения' };
  try {
    await withTimeout(mongoose.connection.db.admin().ping());
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
