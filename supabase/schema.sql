-- ============================================================
-- AK Saarthi AI — Supabase PostgreSQL Schema
-- Generated from prisma/schema.prisma
--
-- INSTRUCTIONS:
--   1. Open your Supabase project
--   2. Go to SQL Editor
--   3. Paste this entire file and click "Run"
--
-- This script is idempotent — safe to run on an empty database.
-- Do NOT run this on a database that already has data.
-- ============================================================

-- ─── Extensions ────────────────────────────────────────────
-- gen_random_uuid() is available by default in Supabase PostgreSQL 14+
-- Enable pgcrypto just in case for older instances
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Helper: auto-update updated_at ─────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: User
-- ============================================================
CREATE TABLE IF NOT EXISTS "User" (
  "id"         TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "email"      TEXT        NOT NULL,
  "password"   TEXT        NOT NULL,
  "role"       TEXT        NOT NULL,           -- 'advisor' | 'client'
  "clientId"   TEXT,                           -- FK to Client.id (set if role = 'client')
  "firstName"  TEXT,
  "lastName"   TEXT,
  "phone"      TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "User_email_key" UNIQUE ("email")
);

CREATE TRIGGER "User_updatedAt"
  BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: Client
-- ============================================================
CREATE TABLE IF NOT EXISTS "Client" (
  "id"                  TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "advisorId"           TEXT,                               -- FK to User.id
  "firstName"           TEXT        NOT NULL,
  "lastName"            TEXT        NOT NULL,
  "dob"                 TEXT        NOT NULL,
  "gender"              TEXT        NOT NULL,
  "phone"               TEXT        NOT NULL,
  "alternatePhone"      TEXT,
  "email"               TEXT        NOT NULL,
  "address"             TEXT        NOT NULL,
  "city"                TEXT        NOT NULL,
  "state"               TEXT        NOT NULL,
  "pincode"             TEXT        NOT NULL,
  "occupation"          TEXT        NOT NULL,
  "employer"            TEXT,
  "maritalStatus"       TEXT        NOT NULL,
  "annualIncome"        DOUBLE PRECISION NOT NULL,
  "existingInsurance"   TEXT,
  "existingInvestments" TEXT,
  "loans"               TEXT,
  "riskProfile"         TEXT        NOT NULL,
  "financialGoals"      TEXT,
  "status"              TEXT        NOT NULL DEFAULT 'active',  -- 'active' | 'inactive'
  "isDeleted"           BOOLEAN     NOT NULL DEFAULT FALSE,
  "deletedAt"           TIMESTAMPTZ,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "Client_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Client_email_key" UNIQUE ("email"),
  CONSTRAINT "Client_advisorId_fkey" FOREIGN KEY ("advisorId")
    REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TRIGGER "Client_updatedAt"
  BEFORE UPDATE ON "Client"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS "Client_advisorId_idx" ON "Client"("advisorId");

-- ============================================================
-- TABLE: Note
-- ============================================================
CREATE TABLE IF NOT EXISTS "Note" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "clientId"  TEXT        NOT NULL,
  "content"   TEXT        NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "Note_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Note_clientId_fkey" FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Note_clientId_idx" ON "Note"("clientId");

-- ============================================================
-- TABLE: FamilyMember
-- ============================================================
CREATE TABLE IF NOT EXISTS "FamilyMember" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "clientId"  TEXT        NOT NULL,
  "name"      TEXT        NOT NULL,
  "relation"  TEXT        NOT NULL,   -- 'spouse' | 'child' | 'parent' | 'nominee' | 'other'
  "dob"       TEXT,
  "phone"     TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FamilyMember_clientId_fkey" FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TRIGGER "FamilyMember_updatedAt"
  BEFORE UPDATE ON "FamilyMember"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS "FamilyMember_clientId_idx" ON "FamilyMember"("clientId");

-- ============================================================
-- TABLE: Policy
-- ============================================================
CREATE TABLE IF NOT EXISTS "Policy" (
  "id"               TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "clientId"         TEXT             NOT NULL,
  "company"          TEXT             NOT NULL,
  "policyNumber"     TEXT             NOT NULL,
  "type"             TEXT             NOT NULL,  -- 'life' | 'health' | 'motor' | 'term' | 'ulip' | 'travel' | 'home'
  "premium"          DOUBLE PRECISION NOT NULL,
  "premiumFrequency" TEXT             NOT NULL,  -- 'monthly' | 'quarterly' | 'half_yearly' | 'yearly'
  "dueDate"          TEXT             NOT NULL,
  "startDate"        TEXT             NOT NULL,
  "endDate"          TEXT,
  "sumAssured"       DOUBLE PRECISION NOT NULL,
  "nominee"          TEXT             NOT NULL,
  "status"           TEXT             NOT NULL,  -- 'active' | 'lapsed' | 'pending' | 'claim' | 'expired'
  "claimStatus"      TEXT,
  "renewalStatus"    TEXT             NOT NULL DEFAULT 'not_due',  -- 'due' | 'renewed' | 'not_due'
  "createdAt"        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT "Policy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Policy_policyNumber_key" UNIQUE ("policyNumber"),
  CONSTRAINT "Policy_clientId_fkey" FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TRIGGER "Policy_updatedAt"
  BEFORE UPDATE ON "Policy"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS "Policy_clientId_idx" ON "Policy"("clientId");

-- ============================================================
-- TABLE: Investment
-- ============================================================
CREATE TABLE IF NOT EXISTS "Investment" (
  "id"             TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "clientId"       TEXT             NOT NULL,
  "type"           TEXT             NOT NULL,   -- 'mutual_fund' | 'sip' | 'stock' | 'etf' | 'bond' | 'gold' | 'nps' | 'fd' | 'ppf'
  "schemeName"     TEXT             NOT NULL,
  "fundHouse"      TEXT,
  "investedAmount" DOUBLE PRECISION NOT NULL,
  "currentValue"   DOUBLE PRECISION NOT NULL,
  "returns"        DOUBLE PRECISION NOT NULL,   -- percentage
  "sipAmount"      DOUBLE PRECISION,
  "sipDate"        INTEGER,                     -- day of month
  "startDate"      TEXT             NOT NULL,
  "maturityDate"   TEXT,
  "status"         TEXT             NOT NULL,   -- 'active' | 'matured' | 'withdrawn' | 'paused'
  "createdAt"      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT "Investment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Investment_clientId_fkey" FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TRIGGER "Investment_updatedAt"
  BEFORE UPDATE ON "Investment"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS "Investment_clientId_idx" ON "Investment"("clientId");

-- ============================================================
-- TABLE: Commission
-- ============================================================
CREATE TABLE IF NOT EXISTS "Commission" (
  "id"        TEXT             NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "clientId"  TEXT             NOT NULL,
  "policyId"  TEXT,
  "company"   TEXT             NOT NULL,
  "type"      TEXT             NOT NULL,   -- 'first_year' | 'renewal' | 'trail'
  "amount"    DOUBLE PRECISION NOT NULL,
  "month"     TEXT             NOT NULL,   -- YYYY-MM
  "status"    TEXT             NOT NULL,   -- 'paid' | 'pending'
  "paidDate"  TEXT,
  "createdAt" TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT "Commission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Commission_clientId_fkey" FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Commission_policyId_fkey" FOREIGN KEY ("policyId")
    REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TRIGGER "Commission_updatedAt"
  BEFORE UPDATE ON "Commission"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS "Commission_clientId_idx" ON "Commission"("clientId");
CREATE INDEX IF NOT EXISTS "Commission_policyId_idx" ON "Commission"("policyId");

-- ============================================================
-- TABLE: Appointment
-- ============================================================
CREATE TABLE IF NOT EXISTS "Appointment" (
  "id"         TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "advisorId"  TEXT,
  "clientId"   TEXT,
  "clientName" TEXT,
  "title"      TEXT        NOT NULL,
  "type"       TEXT        NOT NULL,   -- 'meeting' | 'follow_up' | 'call' | 'review'
  "date"       TEXT        NOT NULL,
  "time"       TEXT        NOT NULL,
  "duration"   INTEGER     NOT NULL,   -- minutes
  "location"   TEXT,
  "notes"      TEXT,
  "status"     TEXT        NOT NULL DEFAULT 'scheduled',  -- 'scheduled' | 'completed' | 'cancelled'
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TRIGGER "Appointment_updatedAt"
  BEFORE UPDATE ON "Appointment"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS "Appointment_clientId_idx" ON "Appointment"("clientId");
CREATE INDEX IF NOT EXISTS "Appointment_advisorId_idx" ON "Appointment"("advisorId");

-- ============================================================
-- TABLE: Task
-- ============================================================
CREATE TABLE IF NOT EXISTS "Task" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "advisorId"   TEXT,
  "clientId"    TEXT,
  "clientName"  TEXT,
  "title"       TEXT        NOT NULL,
  "description" TEXT,
  "priority"    TEXT        NOT NULL,   -- 'high' | 'medium' | 'low'
  "status"      TEXT        NOT NULL,   -- 'todo' | 'in_progress' | 'done'
  "dueDate"     TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "Task_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TRIGGER "Task_updatedAt"
  BEFORE UPDATE ON "Task"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS "Task_clientId_idx" ON "Task"("clientId");

-- ============================================================
-- TABLE: ClientDocument
-- ============================================================
CREATE TABLE IF NOT EXISTS "ClientDocument" (
  "id"         TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "clientId"   TEXT        NOT NULL,
  "clientName" TEXT        NOT NULL,
  "type"       TEXT        NOT NULL,   -- 'pan' | 'aadhaar' | 'policy' | 'kyc' | 'income_proof' | 'passport' | 'driving_license' | 'other'
  "name"       TEXT        NOT NULL,
  "fileName"   TEXT        NOT NULL,
  "filePath"   TEXT,
  "mimeType"   TEXT,
  "size"       INTEGER,
  "isDeleted"  BOOLEAN     NOT NULL DEFAULT FALSE,
  "deletedAt"  TIMESTAMPTZ,
  "uploadedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "ClientDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClientDocument_clientId_fkey" FOREIGN KEY ("clientId")
    REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ClientDocument_clientId_idx" ON "ClientDocument"("clientId");

-- ============================================================
-- TABLE: AdvisorProfile
-- ============================================================
CREATE TABLE IF NOT EXISTS "AdvisorProfile" (
  "id"            TEXT        NOT NULL DEFAULT 'profile',
  "name"          TEXT        NOT NULL,
  "email"         TEXT        NOT NULL,
  "phone"         TEXT        NOT NULL,
  "company"       TEXT        NOT NULL,
  "arnNumber"     TEXT,
  "licenseNumber" TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "AdvisorProfile_pkey" PRIMARY KEY ("id")
);

CREATE TRIGGER "AdvisorProfile_updatedAt"
  BEFORE UPDATE ON "AdvisorProfile"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: AdvisorAccessRequest
-- ============================================================
CREATE TABLE IF NOT EXISTS "AdvisorAccessRequest" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "name"      TEXT        NOT NULL,
  "email"     TEXT        NOT NULL,
  "phone"     TEXT        NOT NULL,
  "status"    TEXT        NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'declined'
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "AdvisorAccessRequest_pkey" PRIMARY KEY ("id")
);

CREATE TRIGGER "AdvisorAccessRequest_updatedAt"
  BEFORE UPDATE ON "AdvisorAccessRequest"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- This application uses its own backend JWT authentication.
-- All database access is through server-side API routes using
-- the Supabase service role / direct connection — NOT through
-- Supabase Auth or client-side Supabase SDK calls.
--
-- Therefore: RLS is deliberately DISABLED on all tables.
-- Enabling RLS with auth.uid() policies would block all
-- legitimate backend operations since auth.uid() would be NULL
-- for service-role connections.
--
-- The security model is:
--   - Backend API routes validate JWT cookies
--   - DATABASE_URL is server-side only (never exposed to client)
--   - No Supabase client SDK is used in frontend code
-- ============================================================

ALTER TABLE "User"                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Client"               DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Note"                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE "FamilyMember"         DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Policy"               DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Investment"           DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Commission"           DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment"          DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Task"                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientDocument"       DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AdvisorProfile"       DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AdvisorAccessRequest" DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- DONE
-- The schema is ready. Next steps:
--   1. Run: npx prisma generate
--   2. Run: npx prisma db push  (or prisma migrate deploy)
--   3. Run: npx prisma db seed  (to populate demo data)
-- ============================================================
