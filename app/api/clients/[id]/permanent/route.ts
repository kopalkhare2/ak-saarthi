import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: { documents: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!client.isDeleted) {
      return NextResponse.json(
        { error: 'Client must be in trash before permanent deletion. Delete first, then permanently delete from trash.' },
        { status: 400 }
      );
    }

    // Delete actual files from disk for all client documents
    for (const doc of client.documents) {
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
    }

    // Clean up the client's upload directory
    const clientUploadDir = path.join(process.cwd(), 'uploads', id);
    if (fs.existsSync(clientUploadDir)) {
      fs.rmSync(clientUploadDir, { recursive: true, force: true });
    }

    // Hard-delete client (cascade will remove all related records)
    await prisma.client.delete({
      where: { id },
    });

    // Also delete any User account linked to this client
    await prisma.user.deleteMany({
      where: { email: client.email },
    });

    return NextResponse.json({ success: true, message: 'Client and all data permanently deleted' });
  } catch (error) {
    console.error('Failed to permanently delete client:', error);
    return NextResponse.json({ error: 'Failed to permanently delete client' }, { status: 500 });
  }
}
