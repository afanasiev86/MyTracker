import mongoose from 'mongoose';

// Служебные настройки в единственном экземпляре (ключ 'auth').
// tokenVersion меняется при «выйти на всех устройствах»: старые токены перестают работать.
const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  tokenVersion: { type: Number, default: 1 },
});

export default mongoose.model('Settings', settingsSchema);
