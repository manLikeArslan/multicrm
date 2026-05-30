import { z } from 'zod';

export const taskSchema = z.object({
  assigned_to: z.coerce.number().int().positive().optional().nullable(),
  deal_id: z.coerce.number().int().positive().optional().nullable(),
  contact_id: z.coerce.number().int().positive().optional().nullable(),
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  description: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'in_progress', 'completed']),
});

export type TaskInput = z.infer<typeof taskSchema>;
