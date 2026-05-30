import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';
import { auth } from '@/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const isAdmin = user.roleName === 'admin' || user.roleId === 1;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }

    const { id } = await params;
    const roleId = parseInt(id, 10);

    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    // Verify the role belongs to this company and is not a default system role
    const roleQuery = await sql.query(
      'SELECT role_id, company_id, role_name FROM roles WHERE role_id = $1',
      [roleId]
    );

    if (roleQuery.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const targetRole = roleQuery[0] as any;

    if (targetRole.company_id === null) {
      return NextResponse.json({ error: 'Forbidden: Cannot delete standard system roles' }, { status: 403 });
    }

    if (targetRole.company_id !== user.companyId) {
      return NextResponse.json({ error: 'Unauthorized: Access denied' }, { status: 401 });
    }

    // Check if any user in this company is currently using this custom role
    const activeAssignments = await sql.query(
      "SELECT user_id FROM users WHERE role_id = $1 AND company_id = $2 AND status = 'active'",
      [roleId, user.companyId]
    );

    if (activeAssignments.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete role '${targetRole.role_name}' because it is currently assigned to active team members. Please re-assign those users before deleting.` },
        { status: 400 }
      );
    }

    // Safely delete the role
    await sql.query(
      'DELETE FROM roles WHERE role_id = $1 AND company_id = $2',
      [roleId, user.companyId]
    );

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/roles/[id] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
