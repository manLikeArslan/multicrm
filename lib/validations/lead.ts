import { z } from 'zod';

export const leadSchema = z.object({
  contact_id: z.coerce.number().int().positive('Please select a valid contact'),
  assigned_to: z.coerce.number().int().positive('Please select a valid assignee').optional().nullable(),
  status: z.enum(['new', 'contacted', 'qualified', 'lost']),
  notes: z.string().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
