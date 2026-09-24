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

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      orderBy: {
        date: 'asc',
      },
    });
    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Failed to fetch appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
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

    const newAppointment = await prisma.appointment.create({
      data: {
        clientId: body.clientId || null,
        clientName: body.clientName || null,
        title: body.title,
        type: body.type,
        date: body.date,
        time: body.time,
        duration: Number(body.duration),
        location: body.location || null,
        notes: body.notes || null,
        status: body.status || 'scheduled',
        advisorId: session.userId,
      },
    });
    return NextResponse.json(newAppointment);
  } catch (error) {
    console.error('Failed to create appointment:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}

