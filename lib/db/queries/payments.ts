import { tq, TenantSession } from '../tenant';
import { Payment } from '../../../types';

export async function getPayments(
  session: TenantSession,
  filters: { invoice_id?: number; limit?: number; offset?: number } = {}
) {
  const companyId = session.user!.companyId;
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;

  let query = `
    SELECT p.*, i.total_amount as invoice_amount, d.deal_title
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.invoice_id
    JOIN deals d ON i.deal_id = d.deal_id
    WHERE p.company_id = $1
  `;
  const params: unknown[] = [companyId];
  let paramIndex = 2;

  if (filters.invoice_id) {
    query += ` AND p.invoice_id = $${paramIndex}`;
    params.push(filters.invoice_id);
    paramIndex++;
  }

  query += ` ORDER BY p.payment_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  return tq<any[]>(session, query, params);
}

export async function createPayment(
  session: TenantSession,
  payment: Omit<Payment, 'payment_id' | 'company_id'>
) {
  const companyId = session.user!.companyId;

  // 1. Record the Payment
  const result = await tq<Payment[]>(
    session,
    `INSERT INTO payments (invoice_id, company_id, amount_paid, payment_date, payment_method, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      payment.invoice_id,
      companyId,
      payment.amount_paid,
      payment.payment_date,
      payment.payment_method,
      payment.notes || null,
    ]
  );

  // 2. Atomically update the invoice status to 'paid'
  await tq(
    session,
    "UPDATE invoices SET status = 'paid' WHERE invoice_id = $1 AND company_id = $2",
    [payment.invoice_id, companyId]
  );

  return result[0];
}
