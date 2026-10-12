import { z } from 'zod';

export const approveSchema = z.object({ clientId: z.string().min(1) });
