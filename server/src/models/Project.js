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
  // Результат задач отправляется сразу в основную ветку (иначе в ветку задачи task/<id>)
  commitToBase: { type: Boolean, default: false },
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
