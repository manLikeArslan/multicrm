import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deleteActivity } from '@/lib/db/queries/activities';

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
    const isManagerOrAdmin = user.roleName === 'admin' || user.roleName === 'manager' || user.roleId === 1 || user.roleId === 2;

    if (!isManagerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin or Manager role required to delete activities' }, { status: 403 });
    }

    const { id } = await params;
    const activityId = parseInt(id, 10);
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 });
    }

    const activity = await deleteActivity(session, activityId);
    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Activity deleted successfully', activity });
  } catch (error) {
    console.error('DELETE /api/activities/[id] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
