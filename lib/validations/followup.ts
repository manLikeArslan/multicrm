import { z } from 'zod';

export const followupSchema = z.object({
  contact_id: z.coerce.number().int().positive('Please select a valid contact'),
  lead_id: z.coerce.number().int().positive().optional().nullable(),
  deal_id: z.coerce.number().int().positive().optional().nullable(),
  scheduled_date: z.string().min(1, 'Scheduled date is required'),
  outcome: z.enum(['reached', 'no_answer', 'rescheduled', 'converted']).optional().nullable(),
  next_action: z.string().optional().nullable(),
});

export type FollowupInput = z.infer<typeof followupSchema>;
