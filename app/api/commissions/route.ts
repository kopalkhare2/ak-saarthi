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
        whereClause.client = {
          advisorId: session.userId,
        };
      }
    } else if (session.role === 'client') {
      whereClause.clientId = session.clientId;
    }

    const commissions = await prisma.commission.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(commissions);
  } catch (error) {
    console.error('Failed to fetch commissions:', error);
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'advisor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Verify advisor owns the client
    if (!isAdmin(session.email)) {
      const client = await prisma.client.findFirst({
        where: { id: body.clientId, advisorId: session.userId }
      });
      if (!client) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const newCommission = await prisma.commission.create({
      data: {
        clientId: body.clientId,
        policyId: body.policyId || null,
        company: body.company,
        type: body.type,
        amount: Number(body.amount),
        month: body.month,
        status: body.status,
        paidDate: body.paidDate || null,
      },
    });
    return NextResponse.json(newCommission);
  } catch (error) {
    console.error('Failed to create commission:', error);
    return NextResponse.json({ error: 'Failed to create commission' }, { status: 500 });
  }
}

