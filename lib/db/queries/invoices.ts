import { tq, TenantSession } from '../tenant';
import { Invoice } from '../../../types';

export async function getInvoices(
  session: TenantSession,
  filters: { status?: string; deal_id?: number; limit?: number; offset?: number } = {}
) {
  const companyId = session.user!.companyId;
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;

  let query = `
    SELECT i.*, d.deal_title, u.full_name as issuer_name, c.full_name as contact_name
    FROM invoices i
    LEFT JOIN deals d ON i.deal_id = d.deal_id
    LEFT JOIN leads l ON d.lead_id = l.lead_id
    LEFT JOIN contacts c ON l.contact_id = c.contact_id
    LEFT JOIN users u ON i.issued_by = u.user_id
    WHERE i.company_id = $1
  `;
  const params: unknown[] = [companyId];
  let paramIndex = 2;

  if (filters.status) {
    query += ` AND i.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.deal_id) {
    query += ` AND i.deal_id = $${paramIndex}`;
    params.push(filters.deal_id);
    paramIndex++;
  }

  query += ` ORDER BY i.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  return tq<any[]>(session, query, params);
}

export async function getInvoiceById(session: TenantSession, invoiceId: number) {
  const companyId = session.user!.companyId;
  const invoices = await tq<any[]>(
    session,
    `SELECT i.*, d.deal_title, u.full_name as issuer_name, c.full_name as contact_name, c.email as contact_email
     FROM invoices i
     LEFT JOIN deals d ON i.deal_id = d.deal_id
     LEFT JOIN leads l ON d.lead_id = l.lead_id
     LEFT JOIN contacts c ON l.contact_id = c.contact_id
     LEFT JOIN users u ON i.issued_by = u.user_id
     WHERE i.invoice_id = $1 AND i.company_id = $2 LIMIT 1`,
    [invoiceId, companyId]
  );
  return invoices[0] || null;
}

export async function createInvoice(
  session: TenantSession,
  invoice: Omit<Invoice, 'invoice_id' | 'company_id' | 'issued_by' | 'created_at'>
) {
  const companyId = session.user!.companyId;
  const issuerId = session.user!.userId;

  const result = await tq<Invoice[]>(
    session,
    `INSERT INTO invoices (deal_id, company_id, issued_by, total_amount, due_date, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      invoice.deal_id,
      companyId,
      issuerId,
      invoice.total_amount,
      invoice.due_date || null,
      invoice.status || 'draft',
    ]
  );
  return result[0];
}

export async function updateInvoice(
  session: TenantSession,
  invoiceId: number,
  invoice: Partial<Omit<Invoice, 'invoice_id' | 'company_id' | 'issued_by' | 'created_at'>>
) {
  const companyId = session.user!.companyId;

  const result = await tq<Invoice[]>(
    session,
    `UPDATE invoices
     SET deal_id = COALESCE($1, deal_id),
         total_amount = COALESCE($2, total_amount),
         due_date = COALESCE($3, due_date),
         status = COALESCE($4, status)
     WHERE invoice_id = $5 AND company_id = $6
     RETURNING *`,
    [
      invoice.deal_id || null,
      invoice.total_amount || null,
      invoice.due_date || null,
      invoice.status || null,
      invoiceId,
      companyId,
    ]
  );
  return result[0] || null;
}

export async function deleteInvoice(session: TenantSession, invoiceId: number) {
  const companyId = session.user!.companyId;
  const result = await tq<Invoice[]>(
    session,
    'DELETE FROM invoices WHERE invoice_id = $1 AND company_id = $2 RETURNING *',
    [invoiceId, companyId]
  );
  return result[0] || null;
}
