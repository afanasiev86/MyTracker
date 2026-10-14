import { checkWritable } from '../storage/files.js';

export async function storageCheck() {
  try {
    await checkWritable();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.code || 'ошибка' };
  }
}
