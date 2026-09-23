# Walkthrough - Completion of Phases 3-6: Backend & Automation

We have completed the backend integration, real AI assistant, automated reminders, and print layout exports for **AK Saarthi AI**. The application has successfully compiled into an optimized production build.

---

## What We Built

### 1. SQLite Database & Prisma ORM (Phase 3)
*   **Schema Definition**: Configured `prisma/schema.prisma` with models for `User`, `Client`, `FamilyMember`, `Policy`, `Investment`, `Commission`, `Appointment`, `Task`, `ClientDocument`, and `AdvisorProfile`.
*   **Mandatory Driver Adapter**: Installed and configured `better-sqlite3` and `@prisma/adapter-better-sqlite3` for compatibility with Prisma v7.
*   **Database Seeding**: Created `prisma/seed.ts` containing the complete original mock dataset. It seeds:
    *   **Advisor Account**: `advisor@aksaarthi.com` (password: `password`)
    *   **5 Client Accounts**: (e.g., `rajesh.sharma@email.com`, `priya.patel@email.com` — all with password: `password`)
    *   10 policies, 11 investments, commissions, documents, tasks, and calendar appointments.

### 2. REST API & Cookie-Based JWT Auth (Phase 3)
*   **Auth Routes**:
    *   `/api/auth/login` (signs JWT, sets secure HTTP-only cookie `ak_token`).
    *   `/api/auth/logout` (clears cookie).
    *   `/api/auth/me` (verifies token, checks session).
*   **CRM CRUD Routes**: Implemented full CRUD endpoints for `/api/clients`, `/api/policies`, `/api/investments`, `/api/commissions`, `/api/appointments`, `/api/tasks`, and `/api/documents`.

### 3. Route Guard Middleware (Phase 3)
*   Implemented `proxy.ts` (Next.js 16 Edge-compatible proxy) to intercept requests:
    *   Protects `/advisor/*` routes: Allows access only if cookie has `role === 'advisor'`.
    *   Protects `/client/*` routes: Allows access only if cookie has `role === 'client'`.
    *   Automatically redirects unauthorized requests to `/login`.

### 4. Real Gemini AI Assistant (Phase 4)
*   Implemented `/api/ai` endpoint integrated with the official `@google/generative-ai` SDK.
*   Constructs a real-time JSON snapshot context of all clients, policies, and investments.
*   Passes this data snapshot to `gemini-1.5-flash` to answer natural language queries (e.g., "Summarize Sneha Gupta's portfolio").
*   If `GEMINI_API_KEY` is not present in `.env`, the endpoint falls back gracefully to local mock response generation.

### 5. Report PDF Export (Phase 4)
*   Added a functional printWindow layout print engine to the Reports page. Clicking "Export PDF" opens a print dialogue formatting the report under custom media print styles.

### 6. Automated Renewal Alert Cron Simulator (Phase 5)
*   Created `/api/cron/reminders`. When triggered, it scans active policies due in 30 days and spawns tasks (e.g., "Renewal reminder: Send notice to Rajesh Sharma") which appear immediately in the advisor's dashboard checklist.

---

## Setup & Run Instructions

### 1. Environment Variable (Optional)
To enable the real Gemini AI assistant, add your Gemini API key to the `.env` file:
```env
GEMINI_API_KEY="your-google-gemini-api-key"
```

### 2. Run the Development Server
```bash
npm run dev
```

### 3. Login Credentials
Access the application at `http://localhost:3000/login`. You can log in using:
*   **Advisor**: `advisor@aksaarthi.com` / `password`
*   **Client**: `rajesh.sharma@email.com` / `password` (or any other client email from seed data).

### 4. Trigger the Automated Reminders Engine
Open `http://localhost:3000/api/cron/reminders` in your browser to simulate the automated cron job. It will output a JSON report of scanned policies and newly created dashboard tasks.
