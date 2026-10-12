import mongoose from 'mongoose';

// Запрос доступа к порталу: человек написал боту /start. Владелец подтверждает или отклоняет.
const accessRequestSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  username: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'rejected'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model('AccessRequest', accessRequestSchema);
