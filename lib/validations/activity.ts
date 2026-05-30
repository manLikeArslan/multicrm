import { z } from 'zod';

export const activitySchema = z.object({
  deal_id: z.coerce.number().int().positive().optional().nullable(),
  contact_id: z.coerce.number().int().positive().optional().nullable(),
  activity_type: z.enum(['call', 'email', 'meeting', 'note']),
  summary: z.string().min(2, 'Summary must be at least 2 characters'),
});

export type ActivityInput = z.infer<typeof activitySchema>;
