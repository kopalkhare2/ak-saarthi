-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dob" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "occupation" TEXT NOT NULL,
    "employer" TEXT,
    "maritalStatus" TEXT NOT NULL,
    "annualIncome" REAL NOT NULL,
    "existingInsurance" TEXT,
    "existingInvestments" TEXT,
    "loans" TEXT,
    "riskProfile" TEXT NOT NULL,
    "financialGoals" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Client" ("address", "alternatePhone", "annualIncome", "city", "createdAt", "dob", "email", "employer", "existingInsurance", "existingInvestments", "financialGoals", "firstName", "gender", "id", "lastName", "loans", "maritalStatus", "occupation", "phone", "pincode", "riskProfile", "state", "status", "updatedAt") SELECT "address", "alternatePhone", "annualIncome", "city", "createdAt", "dob", "email", "employer", "existingInsurance", "existingInvestments", "financialGoals", "firstName", "gender", "id", "lastName", "loans", "maritalStatus", "occupation", "phone", "pincode", "riskProfile", "state", "status", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");
CREATE TABLE "new_ClientDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ClientDocument" ("clientId", "clientName", "fileName", "id", "name", "size", "type", "uploadedAt") SELECT "clientId", "clientName", "fileName", "id", "name", "size", "type", "uploadedAt" FROM "ClientDocument";
DROP TABLE "ClientDocument";
ALTER TABLE "new_ClientDocument" RENAME TO "ClientDocument";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
