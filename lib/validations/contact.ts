import { z } from 'zod';

export const contactSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  job_title: z.string().optional(),
  source: z.enum(['referral', 'web', 'cold_outreach', 'social']),
});

export type ContactInput = z.infer<typeof contactSchema>;
