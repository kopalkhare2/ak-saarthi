import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { getAuthSession, isAdmin } from '@/lib/auth';

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

    const client = await prisma.client.findUnique({
      where: { id },
      include: { documents: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!isAdmin(session.email) && client.advisorId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
