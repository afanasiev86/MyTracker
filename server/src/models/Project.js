import mongoose from 'mongoose';
import { PROJECT_STATUSES, CURRENCIES, SLUG_PATTERN } from '../../../shared/crm.js';

const projectSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: SLUG_PATTERN,
  },
  name: { type: String, required: true, trim: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
  description: { type: String, default: '' },
  status: { type: String, enum: PROJECT_STATUSES, default: 'active' },
  repoUrl: { type: String, default: '', trim: true },
  defaultBranch: { type: String, default: 'main', trim: true },
  // Результат задач отправляется сразу в основную ветку («в ПРОД»). Иначе он уходит в ветку UAT и вливается в основную при приёмке
  commitToBase: { type: Boolean, default: false },
  uatBranch: { type: String, default: 'uat', trim: true },
  // Локальный порт UAT-стенда (проксируется nginx). Выдаётся один раз и больше не меняется, см. services/uat/ensureStand.js
  uatPort: { type: Number, default: null },
  // Состояние стенда: что собрано и чем закончилась последняя сборка (подробный журнал лежит в папке стенда)
  uatStatus: { type: String, enum: ['none', 'building', 'ready', 'failed'], default: 'none' },
  uatCommit: { type: String, default: '' },
  uatBuiltAt: { type: Date, default: null },
  uatError: { type: String, default: '' },
  deadline: { type: Date, default: null },
  price: {
    amount: { type: Number, default: 0, min: 0 },
    currency: { type: String, enum: CURRENCIES, default: 'RUB' },
  },
  links: {
    type: [{ title: String, url: String }],
    default: [],
  },
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
