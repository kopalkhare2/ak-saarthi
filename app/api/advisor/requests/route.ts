import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';
import { notifyAdminNewRequest, sendAdvisorApprovalEmail } from '@/lib/email';

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

    // Notify admin via email
    try {
      await notifyAdminNewRequest({
        applicantName: name,
        applicantEmail: email,
        applicantPhone: phone,
      });
    } catch (e) {
      console.warn('Admin notification error:', e);
    }

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

    const { id, status, password } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const updatedRequest = await prisma.advisorAccessRequest.update({
      where: { id },
      data: { status },
    });

    let emailStatus = { sent: false, provider: 'none' };
    let welcomeTemplate = null;

    if (status === 'approved' && password) {
      const email = updatedRequest.email.toLowerCase().trim();
      const hashedPassword = await bcrypt.hash(password, 10);

      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: email } },
      });

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'advisor', password: hashedPassword },
        });
      } else {
        await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            role: 'advisor',
          },
        });
      }

      // Dispatch approval email
      try {
        const emailResult = await sendAdvisorApprovalEmail({
          to: email,
          name: updatedRequest.name,
          temporaryPassword: password,
        });
        emailStatus = { sent: emailResult.sent, provider: emailResult.provider || 'none' };
        welcomeTemplate = emailResult.template;
      } catch (emailErr) {
        console.warn('Failed to send approval email from PUT:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      id,
      status,
      emailStatus,
      welcomeTemplate,
    });
  } catch (error) {
    console.error('Failed to update access request:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
