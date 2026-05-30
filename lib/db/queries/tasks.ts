import { tq, TenantSession } from '../tenant';
import { Task } from '../../../types';

export async function getTasks(
  session: TenantSession,
  filters: { status?: string; priority?: string; assigned_to?: number; limit?: number; offset?: number } = {}
) {
  const companyId = session.user!.companyId;
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;

  let query = `
    SELECT t.*, u.full_name as assignee_name, d.deal_title, c.full_name as contact_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.user_id
    LEFT JOIN deals d ON t.deal_id = d.deal_id
    LEFT JOIN contacts c ON t.contact_id = c.contact_id
    WHERE t.company_id = $1
  `;
  const params: unknown[] = [companyId];
  let paramIndex = 2;

  if (filters.status) {
    query += ` AND t.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.priority) {
    query += ` AND t.priority = $${paramIndex}`;
    params.push(filters.priority);
    paramIndex++;
  }

  if (filters.assigned_to) {
    query += ` AND t.assigned_to = $${paramIndex}`;
    params.push(filters.assigned_to);
    paramIndex++;
  }

  query += ` ORDER BY t.due_date ASC, t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  return tq<any[]>(session, query, params);
}

export async function getTaskById(session: TenantSession, taskId: number) {
  const companyId = session.user!.companyId;
  const tasks = await tq<any[]>(
    session,
    'SELECT * FROM tasks WHERE task_id = $1 AND company_id = $2 LIMIT 1',
    [taskId, companyId]
  );
  return tasks[0] || null;
}

export async function createTask(
  session: TenantSession,
  task: Omit<Task, 'task_id' | 'company_id' | 'created_at'>
) {
  const companyId = session.user!.companyId;

  const result = await tq<Task[]>(
    session,
    `INSERT INTO tasks (company_id, assigned_to, deal_id, contact_id, title, description, due_date, priority, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      companyId,
      task.assigned_to || null,
      task.deal_id || null,
      task.contact_id || null,
      task.title,
      task.description || null,
      task.due_date || null,
      task.priority || 'medium',
      task.status || 'pending',
    ]
  );
  return result[0];
}

export async function updateTask(
  session: TenantSession,
  taskId: number,
  task: Partial<Omit<Task, 'task_id' | 'company_id' | 'created_at'>>
) {
  const companyId = session.user!.companyId;

  const result = await tq<Task[]>(
    session,
    `UPDATE tasks
     SET assigned_to = COALESCE($1, assigned_to),
         deal_id = COALESCE($2, deal_id),
         contact_id = COALESCE($3, contact_id),
         title = COALESCE($4, title),
         description = COALESCE($5, description),
         due_date = COALESCE($6, due_date),
         priority = COALESCE($7, priority),
         status = COALESCE($8, status)
     WHERE task_id = $9 AND company_id = $10
     RETURNING *`,
    [
      task.assigned_to || null,
      task.deal_id || null,
      task.contact_id || null,
      task.title || null,
      task.description || null,
      task.due_date || null,
      task.priority || null,
      task.status || null,
      taskId,
      companyId,
    ]
  );
  return result[0] || null;
}

export async function deleteTask(session: TenantSession, taskId: number) {
  const companyId = session.user!.companyId;
  const result = await tq<Task[]>(
    session,
    'DELETE FROM tasks WHERE task_id = $1 AND company_id = $2 RETURNING *',
    [taskId, companyId]
  );
  return result[0] || null;
}
