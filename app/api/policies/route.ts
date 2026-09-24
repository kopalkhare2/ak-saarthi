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

    const policies = await prisma.policy.findMany({
      where: whereClause,
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
  } catch (error: any) {
    console.error('Failed to create policy:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A policy with this number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
  }
}

