import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, isAdmin } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const investment = await prisma.investment.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!investment) {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }

    if (session.role === 'advisor') {
      if (!isAdmin(session.email) && investment.client.advisorId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (session.role === 'client') {
      if (investment.clientId !== session.clientId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(investment);
  } catch (error) {
    console.error('Failed to fetch investment:', error);
    return NextResponse.json({ error: 'Failed to fetch investment' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'advisor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const investment = await prisma.investment.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!investment) {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }

    if (!isAdmin(session.email) && investment.client.advisorId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const updatedInvestment = await prisma.investment.update({
      where: { id },
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

    return NextResponse.json(updatedInvestment);
  } catch (error) {
    console.error('Failed to update investment:', error);
    return NextResponse.json({ error: 'Failed to update investment' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'advisor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const investment = await prisma.investment.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!investment) {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }

    if (!isAdmin(session.email) && investment.client.advisorId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.investment.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete investment:', error);
    return NextResponse.json({ error: 'Failed to delete investment' }, { status: 500 });
  }
}

