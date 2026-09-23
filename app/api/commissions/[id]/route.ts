import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const { id } = await params;
    const commission = await prisma.commission.findUnique({
      where: { id },
    });

    if (!commission) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
    }

    return NextResponse.json(commission);
  } catch (error) {
    console.error('Failed to fetch commission:', error);
    return NextResponse.json({ error: 'Failed to fetch commission' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const updatedCommission = await prisma.commission.update({
      where: { id },
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

    return NextResponse.json(updatedCommission);
  } catch (error) {
    console.error('Failed to update commission:', error);
    return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const { id } = await params;
    await prisma.commission.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete commission:', error);
    return NextResponse.json({ error: 'Failed to delete commission' }, { status: 500 });
  }
}
