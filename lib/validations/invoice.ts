import { z } from 'zod';

export const invoiceSchema = z.object({
  deal_id: z.coerce.number().int().positive('Please select an active deal'),
  total_amount: z.coerce.number().positive('Total amount must be greater than 0'),
  due_date: z.string().optional().nullable(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
