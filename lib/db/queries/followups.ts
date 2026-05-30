import { tq, TenantSession } from '../tenant';
import { FollowupLog } from '../../../types';

export async function getFollowups(
  session: TenantSession,
  filters: { outcome?: string; scheduled_by?: number; contact_id?: number; upcoming?: boolean; past?: boolean } = {}
) {
  const companyId = session.user!.companyId;

  let query = `
    SELECT f.*, c.full_name as contact_name, c.email as contact_email, d.deal_title, u.full_name as scheduler_name
    FROM followup_logs f
    JOIN contacts c ON f.contact_id = c.contact_id
    LEFT JOIN deals d ON f.deal_id = d.deal_id
    LEFT JOIN users u ON f.scheduled_by = u.user_id
    WHERE f.company_id = $1
  `;
  const params: unknown[] = [companyId];
  let paramIndex = 2;

  if (filters.outcome) {
    query += ` AND f.outcome = $${paramIndex}`;
    params.push(filters.outcome);
    paramIndex++;
  }

  if (filters.scheduled_by) {
    query += ` AND f.scheduled_by = $${paramIndex}`;
    params.push(filters.scheduled_by);
    paramIndex++;
  }

  if (filters.contact_id) {
    query += ` AND f.contact_id = $${paramIndex}`;
    params.push(filters.contact_id);
    paramIndex++;
  }

  if (filters.upcoming) {
    query += ` AND f.scheduled_date >= NOW() AND f.outcome IS NULL`;
  } else if (filters.past) {
    query += ` AND (f.scheduled_date < NOW() OR f.outcome IS NOT NULL)`;
  }

  query += ' ORDER BY f.scheduled_date ASC';

  return tq<any[]>(session, query, params);
}

export async function createFollowup(
  session: TenantSession,
  followup: Omit<FollowupLog, 'followup_id' | 'company_id' | 'scheduled_by' | 'created_at'>
) {
  const companyId = session.user!.companyId;
  const schedulerId = session.user!.userId;

  const result = await tq<FollowupLog[]>(
    session,
    `INSERT INTO followup_logs (company_id, contact_id, lead_id, deal_id, scheduled_by, scheduled_date, outcome, next_action)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      companyId,
      followup.contact_id,
      followup.lead_id || null,
      followup.deal_id || null,
      schedulerId,
      followup.scheduled_date,
      followup.outcome || null,
      followup.next_action || null,
    ]
  );
  return result[0];
}

export async function updateFollowupOutcome(
  session: TenantSession,
  followupId: number,
  outcome: string,
  nextAction?: string
) {
  const companyId = session.user!.companyId;

  const result = await tq<FollowupLog[]>(
    session,
    `UPDATE followup_logs
     SET outcome = $1,
         next_action = COALESCE($2, next_action)
     WHERE followup_id = $3 AND company_id = $4
     RETURNING *`,
    [outcome, nextAction || null, followupId, companyId]
  );
  return result[0] || null;
}

export async function deleteFollowup(session: TenantSession, followupId: number) {
  const companyId = session.user!.companyId;
  const result = await tq<FollowupLog[]>(
    session,
    'DELETE FROM followup_logs WHERE followup_id = $1 AND company_id = $2 RETURNING *',
    [followupId, companyId]
  );
  return result[0] || null;
}
