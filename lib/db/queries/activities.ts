import { tq, TenantSession } from '../tenant';
import { Activity } from '../../../types';

export async function getActivities(
  session: TenantSession,
  filters: { type?: string; performed_by?: number; deal_id?: number; contact_id?: number } = {}
) {
  const companyId = session.user!.companyId;

  let query = `
    SELECT a.*, d.deal_title, c.full_name as contact_name, u.full_name as performer_name
    FROM activities a
    LEFT JOIN deals d ON a.deal_id = d.deal_id
    LEFT JOIN contacts c ON a.contact_id = c.contact_id
    LEFT JOIN users u ON a.performed_by = u.user_id
    WHERE a.company_id = $1
  `;
  const params: unknown[] = [companyId];
  let paramIndex = 2;

  if (filters.type) {
    query += ` AND a.activity_type = $${paramIndex}`;
    params.push(filters.type);
    paramIndex++;
  }

  if (filters.performed_by) {
    query += ` AND a.performed_by = $${paramIndex}`;
    params.push(filters.performed_by);
    paramIndex++;
  }

  if (filters.deal_id) {
    query += ` AND a.deal_id = $${paramIndex}`;
    params.push(filters.deal_id);
    paramIndex++;
  }

  if (filters.contact_id) {
    query += ` AND a.contact_id = $${paramIndex}`;
    params.push(filters.contact_id);
    paramIndex++;
  }

  query += ' ORDER BY a.activity_date DESC';

  return tq<any[]>(session, query, params);
}

export async function createActivity(
  session: TenantSession,
  activity: Omit<Activity, 'activity_id' | 'company_id' | 'performed_by' | 'activity_date'>
) {
  const companyId = session.user!.companyId;
  const performerId = session.user!.userId;

  const result = await tq<Activity[]>(
    session,
    `INSERT INTO activities (deal_id, contact_id, company_id, performed_by, activity_type, summary)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      activity.deal_id || null,
      activity.contact_id || null,
      companyId,
      performerId,
      activity.activity_type,
      activity.summary || null,
    ]
  );
  return result[0];
}

export async function deleteActivity(session: TenantSession, activityId: number) {
  const companyId = session.user!.companyId;
  const result = await tq<Activity[]>(
    session,
    'DELETE FROM activities WHERE activity_id = $1 AND company_id = $2 RETURNING *',
    [activityId, companyId]
  );
  return result[0] || null;
}
