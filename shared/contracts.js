// Контракт ответов API, который проверяется тестами сервера.
// Клиент эти схемы не импортирует: zod остаётся серверной зависимостью и не попадает в бандл.
import { z } from 'zod';

// Задача в портале заказчика (GET /api/portal/tasks), в том виде, как её отдаёт toClientTask.
// strict(): любое лишнее поле — ошибка. Так внутренние данные (запуски, логи, ветка) не уйдут заказчику.
export const PortalTaskSchema = z.object({
  id: z.string(),
  project: z.string(),
  title: z.string(),
  goal: z.string(),
  acceptance: z.array(z.string()),
  statusLabel: z.string(),
  dueDate: z.date().nullable(),
  updatedAt: z.date().optional(),
  comments: z.array(z.object({
    author: z.enum(['client', 'owner']),
    text: z.string(),
    createdAt: z.date().optional(),
  }).strict()),
}).strict();
