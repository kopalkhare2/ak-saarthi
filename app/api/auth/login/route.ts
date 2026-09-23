import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/auth';
import { ensureSeeded } from '@/lib/init-db';

export async function POST(request: Request) {
  try {
    // Ensure default demo accounts exist if the DB is fresh
    await ensureSeeded();

    const { email: rawEmail, password, role: requestedRole } = await request.json();

    if (!rawEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const email = rawEmail.toLowerCase().trim();

    let user = await prisma.user.findFirst({
      where: { email: { equals: email } },
    });

    // Auto-provision a Client User account if a Client profile already exists
    // (e.g. one created by an advisor) but no login has been set up for it yet.
    if (!user) {
      const clientRecord = await prisma.client.findFirst({
        where: { email: { equals: email }, isDeleted: false },
      });
      if (clientRecord) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await prisma.user.create({
          data: {
            email: clientRecord.email.toLowerCase().trim(),
            password: hashedPassword,
            role: 'client',
            clientId: clientRecord.id,
          },
        });
      }
    }

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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // A soft-deleted client's login should stop working immediately, even
    // though their historical data is preserved for the advisor.
    if (user.role === 'client' && user.clientId) {
      const client = await prisma.client.findUnique({ where: { id: user.clientId } });
      if (!client || client.isDeleted) {
        return NextResponse.json(
          { error: 'This account is no longer active. Please contact your advisor.' },
          { status: 403 }
        );
      }
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
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
