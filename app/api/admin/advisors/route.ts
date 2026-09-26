import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { getAuthSession, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !isAdmin(session.email)) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const advisors = await prisma.user.findMany({
      where: { role: 'advisor' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            clients: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(advisors);
  } catch (error) {
    console.error('Failed to fetch advisors:', error);
    return NextResponse.json({ error: 'Failed to fetch advisors' }, { status: 500 });
  }
}

// Reset advisor password by Admin
export async function PUT(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !isAdmin(session.email)) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { advisorId, newPassword } = await request.json();
    if (!advisorId || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Advisor ID and password (min 6 chars) required' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.user.update({
      where: { id: advisorId },
      data: { password: hashedPassword },
      select: { id: true, email: true },
    });

    return NextResponse.json({ success: true, message: `Password reset for ${updated.email}` });
  } catch (error) {
    console.error('Failed to reset advisor password:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
