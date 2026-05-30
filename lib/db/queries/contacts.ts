import { tq, TenantSession } from '../tenant';
import { Contact } from '../../../types';

export async function getContacts(
  session: TenantSession,
  filters: { source?: string; search?: string; limit?: number; offset?: number } = {}
) {
  const companyId = session.user!.companyId;
  const limit = filters.limit || 10;
  const offset = filters.offset || 0;
  
  let query = `
    SELECT c.*, u.full_name as creator_name
    FROM contacts c
    LEFT JOIN users u ON c.created_by = u.user_id
    WHERE c.company_id = $1
  `;
  const params: unknown[] = [companyId];
  let paramIndex = 2;

  if (filters.source) {
    query += ` AND c.source = $${paramIndex}`;
    params.push(filters.source);
    paramIndex++;
  }

  if (filters.search) {
    query += ` AND (c.full_name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  return tq<Contact[]>(session, query, params);
}

export async function getContactById(session: TenantSession, contactId: number) {
  const companyId = session.user!.companyId;
  const contacts = await tq<Contact[]>(
    session,
    'SELECT * FROM contacts WHERE contact_id = $1 AND company_id = $2 LIMIT 1',
    [contactId, companyId]
  );
  return contacts[0] || null;
}

export async function createContact(
  session: TenantSession,
  contact: Omit<Contact, 'contact_id' | 'company_id' | 'created_by' | 'created_at'>
) {
  const companyId = session.user!.companyId;
  const creatorId = session.user!.userId;

  const result = await tq<Contact[]>(
    session,
    `INSERT INTO contacts (company_id, full_name, email, phone, job_title, source, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      companyId,
      contact.full_name,
      contact.email || null,
      contact.phone || null,
      contact.job_title || null,
      contact.source,
      creatorId,
    ]
  );
  return result[0];
}

export async function updateContact(
  session: TenantSession,
  contactId: number,
  contact: Partial<Omit<Contact, 'contact_id' | 'company_id' | 'created_by' | 'created_at'>>
) {
  const companyId = session.user!.companyId;

  const result = await tq<Contact[]>(
    session,
    `UPDATE contacts
     SET full_name = COALESCE($1, full_name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         job_title = COALESCE($4, job_title),
         source = COALESCE($5, source)
     WHERE contact_id = $6 AND company_id = $7
     RETURNING *`,
    [
      contact.full_name || null,
      contact.email || null,
      contact.phone || null,
      contact.job_title || null,
      contact.source || null,
      contactId,
      companyId,
    ]
  );
  return result[0] || null;
}

export async function deleteContact(session: TenantSession, contactId: number) {
  const companyId = session.user!.companyId;
  const result = await tq<Contact[]>(
    session,
    'DELETE FROM contacts WHERE contact_id = $1 AND company_id = $2 RETURNING *',
    [contactId, companyId]
  );
  return result[0] || null;
}
