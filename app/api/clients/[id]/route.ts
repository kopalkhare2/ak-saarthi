import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import type { Prisma } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession();
    if ('response' in auth) return auth.response;
    const { session } = auth;

    const { id } = await params;

    if (session.role === 'client' && session.clientId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        family: true,
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Failed to fetch client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

interface FamilyMemberInput {
  name: string;
  relation: string;
  dob?: string;
  phone?: string;
}

interface NoteInput {
  content: string;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const { family, notes, ...clientData } = body as Omit<Prisma.ClientUpdateInput, 'family' | 'notes'> & {
      family?: FamilyMemberInput[];
      notes?: NoteInput[];
    };

    // Use a transaction to update client and recreate family members + notes
    const updatedClient = await prisma.$transaction(async (tx) => {
      await tx.familyMember.deleteMany({ where: { clientId: id } });
      await tx.note.deleteMany({ where: { clientId: id } });

      return tx.client.update({
        where: { id },
        data: {
          ...clientData,
          family: {
            create: (family || []).map((member) => ({
              name: member.name,
              relation: member.relation,
              dob: member.dob || null,
              phone: member.phone || null,
            })),
          },
          notes: {
            create: (notes || []).map((note) => ({
              content: note.content,
            })),
          },
        },
        include: {
          family: true,
          notes: { orderBy: { createdAt: 'desc' } },
        },
      });
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Failed to update client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

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
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Soft-delete: mark as deleted, preserve all data
    await prisma.client.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Also soft-delete all their documents
    await prisma.clientDocument.updateMany({
      where: { clientId: id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
