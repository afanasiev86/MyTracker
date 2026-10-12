import { Router } from 'express';
import { z } from 'zod';
import { describeTelegram } from '../services/telegram/runtime.js';
import { connectTelegram, disconnectTelegram } from '../services/telegram/connect.js';

const router = Router();

const connectSchema = z.object({
  botToken: z.string().trim().regex(/^(\d{5,}:[A-Za-z0-9_-]{20,})?$/, 'Токен выглядит как 123456789:AA… Скопируйте его из @BotFather'),
  ownerId: z.string().trim().regex(/^\d{1,15}$/, 'ID владельца — число, например 123456789'),
  miniAppUrl: z.string().trim().refine((v) => v === '' || /^https:\/\/\S+$/.test(v), 'Адрес Mini App должен начинаться с https://'),
});

// Состояние бота. Токен наружу не отдаётся.
router.get('/', (_req, res) => res.json(describeTelegram()));

// Подключение или смена настроек бота
router.put('/', async (req, res, next) => {
  try {
    const { ownerReachable } = await connectTelegram(connectSchema.parse(req.body));
    return res.json({ ...describeTelegram(), ownerReachable });
  } catch (err) {
    return next(err);
  }
});

// Отключение бота, заданного в интерфейсе
router.delete('/', async (_req, res, next) => {
  try {
    await disconnectTelegram();
    return res.json(describeTelegram());
  } catch (err) {
    return next(err);
  }
});

export default router;
