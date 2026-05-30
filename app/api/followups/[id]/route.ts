import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateFollowupOutcome, deleteFollowup } from '@/lib/db/queries/followups';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const followupId = parseInt(id, 10);
    if (isNaN(followupId)) {
      return NextResponse.json({ error: 'Invalid followup ID' }, { status: 400 });
    }

    const body = await req.json();
    const { outcome, next_action } = body;

    if (!outcome) {
      return NextResponse.json({ error: 'Outcome is required' }, { status: 400 });
    }

    const followup = await updateFollowupOutcome(session, followupId, outcome, next_action);
    if (!followup) {
      return NextResponse.json({ error: 'Followup log not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Followup outcome recorded successfully', followup });
  } catch (error) {
    console.error('PATCH /api/followups/[id] Error:', error);
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

    const user = session.user as any;
    const isManagerOrAdmin = user.roleName === 'admin' || user.roleName === 'manager' || user.roleId === 1 || user.roleId === 2;

    if (!isManagerOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin or Manager role required to delete follow-ups' }, { status: 403 });
    }

    const { id } = await params;
    const followupId = parseInt(id, 10);
    if (isNaN(followupId)) {
      return NextResponse.json({ error: 'Invalid followup ID' }, { status: 400 });
    }

    const followup = await deleteFollowup(session, followupId);
    if (!followup) {
      return NextResponse.json({ error: 'Followup not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Followup deleted successfully', followup });
  } catch (error) {
    console.error('DELETE /api/followups/[id] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
