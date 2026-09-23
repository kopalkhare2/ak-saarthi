import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

// GET: Download the actual file
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession();
    if ('response' in auth) return auth.response;
    const { session } = auth;

    const { id } = await params;

    const doc = await prisma.clientDocument.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (session.role === 'client' && doc.clientId !== session.clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!doc.filePath) {
      return NextResponse.json(
        { error: 'No file stored for this document (metadata-only record)' },
        { status: 404 }
      );
    }

    const fullPath = path.join(process.cwd(), doc.filePath);

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'File not found on disk. It may have been moved or corrupted.' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const headers = new Headers();
    headers.set('Content-Type', doc.mimeType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    headers.set('Content-Length', fileBuffer.length.toString());

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error) {
    console.error('Failed to download document:', error);
    return NextResponse.json({ error: 'Failed to download document' }, { status: 500 });
  }
}

// DELETE: Soft-delete (moves to trash, file stays on disk)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const { id } = await params;

    const doc = await prisma.clientDocument.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Soft-delete: preserve file on disk, just mark as deleted
    await prisma.clientDocument.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: 'Document moved to trash' });
  } catch (error) {
    console.error('Failed to delete document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
