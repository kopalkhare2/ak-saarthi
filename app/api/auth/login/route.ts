import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email: rawEmail, password, role: requestedRole } = await request.json();

    if (!rawEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const email = rawEmail.toLowerCase().trim();

    // Find user (case-insensitive email matching)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify role match if specified
    if (requestedRole && user.role !== requestedRole) {
      return NextResponse.json(
        {
          error: `Access Denied: This email belongs to a ${user.role.toUpperCase()} account. Please select "${user.role === 'advisor' ? 'Advisor' : 'Client'}" to sign in.`,
        },
        { status: 403 }
      );
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'ak_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
