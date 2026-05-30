import { z } from 'zod';

export const paymentSchema = z.object({
  invoice_id: z.coerce.number().int().positive('Please select a valid invoice'),
  amount_paid: z.coerce.number().positive('Payment amount must be greater than 0'),
  payment_date: z.string(),
  payment_method: z.enum(['bank_transfer', 'card', 'cash', 'cheque']),
  notes: z.string().optional().nullable(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
