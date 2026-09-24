import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { getAuthSession, isAdmin } from '@/lib/auth';

export async function GET(request?: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const showTrash = request
      ? new URL(request.url).searchParams.get('trash') === 'true'
      : false;

    const whereClause: any = {
      isDeleted: showTrash,
    };

    if (session.role === 'advisor') {
      if (!isAdmin(session.email)) {
        whereClause.advisorId = session.userId;
      }
    } else if (session.role === 'client') {
      whereClause.id = session.clientId;
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
        family: true,
        advisor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Map dates to match original schema and string-based representation
    const formattedClients = clients.map((client: any) => ({
      ...client,
      // Convert database notes (if any) and other properties to match typescript structures
      notes: [], // API has a separate notes table/handling if needed or simple array
    }));

    return NextResponse.json(formattedClients);
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.role !== 'advisor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { family, notes, ...clientData } = body;

    // Create client along with family members
    const newClient = await prisma.client.create({
      data: {
        ...clientData,
        advisorId: session.userId,
        family: {
          create: family?.map((member: any) => ({
            name: member.name,
            relation: member.relation,
            dob: member.dob || null,
            phone: member.phone || null,
          })) || [],
        },
      },
      include: {
        family: true,
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
            firstName: newClient.firstName,
            lastName: newClient.lastName,
            phone: newClient.phone,
          },
        });
      }
    }

    return NextResponse.json(newClient);
  } catch (error: any) {
    console.error('Failed to create client:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A client with this email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

