import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getActivities, createActivity } from '@/lib/db/queries/activities';
import { activitySchema } from '@/lib/validations/activity';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;
    const performed_by = searchParams.get('performed_by') ? parseInt(searchParams.get('performed_by')!, 10) : undefined;
    const deal_id = searchParams.get('deal_id') ? parseInt(searchParams.get('deal_id')!, 10) : undefined;
    const contact_id = searchParams.get('contact_id') ? parseInt(searchParams.get('contact_id')!, 10) : undefined;

    const activities = await getActivities(session, { type, performed_by, deal_id, contact_id });
    return NextResponse.json(activities);
  } catch (error) {
    console.error('GET /api/activities Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = activitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const activity = await createActivity(session, parsed.data);
    return NextResponse.json({ message: 'Activity logged successfully', activity }, { status: 201 });
  } catch (error) {
    console.error('POST /api/activities Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
