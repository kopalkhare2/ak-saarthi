import { prisma } from './prisma';
import * as bcrypt from 'bcryptjs';

/**
 * Auto-initializes the database and ensures default Advisor and Client accounts exist.
 */
export async function ensureSeeded() {
  try {
    const hashedPassword = await bcrypt.hash('password', 10);

    // 1. Ensure Primary Advisor Account
    const primaryAdvisor = await prisma.user.findFirst({ where: { email: 'advisor@aksaarthi.com' } });
    if (!primaryAdvisor) {
      await prisma.user.create({
        data: {
          email: 'advisor@aksaarthi.com',
          password: hashedPassword,
          role: 'advisor',
        },
      });
    }

    // 2. Ensure Advisor Profile
    const profile = await prisma.advisorProfile.findUnique({ where: { id: 'profile' } });
    if (!profile) {
      await prisma.advisorProfile.create({
        data: {
          id: 'profile',
          name: 'AK Investments & Financial Services',
          email: 'advisor@aksaarthi.com',
          phone: '9876543210',
          company: 'AK Financial Solutions',
          arnNumber: 'ARN-123456',
          licenseNumber: 'LIC-789012',
        },
      });
    }

    // 4. Sample Clients
    const sampleClients = [
      {
        id: 'client-001',
        firstName: 'Rajesh',
        lastName: 'Sharma',
        email: 'rajesh.sharma@email.com',
        dob: '1985-03-15',
        gender: 'male',
        phone: '9876543210',
        address: '42, MG Road, Sector 18',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        occupation: 'Software Engineer',
        maritalStatus: 'married',
        annualIncome: 2400000,
        riskProfile: 'moderate',
        status: 'active',
      },
      {
        id: 'client-002',
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya.patel@email.com',
        dob: '1990-07-20',
        gender: 'female',
        phone: '9988776655',
        address: '15, Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500033',
        occupation: 'Doctor',
        maritalStatus: 'married',
        annualIncome: 3600000,
        riskProfile: 'aggressive',
        status: 'active',
      },
      {
        id: 'client-003',
        firstName: 'Sneha',
        lastName: 'Gupta',
        email: 'sneha.gupta@email.com',
        dob: '1995-11-05',
        gender: 'female',
        phone: '9711223344',
        address: '88, Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
        occupation: 'Product Manager',
        maritalStatus: 'single',
        annualIncome: 1800000,
        riskProfile: 'aggressive',
        status: 'active',
      },
      {
        id: 'client-004',
        firstName: 'Vikram',
        lastName: 'Verma',
        email: 'vikram.verma@email.com',
        dob: '1978-01-30',
        gender: 'male',
        phone: '9811223344',
        address: '102, Civil Lines',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302006',
        occupation: 'Business Owner',
        maritalStatus: 'married',
        annualIncome: 5000000,
        riskProfile: 'conservative',
        status: 'active',
      },
      {
        id: 'client-005',
        firstName: 'Ananya',
        lastName: 'Deshmukh',
        email: 'ananya.deshmukh@email.com',
        dob: '1992-09-12',
        gender: 'female',
        phone: '9655443322',
        address: '55, FC Road, Shivaji Nagar',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411005',
        occupation: 'Architect',
        maritalStatus: 'single',
        annualIncome: 1500000,
        riskProfile: 'moderate',
        status: 'active',
      },
    ];

    for (const cData of sampleClients) {
      let client = await prisma.client.findFirst({ where: { email: cData.email } });
      if (!client) {
        client = await prisma.client.create({ data: cData });
      }

      const clientUser = await prisma.user.findFirst({ where: { email: cData.email } });
      if (!clientUser) {
        await prisma.user.create({
          data: {
            email: cData.email,
            password: hashedPassword,
            role: 'client',
            clientId: client.id,
          },
        });
      }
    }
  } catch (error) {
    console.error('Failed to auto-seed database:', error);
  }
}
