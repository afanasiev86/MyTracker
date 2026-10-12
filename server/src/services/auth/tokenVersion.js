import Settings from '../../models/Settings.js';

// Версия токенов хранится в базе. Значение кэшируется, чтобы не ходить в базу на каждый запрос.
let cachedVersion = null;

export async function currentTokenVersion() {
  if (cachedVersion === null) {
    const doc = await Settings.findOneAndUpdate(
      { key: 'auth' },
      { $setOnInsert: { tokenVersion: 1 } },
      { upsert: true, new: true, lean: true },
    );
    cachedVersion = doc.tokenVersion;
  }
  return cachedVersion;
}

// Все выданные токены становятся недействительными
export async function revokeAllTokens() {
  const doc = await Settings.findOneAndUpdate(
    { key: 'auth' },
    { $inc: { tokenVersion: 1 } },
    { upsert: true, new: true, lean: true },
  );
  cachedVersion = doc.tokenVersion;
}
