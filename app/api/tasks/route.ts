import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const whereClause: any = {};
    if (session.role === 'advisor') {
      if (!isAdmin(session.email)) {
        whereClause.OR = [
          { advisorId: session.userId },
          { client: { advisorId: session.userId } }
        ];
      }
    } else if (session.role === 'client') {
      whereClause.clientId = session.clientId;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'advisor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Verify advisor owns the client if clientId is provided
    if (body.clientId && !isAdmin(session.email)) {
      const client = await prisma.client.findFirst({
        where: { id: body.clientId, advisorId: session.userId }
      });
      if (!client) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const newTask = await prisma.task.create({
      data: {
        clientId: body.clientId || null,
        clientName: body.clientName || null,
        title: body.title,
        description: body.description || null,
        priority: body.priority,
        status: body.status,
        dueDate: body.dueDate || null,
        advisorId: session.userId,
      },
    });
    return NextResponse.json(newTask);
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

