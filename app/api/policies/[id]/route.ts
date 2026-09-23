import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession();
    if ('response' in auth) return auth.response;
    const { session } = auth;

    const { id } = await params;
    const policy = await prisma.policy.findUnique({
      where: { id },
    });

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    if (session.role === 'client' && policy.clientId !== session.clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(policy);
  } catch (error) {
    console.error('Failed to fetch policy:', error);
    return NextResponse.json({ error: 'Failed to fetch policy' }, { status: 500 });
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

    const updatedPolicy = await prisma.policy.update({
      where: { id },
      data: {
        clientId: body.clientId,
        company: body.company,
        policyNumber: body.policyNumber,
        type: body.type,
        premium: Number(body.premium),
        premiumFrequency: body.premiumFrequency,
        dueDate: body.dueDate,
        startDate: body.startDate,
        endDate: body.endDate || null,
        sumAssured: Number(body.sumAssured),
        nominee: body.nominee,
        status: body.status,
        claimStatus: body.claimStatus || null,
        renewalStatus: body.renewalStatus || 'not_due',
      },
    });

    return NextResponse.json(updatedPolicy);
  } catch (error) {
    console.error('Failed to update policy:', error);
    return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 });
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
    await prisma.policy.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete policy:', error);
    return NextResponse.json({ error: 'Failed to delete policy' }, { status: 500 });
  }
}
