import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const auth = await requireSession();
    if ('response' in auth) return auth.response;
    const { session } = auth;

    const { searchParams } = new URL(request.url);
    const showTrash = searchParams.get('trash') === 'true';

    const where: Prisma.ClientWhereInput = { isDeleted: showTrash };

    // Clients may only ever see their own record — never the full roster.
    if (session.role === 'client') {
      where.id = session.clientId ?? '__none__';
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        family: true,
        notes: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const body = await request.json();
    const { family, notes, ...clientData } = body as Omit<Prisma.ClientCreateInput, 'family' | 'notes'> & {
      family?: { name: string; relation: string; dob?: string; phone?: string }[];
      notes?: { content: string }[];
    };

    const newClient = await prisma.client.create({
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
          create: (notes || []).map((note) => ({ content: note.content })),
        },
      },
      include: {
        family: true,
        notes: true,
      },
    });

    // Create linked Client User account with initial default password 'password'
    if (newClient.email) {
      const existingUser = await prisma.user.findFirst({ where: { email: newClient.email.toLowerCase().trim() } });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash('password', 10);
        await prisma.user.create({
          data: {
            email: newClient.email.toLowerCase().trim(),
            password: hashedPassword,
            role: 'client',
            clientId: newClient.id,
          },
        });
      }
    }

    return NextResponse.json(newClient);
  } catch (error) {
    console.error('Failed to create client:', error);
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'A client with this email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
