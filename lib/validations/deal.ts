import { z } from 'zod';

export const dealSchema = z.object({
  lead_id: z.coerce.number().int().positive().optional().nullable(),
  assigned_to: z.coerce.number().int().positive().optional().nullable(),
  deal_title: z.string().min(2, 'Deal title must be at least 2 characters').max(150),
  value: z.coerce.number().min(0, 'Value must be greater than or equal to 0').optional().nullable(),
  stage: z.enum(['proposal', 'negotiation', 'closed_won', 'closed_lost']),
  expected_close_date: z.string().optional().nullable(),
  actual_close_date: z.string().optional().nullable(),
});

export type DealInput = z.infer<typeof dealSchema>;
