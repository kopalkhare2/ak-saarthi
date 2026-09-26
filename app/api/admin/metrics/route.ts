import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !isAdmin(session.email)) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const [
      totalAdvisors,
      totalClients,
      totalPolicies,
      totalInvestments,
      pendingRequests,
      recentRequests,
      advisorsList,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'advisor' } }),
      prisma.client.count({ where: { isDeleted: false } }),
      prisma.policy.count(),
      prisma.investment.count(),
      prisma.advisorAccessRequest.count({ where: { status: 'pending' } }),
      prisma.advisorAccessRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.user.findMany({
        where: { role: 'advisor' },
        select: {
          id: true,
          email: true,
          createdAt: true,
          _count: {
            select: { clients: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalAdvisors,
        totalClients,
        totalPolicies,
        totalInvestments,
        pendingRequests,
      },
      recentRequests,
      advisorsList,
    });
  } catch (error) {
    console.error('Failed to fetch admin metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch admin metrics' }, { status: 500 });
  }
}
