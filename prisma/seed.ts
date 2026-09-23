import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

// Helper functions for dates (relative to today, since seed data is mock-relative)
function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().split('T')[0];
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function monthStr(monthsBack: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function main() {
  console.log('Clearing database...');
  await prisma.user.deleteMany({});
  await prisma.familyMember.deleteMany({});
  await prisma.policy.deleteMany({});
  await prisma.investment.deleteMany({});
  await prisma.commission.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.clientDocument.deleteMany({});
  await prisma.advisorProfile.deleteMany({});
  await prisma.client.deleteMany({});

  console.log('Seeding advisor profile and user...');
  const hashedPassword = await bcrypt.hash('password', 10);

  // Advisor User
  await prisma.user.create({
    data: {
      email: 'advisor@aksaarthi.com',
      password: hashedPassword,
      role: 'advisor',
    },
  });

  // Advisor Profile settings
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

  console.log('Seeding clients and client users...');
  // Clients Array
  const clientsData = [
    {
      id: 'client-001',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      dob: '1985-03-15',
      gender: 'male',
      phone: '9876543210',
      alternatePhone: '9876543211',
      email: 'rajesh.sharma@email.com',
      address: '42, MG Road, Sector 18',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      occupation: 'Software Engineer',
      employer: 'Infosys Ltd.',
      maritalStatus: 'married',
      pan: 'ABCDE1234F',
      aadhaar: '1234-5678-9012',
      annualIncome: 2400000,
      existingInsurance: 'LIC Term Plan, Star Health',
      existingInvestments: 'SBI Bluechip SIP, PPF',
      loans: 'Home Loan - ₹45L remaining',
      riskProfile: 'moderate',
      financialGoals: 'Child education, Retirement by 55',
      status: 'active',
      family: [
        { name: 'Priya Sharma', relation: 'spouse', dob: '1987-08-22', phone: '9876543212' },
        { name: 'Arjun Sharma', relation: 'child', dob: '2015-05-10', phone: '' },
        { name: 'Ananya Sharma', relation: 'child', dob: '2018-11-03', phone: '' },
      ],
    },
    {
      id: 'client-002',
      firstName: 'Priya',
      lastName: 'Patel',
      dob: '1990-07-20',
      gender: 'female',
      phone: '9988776655',
      alternatePhone: '',
      email: 'priya.patel@email.com',
      address: '15, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
      occupation: 'Doctor',
      employer: 'Apollo Hospitals',
      maritalStatus: 'married',
      pan: 'FGHIJ5678K',
      aadhaar: '2345-6789-0123',
      annualIncome: 3600000,
      riskProfile: 'aggressive',
      financialGoals: 'Build wealth, early retirement',
      status: 'active',
      family: [
        { name: 'Vikram Patel', relation: 'spouse', dob: '1988-02-14', phone: '' },
        { name: 'Riya Patel', relation: 'child', dob: '2020-01-25', phone: '' },
      ],
    },
    {
      id: 'client-003',
      firstName: 'Amit',
      lastName: 'Verma',
      dob: '1975-11-08',
      gender: 'male',
      phone: '9112233445',
      alternatePhone: '',
      email: 'amit.verma@email.com',
      address: '78, Koramangala 4th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      occupation: 'Business Owner',
      employer: 'Verma Enterprises',
      maritalStatus: 'married',
      pan: 'KLMNO9012P',
      aadhaar: '',
      annualIncome: 8500000,
      existingInsurance: 'HDFC Life, Max Bupa Health',
      existingInvestments: 'PPF, FD, Stocks',
      riskProfile: 'moderate',
      financialGoals: 'Retirement planning, wealth preservation',
      status: 'active',
      family: [
        { name: 'Sunita Verma', relation: 'spouse', dob: '1978-04-30', phone: '' },
        { name: 'Rohan Verma', relation: 'child', dob: '2005-09-18', phone: '' },
      ],
    },
    {
      id: 'client-004',
      firstName: 'Sneha',
      lastName: 'Gupta',
      dob: '1995-02-28',
      gender: 'female',
      phone: '9556677889',
      alternatePhone: '',
      email: 'sneha.gupta@email.com',
      address: '23, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      occupation: 'Marketing Manager',
      employer: 'Ogilvy India',
      maritalStatus: 'single',
      pan: 'PQRST3456U',
      aadhaar: '',
      annualIncome: 1800000,
      riskProfile: 'aggressive',
      financialGoals: 'Wealth creation, travel fund',
      status: 'active',
      family: [
        { name: 'Ramesh Gupta', relation: 'parent', phone: '9556677880', dob: '' },
        { name: 'Meena Gupta', relation: 'parent', phone: '9556677881', dob: '' },
      ],
    },
    {
      id: 'client-005',
      firstName: 'Deepak',
      lastName: 'Singh',
      dob: '1968-06-12',
      gender: 'male',
      phone: '9223344556',
      alternatePhone: '',
      email: 'deepak.singh@email.com',
      address: '56, Civil Lines',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302006',
      occupation: 'Retired Government Officer',
      maritalStatus: 'married',
      pan: '',
      aadhaar: '',
      annualIncome: 1200000,
      existingInsurance: 'LIC Endowment, CGHS Health',
      existingInvestments: 'Senior Citizen FD, PPF, Pension',
      riskProfile: 'conservative',
      financialGoals: 'Capital preservation, monthly income',
      status: 'active',
      family: [
        { name: 'Kavita Singh', relation: 'spouse', dob: '1972-09-05', phone: '' },
        { name: 'Neha Singh', relation: 'child', dob: '1998-03-22', phone: '' },
      ],
    },
  ];

  for (const c of clientsData) {
    // Create the Client db record
    const client = await prisma.client.create({
      data: {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        dob: c.dob,
        gender: c.gender,
        phone: c.phone,
        alternatePhone: c.alternatePhone || null,
        email: c.email,
        address: c.address,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
        occupation: c.occupation,
        employer: c.employer || null,
        maritalStatus: c.maritalStatus,
        annualIncome: c.annualIncome,
        existingInsurance: c.existingInsurance || null,
        existingInvestments: c.existingInvestments || null,
        loans: c.loans || null,
        riskProfile: c.riskProfile,
        financialGoals: c.financialGoals || null,
        status: c.status,
      },
    });

    // Create the corresponding User record for client portal login
    await prisma.user.create({
      data: {
        email: c.email,
        password: hashedPassword,
        role: 'client',
        clientId: client.id,
      },
    });

    // Create Family Members
    for (const fam of c.family) {
      await prisma.familyMember.create({
        data: {
          clientId: client.id,
          name: fam.name,
          relation: fam.relation,
          dob: fam.dob || null,
          phone: fam.phone || null,
        },
      });
    }
  }

  console.log('Seeding policies...');
  const policiesData = [
    {
      id: 'pol-001', clientId: 'client-001', company: 'LIC', policyNumber: 'LIC-2023-98765',
      type: 'term', premium: 18000, premiumFrequency: 'yearly', dueDate: daysFromNow(15),
      startDate: monthsAgo(24), sumAssured: 10000000, nominee: 'Priya Sharma',
      status: 'active', renewalStatus: 'due',
    },
    {
      id: 'pol-002', clientId: 'client-001', company: 'Star Health', policyNumber: 'SH-2024-45678',
      type: 'health', premium: 24000, premiumFrequency: 'yearly', dueDate: daysFromNow(45),
      startDate: monthsAgo(12), sumAssured: 1000000, nominee: 'Rajesh Sharma',
      status: 'active', renewalStatus: 'not_due',
    },
    {
      id: 'pol-003', clientId: 'client-002', company: 'HDFC Life', policyNumber: 'HDFC-2023-11223',
      type: 'life', premium: 50000, premiumFrequency: 'yearly', dueDate: daysFromNow(90),
      startDate: monthsAgo(18), sumAssured: 20000000, nominee: 'Vikram Patel',
      status: 'active', renewalStatus: 'not_due',
    },
    {
      id: 'pol-004', clientId: 'client-002', company: 'ICICI Lombard', policyNumber: 'ICICI-2024-33445',
      type: 'motor', premium: 8500, premiumFrequency: 'yearly', dueDate: daysFromNow(5),
      startDate: monthsAgo(11), sumAssured: 800000, nominee: 'Priya Patel',
      status: 'active', renewalStatus: 'due',
    },
    {
      id: 'pol-005', clientId: 'client-003', company: 'HDFC Life', policyNumber: 'HDFC-2020-55667',
      type: 'ulip', premium: 100000, premiumFrequency: 'yearly', dueDate: daysFromNow(120),
      startDate: monthsAgo(48), sumAssured: 5000000, nominee: 'Sunita Verma',
      status: 'active', renewalStatus: 'not_due',
    },
    {
      id: 'pol-006', clientId: 'client-003', company: 'Max Bupa', policyNumber: 'MB-2023-77889',
      type: 'health', premium: 35000, premiumFrequency: 'yearly', dueDate: daysFromNow(30),
      startDate: monthsAgo(15), sumAssured: 2000000, nominee: 'Amit Verma',
      status: 'active', renewalStatus: 'due',
    },
    {
      id: 'pol-007', clientId: 'client-005', company: 'LIC', policyNumber: 'LIC-2015-12345',
      type: 'life', premium: 45000, premiumFrequency: 'yearly', dueDate: daysFromNow(-10),
      startDate: monthsAgo(96), sumAssured: 2500000, nominee: 'Kavita Singh',
      status: 'active', renewalStatus: 'due',
    },
    {
      id: 'pol-008', clientId: 'client-004', company: 'ICICI Prudential', policyNumber: 'ICICI-2024-99001',
      type: 'term', premium: 12000, premiumFrequency: 'yearly', dueDate: daysFromNow(180),
      startDate: monthsAgo(3), sumAssured: 7500000, nominee: 'Ramesh Gupta',
      status: 'active', renewalStatus: 'not_due',
    },
    {
      id: 'pol-009', clientId: 'client-001', company: 'Bajaj Allianz', policyNumber: 'BA-2024-22334',
      type: 'motor', premium: 6500, premiumFrequency: 'yearly', dueDate: daysFromNow(60),
      startDate: monthsAgo(6), sumAssured: 600000, nominee: 'Rajesh Sharma',
      status: 'active', renewalStatus: 'not_due',
    },
    {
      id: 'pol-010', clientId: 'client-005', company: 'TATA AIA', policyNumber: 'TATA-2018-44556',
      type: 'life', premium: 30000, premiumFrequency: 'yearly', dueDate: daysFromNow(-30),
      startDate: monthsAgo(72), sumAssured: 1500000, nominee: 'Kavita Singh',
      status: 'lapsed', renewalStatus: 'due',
    },
  ];

  for (const pol of policiesData) {
    await prisma.policy.create({
      data: pol,
    });
  }

  console.log('Seeding investments...');
  const investmentsData = [
    {
      id: 'inv-001', clientId: 'client-001', type: 'sip', schemeName: 'SBI Bluechip Fund',
      fundHouse: 'SBI Mutual Fund', investedAmount: 360000, currentValue: 425000, returns: 18.1,
      sipAmount: 10000, sipDate: 5, startDate: monthsAgo(36), status: 'active',
    },
    {
      id: 'inv-002', clientId: 'client-001', type: 'ppf', schemeName: 'Public Provident Fund',
      investedAmount: 750000, currentValue: 890000, returns: 7.1,
      startDate: monthsAgo(60), maturityDate: daysFromNow(1825), status: 'active',
    },
    {
      id: 'inv-003', clientId: 'client-002', type: 'mutual_fund', schemeName: 'Axis Midcap Fund',
      fundHouse: 'Axis Mutual Fund', investedAmount: 500000, currentValue: 620000, returns: 24.0,
      startDate: monthsAgo(18), status: 'active',
    },
    {
      id: 'inv-004', clientId: 'client-002', type: 'sip', schemeName: 'Mirae Asset Large Cap',
      fundHouse: 'Mirae Asset', investedAmount: 240000, currentValue: 275000, returns: 14.6,
      sipAmount: 20000, sipDate: 10, startDate: monthsAgo(12), status: 'active',
    },
    {
      id: 'inv-005', clientId: 'client-002', type: 'stock', schemeName: 'Reliance Industries',
      investedAmount: 300000, currentValue: 385000, returns: 28.3,
      startDate: monthsAgo(24), status: 'active',
    },
    {
      id: 'inv-006', clientId: 'client-003', type: 'fd', schemeName: 'HDFC Bank FD',
      fundHouse: 'HDFC Bank', investedAmount: 2000000, currentValue: 2156000, returns: 7.8,
      startDate: monthsAgo(12), maturityDate: daysFromNow(365), status: 'active',
    },
    {
      id: 'inv-007', clientId: 'client-003', type: 'mutual_fund', schemeName: 'ICICI Prudential Balanced Advantage',
      fundHouse: 'ICICI Prudential', investedAmount: 1000000, currentValue: 1120000, returns: 12.0,
      startDate: monthsAgo(9), status: 'active',
    },
    {
      id: 'inv-008', clientId: 'client-004', type: 'sip', schemeName: 'Parag Parikh Flexi Cap',
      fundHouse: 'PPFAS', investedAmount: 90000, currentValue: 102000, returns: 13.3,
      sipAmount: 15000, sipDate: 1, startDate: monthsAgo(6), status: 'active',
    },
    {
      id: 'inv-009', clientId: 'client-005', type: 'fd', schemeName: 'SBI Senior Citizen FD',
      fundHouse: 'SBI', investedAmount: 3000000, currentValue: 3240000, returns: 8.0,
      startDate: monthsAgo(12), maturityDate: daysFromNow(730), status: 'active',
    },
    {
      id: 'inv-010', clientId: 'client-005', type: 'nps', schemeName: 'NPS Tier 1 - Govt Scheme',
      investedAmount: 1500000, currentValue: 1780000, returns: 9.3,
      startDate: monthsAgo(120), maturityDate: daysFromNow(365), status: 'active',
    },
    {
      id: 'inv-011', clientId: 'client-001', type: 'gold', schemeName: 'Sovereign Gold Bond 2024',
      investedAmount: 200000, currentValue: 228000, returns: 14.0,
      startDate: monthsAgo(6), maturityDate: daysFromNow(2555), status: 'active',
    },
  ];

  for (const inv of investmentsData) {
    await prisma.investment.create({
      data: inv,
    });
  }

  console.log('Seeding commissions...');
  const commissionsData = [
    { id: 'com-001', clientId: 'client-001', policyId: 'pol-001', company: 'LIC', type: 'renewal', amount: 3600, month: monthStr(0), status: 'pending', paidDate: null },
    { id: 'com-002', clientId: 'client-002', policyId: 'pol-003', company: 'HDFC Life', type: 'first_year', amount: 15000, month: monthStr(0), status: 'paid', paidDate: monthsAgo(0) },
    { id: 'com-003', clientId: 'client-003', policyId: 'pol-006', company: 'Max Bupa', type: 'renewal', amount: 5250, month: monthStr(0), status: 'pending', paidDate: null },
    { id: 'com-004', clientId: 'client-001', policyId: 'pol-002', company: 'Star Health', type: 'renewal', amount: 4800, month: monthStr(1), status: 'paid', paidDate: monthsAgo(1) },
    { id: 'com-005', clientId: 'client-002', policyId: 'pol-004', company: 'ICICI Lombard', type: 'first_year', amount: 2125, month: monthStr(1), status: 'paid', paidDate: monthsAgo(1) },
    { id: 'com-006', clientId: 'client-003', policyId: 'pol-005', company: 'HDFC Life', type: 'renewal', amount: 10000, month: monthStr(2), status: 'paid', paidDate: monthsAgo(2) },
    { id: 'com-007', clientId: 'client-005', policyId: 'pol-007', company: 'LIC', type: 'renewal', amount: 9000, month: monthStr(2), status: 'paid', paidDate: monthsAgo(2) },
    { id: 'com-008', clientId: 'client-004', policyId: 'pol-008', company: 'ICICI Prudential', type: 'first_year', amount: 3600, month: monthStr(3), status: 'paid', paidDate: monthsAgo(3) },
    { id: 'com-009', clientId: 'client-001', policyId: null, company: 'SBI MF', type: 'trail', amount: 1200, month: monthStr(1), status: 'paid', paidDate: monthsAgo(1) },
    { id: 'com-010', clientId: 'client-002', policyId: null, company: 'Axis MF', type: 'trail', amount: 1800, month: monthStr(0), status: 'pending', paidDate: null },
  ];

  for (const com of commissionsData) {
    await prisma.commission.create({
      data: com,
    });
  }

  console.log('Seeding appointments...');
  const appointmentsData = [
    {
      id: 'apt-001', clientId: 'client-001', clientName: 'Rajesh Sharma',
      title: 'Policy Review Meeting', type: 'review',
      date: today(), time: '10:00', duration: 60,
      location: 'Office', notes: 'Review term plan and health insurance renewal',
      status: 'scheduled',
    },
    {
      id: 'apt-002', clientId: 'client-004', clientName: 'Sneha Gupta',
      title: 'Initial Consultation', type: 'meeting',
      date: today(), time: '14:00', duration: 45,
      location: 'Zoom Call', notes: 'Discuss insurance needs and investment goals',
      status: 'scheduled',
    },
    {
      id: 'apt-003', clientId: 'client-002', clientName: 'Priya Patel',
      title: 'Motor Insurance Renewal Follow-up', type: 'follow_up',
      date: daysFromNow(2), time: '11:00', duration: 30,
      location: '', notes: 'ICICI Lombard motor policy expiring in 5 days',
      status: 'scheduled',
    },
    {
      id: 'apt-004', clientId: 'client-003', clientName: 'Amit Verma',
      title: 'Quarterly Portfolio Review', type: 'review',
      date: daysFromNow(5), time: '15:00', duration: 60,
      location: 'Client Office', notes: 'Review ULIP performance and FD maturity',
      status: 'scheduled',
    },
    {
      id: 'apt-005', clientId: 'client-005', clientName: 'Deepak Singh',
      title: 'Pension Planning Call', type: 'call',
      date: daysFromNow(7), time: '16:00', duration: 30,
      location: '', notes: 'Discuss NPS maturity options and annuity plans',
      status: 'scheduled',
    },
  ];

  for (const apt of appointmentsData) {
    await prisma.appointment.create({
      data: apt,
    });
  }

  console.log('Seeding tasks...');
  const tasksData = [
    { id: 'task-001', title: 'Renew LIC Term Plan for Rajesh', clientId: 'client-001', clientName: 'Rajesh Sharma', priority: 'high', status: 'todo', dueDate: daysFromNow(15), description: '' },
    { id: 'task-002', title: 'Process ICICI motor renewal for Priya', clientId: 'client-002', clientName: 'Priya Patel', priority: 'high', status: 'in_progress', dueDate: daysFromNow(5), description: '' },
    { id: 'task-003', title: 'Prepare portfolio report for Amit', clientId: 'client-003', clientName: 'Amit Verma', priority: 'medium', status: 'todo', dueDate: daysFromNow(5), description: '' },
    { id: 'task-004', title: 'Set up term + health insurance for Sneha', clientId: 'client-004', clientName: 'Sneha Gupta', priority: 'medium', status: 'todo', dueDate: daysFromNow(10), description: '' },
    { id: 'task-005', title: 'Follow up on lapsed TATA AIA policy', clientId: 'client-005', clientName: 'Deepak Singh', priority: 'high', status: 'todo', dueDate: daysFromNow(3), description: '' },
    { id: 'task-006', title: 'Send birthday wishes to Priya (Jul 20)', clientId: 'client-002', clientName: 'Priya Patel', priority: 'low', status: 'todo', dueDate: daysFromNow(11), description: '' },
    { id: 'task-007', title: 'Collect KYC documents from Sneha', clientId: 'client-004', clientName: 'Sneha Gupta', priority: 'medium', status: 'in_progress', dueDate: daysFromNow(7), description: '' },
  ];

  for (const t of tasksData) {
    await prisma.task.create({
      data: t,
    });
  }

  // Documents are not seeded — they should be uploaded by the user via the app.
  console.log('Skipping document seeding (documents should be uploaded via the app).');


  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
