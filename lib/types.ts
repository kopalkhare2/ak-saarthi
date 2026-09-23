// ─── Enums ──────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'other';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

export type PolicyType =
  | 'life'
  | 'health'
  | 'motor'
  | 'term'
  | 'ulip'
  | 'travel'
  | 'home';

export type PolicyStatus = 'active' | 'lapsed' | 'pending' | 'claim' | 'expired';

export type InvestmentType =
  | 'mutual_fund'
  | 'sip'
  | 'stock'
  | 'etf'
  | 'bond'
  | 'gold'
  | 'nps'
  | 'fd'
  | 'ppf';

export type InvestmentStatus = 'active' | 'matured' | 'withdrawn' | 'paused';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type AppointmentType = 'meeting' | 'follow_up' | 'call' | 'review';

export type DocumentType = 'pan' | 'aadhaar' | 'policy' | 'kyc' | 'income_proof' | 'passport' | 'driving_license' | 'other';

// ─── Client ─────────────────────────────────────────────

export interface FamilyMember {
  name: string;
  relation: 'spouse' | 'child' | 'parent' | 'nominee' | 'other';
  dob?: string;
  phone?: string;
}

export interface Client {
  id: string;
  // Personal
  firstName: string;
  lastName: string;
  dob: string;
  gender: Gender;
  phone: string;
  alternatePhone?: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  occupation: string;
  employer?: string;
  maritalStatus: MaritalStatus;

  // Identity
  pan?: string;
  aadhaar?: string;
  passport?: string;
  drivingLicense?: string;

  // Family
  family: FamilyMember[];

  // Financial
  annualIncome: number;
  existingInsurance?: string;
  existingInvestments?: string;
  loans?: string;
  riskProfile: RiskProfile;
  financialGoals?: string;

  // Meta
  notes: Note[];
  status: 'active' | 'inactive';
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Policy ─────────────────────────────────────────────

export interface Policy {
  id: string;
  clientId: string;
  company: string;
  policyNumber: string;
  type: PolicyType;
  premium: number;
  premiumFrequency: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  dueDate: string;
  startDate: string;
  endDate?: string;
  sumAssured: number;
  nominee: string;
  status: PolicyStatus;
  claimStatus?: string;
  renewalStatus?: 'due' | 'renewed' | 'not_due';
  createdAt: string;
}

// ─── Investment ─────────────────────────────────────────

export interface Investment {
  id: string;
  clientId: string;
  type: InvestmentType;
  schemeName: string;
  fundHouse?: string;
  investedAmount: number;
  currentValue: number;
  returns: number; // percentage
  sipAmount?: number;
  sipDate?: number; // day of month
  startDate: string;
  maturityDate?: string;
  status: InvestmentStatus;
  createdAt: string;
}

// ─── Commission ─────────────────────────────────────────

export interface Commission {
  id: string;
  policyId?: string;
  clientId: string;
  company: string;
  type: 'first_year' | 'renewal' | 'trail';
  amount: number;
  month: string; // YYYY-MM
  status: 'paid' | 'pending';
  paidDate?: string;
  createdAt: string;
}

// ─── Appointment ────────────────────────────────────────

export interface Appointment {
  id: string;
  clientId?: string;
  clientName?: string;
  title: string;
  type: AppointmentType;
  date: string;
  time: string;
  duration: number; // minutes
  location?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

// ─── Task ───────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
}

// ─── Note ───────────────────────────────────────────────

export interface Note {
  id: string;
  content: string;
  createdAt: string;
}

// ─── Document ───────────────────────────────────────────

export interface ClientDocument {
  id: string;
  clientId: string;
  clientName: string;
  type: DocumentType;
  name: string;
  fileName: string;
  filePath?: string | null;
  mimeType?: string | null;
  size?: number;
  isDeleted?: boolean;
  deletedAt?: string | null;
  uploadedAt: string;
}

// ─── Advisor ────────────────────────────────────────────

export interface AdvisorProfile {
  name: string;
  email: string;
  phone: string;
  company: string;
  arnNumber?: string;
  licenseNumber?: string;
}
