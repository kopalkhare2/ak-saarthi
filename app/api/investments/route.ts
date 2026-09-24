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

    const investments = await prisma.investment.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(investments);
  } catch (error) {
    console.error('Failed to fetch investments:', error);
    return NextResponse.json({ error: 'Failed to fetch investments' }, { status: 500 });
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

    const newInvestment = await prisma.investment.create({
      data: {
        clientId: body.clientId,
        type: body.type,
        schemeName: body.schemeName,
        fundHouse: body.fundHouse || null,
        investedAmount: Number(body.investedAmount),
        currentValue: Number(body.currentValue),
        returns: Number(body.returns),
        sipAmount: body.sipAmount ? Number(body.sipAmount) : null,
        sipDate: body.sipDate ? Number(body.sipDate) : null,
        startDate: body.startDate,
        maturityDate: body.maturityDate || null,
        status: body.status,
      },
    });
    return NextResponse.json(newInvestment);
  } catch (error) {
    console.error('Failed to create investment:', error);
    return NextResponse.json({ error: 'Failed to create investment' }, { status: 500 });
  }
}

