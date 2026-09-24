import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { getAuthSession, isAdmin } from '@/lib/auth';

// This is the ONLY way to truly remove a document — permanently deletes from DB and disk.
export async function DELETE(
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
      return NextResponse.json(
        { error: 'Document must be in trash before permanent deletion. Delete first, then permanently delete from trash.' },
        { status: 400 }
      );
    }

    // Delete actual file from disk
    if (doc.filePath) {
      try {
        const fullPath = path.join(process.cwd(), doc.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        console.error(`Failed to delete file ${doc.filePath}:`, err);
      }
    }

    // Hard-delete from database
    await prisma.clientDocument.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Document permanently deleted' });
  } catch (error) {
    console.error('Failed to permanently delete document:', error);
    return NextResponse.json({ error: 'Failed to permanently delete document' }, { status: 500 });
  }
}

