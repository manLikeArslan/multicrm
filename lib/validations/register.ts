import { z } from 'zod';

export const registerSchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  industry: z.string().optional(),
  company_email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  country: z.string().optional(),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  work_email: z.string().email('Invalid work email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export type RegisterInput = z.infer<typeof registerSchema>;
