import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

// This is the ONLY way to truly remove a document — permanently deletes from DB and disk.
export async function DELETE(
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
