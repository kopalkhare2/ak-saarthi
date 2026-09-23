import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const commissions = await prisma.commission.findMany({
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
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const body = await request.json();
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
