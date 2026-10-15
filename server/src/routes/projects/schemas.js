import { z } from 'zod';
import { isRepoUrl } from '../../services/projects/repo.js';
import { PROJECT_STATUSES, SLUG_PATTERN } from '../../../../shared/crm.js';

const linkSchema = z.object({ title: z.string().min(1), url: z.string().url() });

export const projectSchema = z.object({
  // Без slug код строится из названия (см. createProject)
  slug: z.string().regex(SLUG_PATTERN, 'Латиница, цифры и дефис, например shop-api').optional(),
  name: z.string().min(1),
  client: z.string().nullable().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  repoUrl: z.string().trim().refine((v) => v === '' || isRepoUrl(v), 'Ссылка на репозиторий: https://github.com/владелец/имя или git@github.com:владелец/имя.git').optional(),
  defaultBranch: z.string().optional(),
  commitToBase: z.boolean().optional(),
  uatBranch: z.string().optional(),
  links: z.array(linkSchema).optional(),
});
