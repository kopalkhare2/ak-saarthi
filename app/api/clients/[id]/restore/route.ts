import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, isAdmin } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'advisor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!isAdmin(session.email) && client.advisorId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!client.isDeleted) {
      return NextResponse.json({ error: 'Client is not in trash' }, { status: 400 });
    }

    // Restore client
    const restoredClient = await prisma.client.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    // Restore their documents too
    await prisma.clientDocument.updateMany({
      where: { clientId: id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    // Recreate linked User account if it doesn't exist
    if (restoredClient.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email: restoredClient.email.toLowerCase().trim() },
      });
      if (!existingUser) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('password', 10);
        await prisma.user.create({
          data: {
            email: restoredClient.email.toLowerCase().trim(),
            password: hashedPassword,
            role: 'client',
            clientId: restoredClient.id,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to restore client:', error);
    return NextResponse.json({ error: 'Failed to restore client' }, { status: 500 });
  }
}
