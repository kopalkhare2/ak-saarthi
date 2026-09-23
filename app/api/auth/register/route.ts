import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { getJwtSecret } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      firstName, lastName, email, password, phone, dob, gender,
      address, city, state, pincode, occupation, maritalStatus,
      annualIncome, riskProfile,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'First name, last name, email, password, and phone are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists (in User or Client table)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    const existingClient = await prisma.client.findUnique({ where: { email } });
    if (existingClient) {
      return NextResponse.json(
        { error: 'A client profile with this email already exists. Please contact your advisor.' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the Client record
    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        dob: dob || '',
        gender: gender || '',
        address: address || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        occupation: occupation || '',
        maritalStatus: maritalStatus || '',
        annualIncome: annualIncome ? Number(annualIncome) : 0,
        riskProfile: riskProfile || 'moderate',
        status: 'active',
      },
    });

    // Create the User record linked to the Client
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'client',
        clientId: client.id,
      },
    });

    // Generate JWT and auto-login
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

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'ak_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
