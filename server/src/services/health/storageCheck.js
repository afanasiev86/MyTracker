import mongoose from 'mongoose';
import { getActiveProvider } from '../storage/selection.js';
import { probeProvider } from '../storage/probe.js';
import { withTimeout } from './withTimeout.js';

export async function storageCheck() {
  // Без базы не знаем, какой провайдер выбран, и не ждём таймаут Mongoose
  if (mongoose.connection.readyState !== 1) return { ok: false, error: 'база недоступна' };
  const provider = await withTimeout(getActiveProvider());
  const probe = await probeProvider(provider);
  // Не настроенное хранилище не считаем поломкой: вложения просто не используются
  return { provider, ...probe, ok: !probe.configured || probe.reachable };
}
