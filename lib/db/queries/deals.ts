import { tq, TenantSession } from '../tenant';
import { Deal } from '../../../types';

export async function getDeals(
  session: TenantSession,
  filters: { stage?: string; assigned_to?: number } = {}
) {
  const companyId = session.user!.companyId;

  let query = `
    SELECT d.*, l.status as lead_status, c.full_name as contact_name, u.full_name as assignee_name
    FROM deals d
    LEFT JOIN leads l ON d.lead_id = l.lead_id
    LEFT JOIN contacts c ON l.contact_id = c.contact_id
    LEFT JOIN users u ON d.assigned_to = u.user_id
    WHERE d.company_id = $1
  `;
  const params: unknown[] = [companyId];
  let paramIndex = 2;

  if (filters.stage) {
    query += ` AND d.stage = $${paramIndex}`;
    params.push(filters.stage);
    paramIndex++;
  }

  if (filters.assigned_to) {
    query += ` AND d.assigned_to = $${paramIndex}`;
    params.push(filters.assigned_to);
    paramIndex++;
  }

  query += ' ORDER BY d.created_at DESC';

  return tq<any[]>(session, query, params);
}

export async function getDealById(session: TenantSession, dealId: number) {
  const companyId = session.user!.companyId;
  const deals = await tq<any[]>(
    session,
    `SELECT d.*, c.full_name as contact_name, c.email as contact_email, u.full_name as assignee_name
     FROM deals d
     LEFT JOIN leads l ON d.lead_id = l.lead_id
     LEFT JOIN contacts c ON l.contact_id = c.contact_id
     LEFT JOIN users u ON d.assigned_to = u.user_id
     WHERE d.deal_id = $1 AND d.company_id = $2 LIMIT 1`,
    [dealId, companyId]
  );
  return deals[0] || null;
}

export async function createDeal(
  session: TenantSession,
  deal: Omit<Deal, 'deal_id' | 'company_id' | 'created_at'>
) {
  const companyId = session.user!.companyId;

  const result = await tq<Deal[]>(
    session,
    `INSERT INTO deals (lead_id, company_id, assigned_to, deal_title, value, stage, expected_close_date, actual_close_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      deal.lead_id || null,
      companyId,
      deal.assigned_to || null,
      deal.deal_title,
      deal.value || null,
      deal.stage || 'proposal',
      deal.expected_close_date || null,
      deal.actual_close_date || null,
    ]
  );
  return result[0];
}

export async function updateDeal(
  session: TenantSession,
  dealId: number,
  deal: Partial<Omit<Deal, 'deal_id' | 'company_id' | 'created_at'>>
) {
  const companyId = session.user!.companyId;

  const result = await tq<Deal[]>(
    session,
    `UPDATE deals
     SET deal_title = COALESCE($1, deal_title),
         value = COALESCE($2, value),
         stage = COALESCE($3, stage),
         expected_close_date = COALESCE($4, expected_close_date),
         actual_close_date = COALESCE($5, actual_close_date),
         assigned_to = COALESCE($6, assigned_to)
     WHERE deal_id = $7 AND company_id = $8
     RETURNING *`,
    [
      deal.deal_title || null,
      deal.value || null,
      deal.stage || null,
      deal.expected_close_date || null,
      deal.actual_close_date || null,
      deal.assigned_to || null,
      dealId,
      companyId,
    ]
  );
  return result[0] || null;
}

export async function deleteDeal(session: TenantSession, dealId: number) {
  const companyId = session.user!.companyId;
  const result = await tq<Deal[]>(
    session,
    'DELETE FROM deals WHERE deal_id = $1 AND company_id = $2 RETURNING *',
    [dealId, companyId]
  );
  return result[0] || null;
}
