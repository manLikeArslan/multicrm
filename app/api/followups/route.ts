import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getFollowups, createFollowup } from '@/lib/db/queries/followups';
import { followupSchema } from '@/lib/validations/followup';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const outcome = searchParams.get('outcome') || undefined;
    const scheduled_by = searchParams.get('scheduled_by') ? parseInt(searchParams.get('scheduled_by')!, 10) : undefined;
    const contact_id = searchParams.get('contact_id') ? parseInt(searchParams.get('contact_id')!, 10) : undefined;
    const upcoming = searchParams.get('upcoming') === 'true';
    const past = searchParams.get('past') === 'true';

    const followups = await getFollowups(session, { outcome, scheduled_by, contact_id, upcoming, past });
    return NextResponse.json(followups);
  } catch (error) {
    console.error('GET /api/followups Error:', error);
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
    const parsed = followupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const followup = await createFollowup(session, parsed.data as any);
    return NextResponse.json({ message: 'Followup scheduled successfully', followup }, { status: 201 });
  } catch (error) {
    console.error('POST /api/followups Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
