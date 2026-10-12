import { z } from 'zod';

export const commentSchema = z.object({
  text: z.string().trim().min(1, 'Напишите текст комментария').max(2000, 'Комментарий слишком длинный'),
});
