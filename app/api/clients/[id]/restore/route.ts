import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const { id } = await params;

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    if (!client.isDeleted) {
      return NextResponse.json({ error: 'Client is not in trash' }, { status: 400 });
    }

    // Restore client
    await prisma.client.update({
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to restore client:', error);
    return NextResponse.json({ error: 'Failed to restore client' }, { status: 500 });
  }
}
