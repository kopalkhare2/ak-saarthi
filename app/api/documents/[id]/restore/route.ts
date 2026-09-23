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

    const doc = await prisma.clientDocument.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
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
