import { NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';

// Only an already-authenticated advisor may create another advisor account.
export async function POST(request: Request) {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const { email: rawEmail, password } = await request.json();

    if (!rawEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const email = rawEmail.toLowerCase().trim();
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

    await prisma.advisorAccessRequest.updateMany({
      where: { email },
      data: { status: 'approved' },
    });

    return NextResponse.json({
      success: true,
      message: `Advisor account successfully created for ${email}`,
      user: { email, role: 'advisor' },
    });
  } catch (error) {
    console.error('Failed to create advisor:', error);
    return NextResponse.json(
      { error: 'Failed to create advisor account' },
      { status: 500 }
    );
  }
}
