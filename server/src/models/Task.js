import mongoose from 'mongoose';
import { TASK_STATUSES } from '../../../shared/statuses.js';

const runSchema = new mongoose.Schema({
  startedAt: Date,
  finishedAt: Date,
  summary: String,
  costUsd: Number,
  log: String,
}, { _id: false });

const commentSchema = new mongoose.Schema({
  author: { type: String, default: 'owner' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const taskSchema = new mongoose.Schema({
  project: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  goal: { type: String, default: '' },
  acceptance: { type: [String], default: [] },
  context: { type: String, default: '' },
  outOfScope: { type: String, default: '' },
  status: { type: String, enum: TASK_STATUSES, default: 'backlog' },
  branch: { type: String, default: '' },
  runs: { type: [runSchema], default: [] },
  comments: { type: [commentSchema], default: [] },
}, { timestamps: true });

taskSchema.index({ project: 1, status: 1 });

export default mongoose.model('Task', taskSchema);
