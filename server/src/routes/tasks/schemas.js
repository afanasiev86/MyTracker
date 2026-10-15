import { z } from 'zod';
import { PRIORITIES } from '../../../../shared/crm.js';
import { TASK_STATUSES } from '../../../../shared/statuses.js';
import { TASK_KINDS } from '../../../../shared/taskKinds.js';

const dateField = z.string().nullable().optional();

export const createSchema = z.object({
  project: z.string().min(1),
  title: z.string().min(1),
  goal: z.string().optional(),
  acceptance: z.array(z.string()).optional(),
  context: z.string().optional(),
  outOfScope: z.string().optional(),
  priority: z.enum(PRIORITIES).optional(),
  kind: z.enum(TASK_KINDS).optional(),
  dueDate: dateField,
  tags: z.array(z.string()).optional(),
});

export const updateSchema = createSchema.partial().extend({
  status: z.enum(TASK_STATUSES).optional(),
  branch: z.string().optional(),
  order: z.number().finite().optional(),
});

export const commentSchema = z.object({ text: z.string().min(1), visibleToClient: z.boolean().optional() });
export const textSchema = z.object({ text: z.string().trim().min(1, 'Текст не может быть пустым') });
// Подсказка для исправления ошибки необязательна
export const fixSchema = z.object({ text: z.string().trim().max(4000, 'Подсказка длиннее 4000 символов').optional() });
