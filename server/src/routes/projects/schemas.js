import { z } from 'zod';
import { PROJECT_STATUSES, CURRENCIES, SLUG_PATTERN } from '../../../../shared/crm.js';

const linkSchema = z.object({ title: z.string().min(1), url: z.string().url() });

export const projectSchema = z.object({
  slug: z.string().regex(SLUG_PATTERN, 'Латиница, цифры и дефис, например shop-api'),
  name: z.string().min(1),
  client: z.string().nullable().optional(),
  description: z.string().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  repoUrl: z.string().optional(),
  defaultBranch: z.string().optional(),
  deadline: z.string().nullable().optional(),
  price: z.object({
    amount: z.number().min(0),
    currency: z.enum(CURRENCIES),
  }).optional(),
  links: z.array(linkSchema).optional(),
});
