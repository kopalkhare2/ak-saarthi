import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';

// GET: Fetch all advisor access requests (advisor-only — this is admin data)
export async function GET() {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const requests = await prisma.advisorAccessRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Failed to fetch advisor access requests:', error);
    return NextResponse.json({ error: 'Failed to fetch access requests' }, { status: 500 });
  }
}

// POST: Submit a new advisor access request from the public login page (no auth required)
export async function POST(request: Request) {
  try {
    const { name, email: rawEmail, phone } = await request.json();

    if (!name || !rawEmail || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone number are required' },
        { status: 400 }
      );
    }

    const email = rawEmail.toLowerCase().trim();

    const newRequest = await prisma.advisorAccessRequest.create({
      data: {
        name,
        email,
        phone,
        status: 'pending',
      },
    });

    await prisma.task.create({
      data: {
        title: `Advisor Access Request: ${name}`,
        description: `Email: ${email} | Phone: ${phone} | Requested access as financial advisor.`,
        priority: 'high',
        status: 'todo',
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Failed to submit advisor access request:', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}

// PUT: Approve/decline a request (advisor-only)
export async function PUT(request: Request) {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    await prisma.advisorAccessRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, id, status });
  } catch (error) {
    console.error('Failed to update access request:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
