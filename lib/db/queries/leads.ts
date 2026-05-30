import { tq, TenantSession } from '../tenant';
import { Lead } from '../../../types';

export async function getLeads(
  session: TenantSession,
  filters: { status?: string; assigned_to?: number; contact_id?: number; limit?: number; offset?: number } = {}
) {
  const companyId = session.user!.companyId;
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  let query = `
    SELECT l.*, c.full_name as contact_name, c.email as contact_email, c.phone as contact_phone, u.full_name as assignee_name
    FROM leads l
    JOIN contacts c ON l.contact_id = c.contact_id
    LEFT JOIN users u ON l.assigned_to = u.user_id
    WHERE l.company_id = $1
  `;
  const params: unknown[] = [companyId];
  let paramIndex = 2;

  if (filters.status) {
    query += ` AND l.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.assigned_to) {
    query += ` AND l.assigned_to = $${paramIndex}`;
    params.push(filters.assigned_to);
    paramIndex++;
  }

  if (filters.contact_id) {
    query += ` AND l.contact_id = $${paramIndex}`;
    params.push(filters.contact_id);
    paramIndex++;
  }

  query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  return tq<any[]>(session, query, params);
}

export async function getLeadById(session: TenantSession, leadId: number) {
  const companyId = session.user!.companyId;
  const leads = await tq<any[]>(
    session,
    `SELECT l.*, c.full_name as contact_name, c.email as contact_email, c.phone as contact_phone, u.full_name as assignee_name
     FROM leads l
     JOIN contacts c ON l.contact_id = c.contact_id
     LEFT JOIN users u ON l.assigned_to = u.user_id
     WHERE l.lead_id = $1 AND l.company_id = $2 LIMIT 1`,
    [leadId, companyId]
  );
  return leads[0] || null;
}

export async function createLead(
  session: TenantSession,
  lead: Omit<Lead, 'lead_id' | 'company_id' | 'created_at'>
) {
  const companyId = session.user!.companyId;

  const result = await tq<Lead[]>(
    session,
    `INSERT INTO leads (contact_id, company_id, assigned_to, status, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      lead.contact_id,
      companyId,
      lead.assigned_to || null,
      lead.status,
      lead.notes || null,
    ]
  );
  return result[0];
}

export async function updateLead(
  session: TenantSession,
  leadId: number,
  lead: Partial<Omit<Lead, 'lead_id' | 'company_id' | 'created_at'>>
) {
  const companyId = session.user!.companyId;

  const result = await tq<Lead[]>(
    session,
    `UPDATE leads
     SET assigned_to = COALESCE($1, assigned_to),
         status = COALESCE($2, status),
         notes = COALESCE($3, notes)
     WHERE lead_id = $4 AND company_id = $5
     RETURNING *`,
    [
      lead.assigned_to || null,
      lead.status || null,
      lead.notes || null,
      leadId,
      companyId,
    ]
  );
  return result[0] || null;
}

export async function deleteLead(session: TenantSession, leadId: number) {
  const companyId = session.user!.companyId;
  const result = await tq<Lead[]>(
    session,
    'DELETE FROM leads WHERE lead_id = $1 AND company_id = $2 RETURNING *',
    [leadId, companyId]
  );
  return result[0] || null;
}

export async function convertLeadToDeal(
  session: TenantSession,
  leadId: number,
  dealTitle: string,
  value: number
) {
  const companyId = session.user!.companyId;
  
  // 1. Fetch the lead to make sure it belongs to same company
  const leadResult = await tq<any[]>(
    session,
    'SELECT * FROM leads WHERE lead_id = $1 AND company_id = $2 LIMIT 1',
    [leadId, companyId]
  );
  
  if (leadResult.length === 0) {
    throw new Error('Lead not found in this company');
  }
  
  const lead = leadResult[0];

  // 2. Insert the deal
  const dealResult = await tq<any[]>(
    session,
    `INSERT INTO deals (lead_id, company_id, assigned_to, deal_title, value, stage)
     VALUES ($1, $2, $3, $4, $5, 'proposal')
     RETURNING *`,
    [
      leadId,
      companyId,
      lead.assigned_to || null,
      dealTitle,
      value,
    ]
  );

  // 3. Update the lead status to 'qualified'
  await tq(
    session,
    "UPDATE leads SET status = 'qualified' WHERE lead_id = $1 AND company_id = $2",
    [leadId, companyId]
  );

  return dealResult[0];
}
