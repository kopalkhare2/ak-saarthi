import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { getAuthSession, isAdmin } from '@/lib/auth';

// Max file size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

export async function GET(request?: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = request ? new URL(request.url) : null;
    const showTrash = url ? url.searchParams.get('trash') === 'true' : false;
    const clientId = url ? url.searchParams.get('clientId') : null;

    const whereClause: any = {
      isDeleted: showTrash,
    };
    if (clientId) {
      whereClause.clientId = clientId;
    }

    if (session.role === 'advisor') {
      if (!isAdmin(session.email)) {
        whereClause.client = {
          advisorId: session.userId,
        };
      }
    } else if (session.role === 'client') {
      whereClause.clientId = session.clientId;
    }

    const documents = await prisma.clientDocument.findMany({
      where: whereClause,
      orderBy: {
        uploadedAt: 'desc',
      },
    });
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'advisor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle multipart file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const clientId = formData.get('clientId') as string;
      const clientName = formData.get('clientName') as string;
      const docType = formData.get('type') as string;
      const docName = formData.get('name') as string;

      if (!file || !clientId || !clientName || !docType || !docName) {
        return NextResponse.json(
          { error: 'Missing required fields: file, clientId, clientName, type, name' },
          { status: 400 }
        );
      }

      // Verify advisor owns the client
      if (!isAdmin(session.email)) {
        const client = await prisma.client.findFirst({
          where: { id: clientId, advisorId: session.userId }
        });
        if (!client) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.` },
          { status: 400 }
        );
      }

      // Validate mime type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type "${file.type}" is not allowed. Allowed: PDF, JPEG, PNG, WebP, HEIC, Word, Excel, Text.` },
          { status: 400 }
        );
      }

      // Create upload directory: uploads/{clientId}/
      const uploadDir = path.join(process.cwd(), 'uploads', clientId);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate a unique filename to avoid collisions
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storedFileName = `${timestamp}-${safeName}`;
      const filePath = path.join('uploads', clientId, storedFileName);
      const fullPath = path.join(process.cwd(), filePath);

      // Write file to disk
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(fullPath, buffer);

      // Save metadata to database
      const newDoc = await prisma.clientDocument.create({
        data: {
          clientId,
          clientName,
          type: docType,
          name: docName,
          fileName: file.name,
          filePath,
          mimeType: file.type,
          size: file.size,
        },
      });

      return NextResponse.json(newDoc);
    }

    // Fallback: JSON-only document metadata (no file upload)
    const body = await request.json();

    // Verify advisor owns the client
    if (!isAdmin(session.email)) {
      const client = await prisma.client.findFirst({
        where: { id: body.clientId, advisorId: session.userId }
      });
      if (!client) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const newDoc = await prisma.clientDocument.create({
      data: {
        clientId: body.clientId,
        clientName: body.clientName,
        type: body.type,
        name: body.name,
        fileName: body.fileName,
        size: body.size ? Number(body.size) : null,
      },
    });
    return NextResponse.json(newDoc);
  } catch (error) {
    console.error('Failed to create document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

