import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';

const DEFAULT_PROFILE = {
  id: 'profile',
  name: 'Advisor',
  email: 'advisor@aksaarthi.com',
  phone: '',
  company: 'AK Investments & Financial Services',
  arnNumber: null as string | null,
  licenseNumber: null as string | null,
};

export async function GET() {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const profile =
      (await prisma.advisorProfile.findUnique({ where: { id: 'profile' } })) ??
      (await prisma.advisorProfile.create({ data: DEFAULT_PROFILE }));

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Failed to fetch advisor profile:', error);
    return NextResponse.json({ error: 'Failed to fetch advisor profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const body = await request.json();
    const { name, email, phone, company, arnNumber, licenseNumber } = body;

    const updated = await prisma.advisorProfile.upsert({
      where: { id: 'profile' },
      update: { name, email, phone, company, arnNumber, licenseNumber },
      create: { id: 'profile', name, email, phone, company, arnNumber, licenseNumber },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update advisor profile:', error);
    return NextResponse.json({ error: 'Failed to update advisor profile' }, { status: 500 });
  }
}
