import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const tasks = await prisma.task.findMany({
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
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const body = await request.json();
    const newTask = await prisma.task.create({
      data: {
        clientId: body.clientId || null,
        clientName: body.clientName || null,
        title: body.title,
        description: body.description || null,
        priority: body.priority,
        status: body.status,
        dueDate: body.dueDate || null,
      },
    });
    return NextResponse.json(newTask);
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
