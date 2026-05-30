import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { tq } from '@/lib/db/tenant';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as any;
    if (currentUser.roleName !== 'admin' && currentUser.roleId !== 1) {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const companyId = session.user.companyId;

    // Verify user belongs to same company
    const verifyUser = await tq(
      session,
      'SELECT user_id FROM users WHERE user_id = $1 AND company_id = $2 LIMIT 1',
      [userId, companyId]
    );

    if (verifyUser.length === 0) {
      return NextResponse.json({ error: 'User not found in this company' }, { status: 404 });
    }

    const body = await req.json();
    const { full_name, role_id, phone, status } = body;

    const result = await tq(
      session,
      `UPDATE users 
       SET full_name = COALESCE($1, full_name), 
           role_id = COALESCE($2, role_id), 
           phone = COALESCE($3, phone),
           status = COALESCE($4, status)
       WHERE user_id = $5 AND company_id = $6
       RETURNING user_id, company_id, role_id, full_name, email, phone, status`,
      [full_name || null, role_id || null, phone || null, status || null, userId, companyId]
    );

    return NextResponse.json({ message: 'User updated successfully', user: result[0] });
  } catch (error) {
    console.error('PATCH /api/users/[id] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as any;
    if (currentUser.roleName !== 'admin' && currentUser.roleId !== 1) {
      return NextResponse.json({ error: 'Forbidden: Admin role required' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const companyId = session.user.companyId;

    // Prevent admin from deactivating their own account
    if (userId === currentUser.userId) {
      return NextResponse.json({ error: 'Forbidden: Cannot deactivate your own administrator account' }, { status: 400 });
    }

    // Soft delete: set status = 'inactive'
    const result = await tq(
      session,
      `UPDATE users 
       SET status = 'inactive'
       WHERE user_id = $1 AND company_id = $2
       RETURNING user_id, full_name, status`,
      [userId, companyId]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found in this company' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User soft-deleted (status set to inactive) successfully', user: result[0] });
  } catch (error) {
    console.error('DELETE /api/users/[id] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
