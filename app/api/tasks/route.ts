import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getTasks, createTask } from '@/lib/db/queries/tasks';
import { taskSchema } from '@/lib/validations/task';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const assigned_to = searchParams.get('assigned_to') ? parseInt(searchParams.get('assigned_to')!, 10) : undefined;

    const tasks = await getTasks(session, { status, priority, assigned_to });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('GET /api/tasks Error:', error);
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
    const parsed = taskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const task = await createTask(session, parsed.data as any);
    return NextResponse.json({ message: 'Task created successfully', task }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
