import mongoose from 'mongoose';

// Служебные настройки в единственном экземпляре (ключ 'auth').
// tokenVersion меняется при «выйти на всех устройствах»: старые токены перестают работать.
const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  tokenVersion: { type: Number, default: 1 },
  // День (по Москве), за который уже отправлен дайджест
  digestDay: { type: String, default: '' },
  // Выбранное хранилище вложений: minio или s3 (ключ 'storage')
  provider: { type: String, default: '' },
  // Telegram-бот, заданный в интерфейсе (ключ 'telegram'). Токен хранится зашифрованным, см. services/telegram/secretBox.js
  telegramTokenEnc: { type: String, default: '' },
  telegramOwnerId: { type: String, default: '' },
  telegramMiniAppUrl: { type: String, default: '' },
  telegramBotUsername: { type: String, default: '' },
});

export default mongoose.model('Settings', settingsSchema);
