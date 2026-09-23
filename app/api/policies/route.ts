import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import type { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const auth = await requireSession();
    if ('response' in auth) return auth.response;
    const { session } = auth;

    const where: Prisma.PolicyWhereInput =
      session.role === 'client' ? { clientId: session.clientId ?? '__none__' } : {};

    const policies = await prisma.policy.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(policies);
  } catch (error) {
    console.error('Failed to fetch policies:', error);
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const body = await request.json();
    const newPolicy = await prisma.policy.create({
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
    return NextResponse.json(newPolicy);
  } catch (error) {
    console.error('Failed to create policy:', error);
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'A policy with this number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
  }
}
