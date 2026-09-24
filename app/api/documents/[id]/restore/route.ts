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

    const doc = await prisma.clientDocument.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!isAdmin(session.email) && doc.client.advisorId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!doc.isDeleted) {
      return NextResponse.json({ error: 'Document is not in trash' }, { status: 400 });
    }

    await prisma.clientDocument.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    return NextResponse.json({ success: true, message: 'Document restored successfully' });
  } catch (error) {
    console.error('Failed to restore document:', error);
    return NextResponse.json({ error: 'Failed to restore document' }, { status: 500 });
  }
}

