import mongoose from 'mongoose';
import { RATE_KINDS, CURRENCIES } from '../../../shared/crm.js';

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  company: { type: String, default: '', trim: true },
  email: { type: String, default: '', trim: true },
  phone: { type: String, default: '', trim: true },
  notes: { type: String, default: '' },
  rate: {
    kind: { type: String, enum: RATE_KINDS, default: 'fixed' },
    amount: { type: Number, default: 0, min: 0 },
    currency: { type: String, enum: CURRENCIES, default: 'RUB' },
  },
  // Telegram-аккаунт заказчика, появляется после подтверждения запроса доступа
  telegramId: { type: String },
  // Портал открыт только после подтверждения владельцем
  portalApproved: { type: Boolean, default: false },
}, { timestamps: true });

// Один Telegram-аккаунт — один клиент
clientSchema.index({ telegramId: 1 }, { unique: true, sparse: true });

export default mongoose.model('Client', clientSchema);
