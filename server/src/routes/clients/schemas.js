import { z } from 'zod';
import { RATE_KINDS, CURRENCIES } from '../../../../shared/crm.js';

export const clientSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  rate: z.object({
    kind: z.enum(RATE_KINDS),
    amount: z.number().min(0),
    currency: z.enum(CURRENCIES),
  }).optional(),
});
