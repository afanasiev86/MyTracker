import { z } from 'zod';

export const loginSchema = z.object({ password: z.string().min(1) });
export const telegramSchema = z.object({ initData: z.string().min(1) });
