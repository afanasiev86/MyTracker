import { Router } from 'express';
import { z } from 'zod';
import { listProviders, PROVIDERS } from '../services/storage/providers.js';
import { getActiveProvider, setActiveProvider } from '../services/storage/selection.js';

const router = Router();

const providerField = z.enum(Object.keys(PROVIDERS));

// Состояние хранилища: активный провайдер и какие настроены
router.get('/', async (_req, res, next) => {
  try {
    return res.json({ active: await getActiveProvider(), providers: listProviders() });
  } catch (err) {
    return next(err);
  }
});

// Выбор хранилища для новых вложений
router.put('/', async (req, res, next) => {
  try {
    const { provider } = z.object({ provider: providerField }).parse(req.body);
    await setActiveProvider(provider);
    return res.json({ active: provider, providers: listProviders() });
  } catch (err) {
    return next(err);
  }
});

export default router;
