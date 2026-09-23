# AK Saarthi AI

AI-powered CRM and financial advisory platform for insurance/investment advisors and their clients. Advisors manage clients, policies, investments, commissions, appointments, and documents from a dashboard; clients get a portal scoped to their own policies and investments. A built-in AI assistant (Google Gemini) can answer natural-language questions over the advisor's live data.

## Features

- **Advisor portal** — dashboard, client management (with soft-delete/restore/permanent-delete), policies, investments, commissions, calendar/appointments, tasks, document vault, analytics, reports (print/PDF export), festival greetings, financial plan presenter, and profile/administration settings.
- **Client portal** — dashboard, policies, investments, and profile — all scoped server-side to the signed-in client's own data.
- **Auth** — email/password login with bcrypt-hashed passwords and HTTP-only JWT cookies; public "request advisor access" flow with admin approval.
- **AI assistant** (`/advisor/ai`) — natural-language queries over clients/policies/investments, powered by Gemini 1.5 Flash, with a rule-based mock fallback when no API key is configured.
- **Automated renewal reminders** — `/api/cron/reminders` scans policies due within 30 days and creates advisor tasks.
- **Route protection** — `proxy.ts` (Edge middleware) verifies the JWT's signature and guards `/advisor/*` / `/client/*` by role; every API route independently re-verifies the session and scopes data by role (see [Security](#security--access-control) below).

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** SQLite via Prisma 7 with the `better-sqlite3` driver adapter
- **Auth:** `jsonwebtoken` + `bcryptjs`, HTTP-only cookies, HMAC verification in Edge middleware via Web Crypto
- **AI:** `@google/generative-ai` (Gemini)
- **Charts:** Recharts
- **Testing:** Jest + ts-jest
- **Linting:** ESLint 9 (flat config, zero warnings/errors)

## Architecture

```
Browser
  ↓
Next.js App Router (pages in app/advisor, app/client)
  ↓
proxy.ts  ── Edge middleware: verifies the ak_token JWT signature + role, redirects if invalid
  ↓
API routes (app/api/**/route.ts) ── each one re-verifies the session via lib/auth.ts
  and scopes queries by role (advisor: everything; client: only their own records)
  ↓
Prisma Client (better-sqlite3 adapter) ── lib/prisma.ts
  ↓
SQLite database (prisma/dev.db)

AI queries (app/api/ai) also call the Gemini API directly with a JSON
snapshot of the database as context, falling back to a local mock
response generator if GEMINI_API_KEY is unset.
```

Shared app state on the client side is managed via `contexts/app-context.tsx`, which fetches from the (already role-scoped) API routes and exposes an `isLoading` flag so the advisor/client shells can show a loading screen instead of flashing empty data.

## Security & Access Control

Every API route requires a valid session (`lib/auth.ts`'s `requireSession()`, which verifies the `ak_token` cookie server-side) and scopes what it returns by role:

| Data | Advisor | Client |
|---|---|---|
| Clients, policies, investments, documents, appointments | full access | **own record(s) only** |
| Commissions, tasks, AI assistant, backups, advisor administration | full access | no access (403) |

This replaced a starting state where every `/api/*` route had **no authentication at all** — any anonymous request could read or write the full client/policy/investment/commission database, and the client portal fetched and rendered every other client's PII client-side. See git history for the full before/after. Other hardening done in the same pass:

- **`proxy.ts`** now verifies the JWT's HMAC signature (via Web Crypto, since Edge middleware can't use `jsonwebtoken`/Node's `crypto`) instead of only base64-decoding the payload — a forged cookie is now rejected before the page even renders.
- **Login backdoor removed.** A hardcoded email (`kopalkhare2@gmail.com`) was auto-provisioned as an advisor account, and login for that email would accept the literal string `password`/`password123` even if it didn't match the stored hash, re-hashing it on the fly. Both were removed.
- **`/api/advisor/create`** (promotes any email to an advisor role) now requires an existing advisor session; previously anyone could call it directly to grant themselves — or overwrite an existing advisor's password — with no auth check.
- **Soft-deleted clients can no longer log in.** Deleting a client (soft-delete, for the trash/restore flow) didn't touch their linked login, so their client-portal account kept working; login now checks `isDeleted`.
- **Duplicate advisor-account store removed.** `lib/kv-store.ts` (a parallel JSON-file-backed store for advisor accounts, checked *in addition to* the database on every login) was deleted; the database is now the single source of truth.

## Project Structure

```
app/
  advisor/          Advisor-facing pages (dashboard, clients, policies, ...)
  client/           Client-facing pages (dashboard, policies, investments, profile)
  api/              REST API routes (auth, clients, policies, investments,
                     commissions, appointments, tasks, documents, ai, cron,
                     advisor administration)
  login/, register/ Public auth pages
components/ui/      Shared UI primitives (sidebar, topbar, modal, tabs, loading screen, ...)
contexts/           React context for shared app state (role-scoped by the API)
lib/                Server-side helpers: prisma client, session/auth, db seed helpers, types & utils
prisma/             schema.prisma, migrations/, seed.ts, dev.db (local)
proxy.ts            Edge middleware enforcing role-based route access (JWT-signature verified)
__tests__/          Jest API route tests + shared test helpers (incl. session mocking)
```

## Getting Started

### Prerequisites

- Node.js 20+ and npm

### 1. Install dependencies

```bash
npm install
```

This also runs `prisma generate` via `postinstall`.

### 2. Configure environment variables

Copy `.env.example` to `.env` (or create it):

```env
DATABASE_URL="file:./prisma/dev.db"

# Optional — falls back to an insecure dev secret if unset (dev only; required in production)
JWT_SECRET="a-long-random-string"

# Optional — enables the real Gemini AI assistant; without it, /api/ai uses a mock response generator
GEMINI_API_KEY="your-google-gemini-api-key"
```

`DATABASE_URL` is only read by the Prisma CLI (migrations/seeding); the running app always talks to `prisma/dev.db` directly (see `lib/prisma.ts`), so it must still be set for the commands below to work even though the app itself ignores it.

### 3. Set up the database

```bash
npx prisma migrate deploy   # creates prisma/dev.db and applies all migrations
npx prisma db seed          # loads the full demo dataset (clients, policies, investments, ...)
```

### 4. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000/login`.

### Demo credentials (after seeding)

| Role    | Email                        | Password   |
|---------|-------------------------------|------------|
| Advisor | `advisor@aksaarthi.com`       | `password` |
| Client  | `rajesh.sharma@email.com`     | `password` |

(Or any other `*.email@email.com` from `prisma/seed.ts`.)

### Other useful commands

```bash
npm run build      # prisma generate + next build
npm run start       # start the production server (after build)
npm run lint         # ESLint (0 errors, 0 warnings)
npm test             # Jest API tests (41/41 passing)
npx prisma studio     # browse the local SQLite database
```

To manually trigger the renewal-reminder job (advisor session required), visit `http://localhost:3000/api/cron/reminders` while logged in as an advisor.

## Deployment

Configured for Vercel: `lib/prisma.ts` copies `prisma/dev.db` into `/tmp/dev.db` at runtime because Vercel's filesystem is read-only outside `/tmp`. This means **data does not persist across deployments or cold starts** on Vercel — it's suitable for demos, not production traffic. See [Remaining Improvements](#remaining-improvements) below for a persistent-database alternative.

Set `JWT_SECRET` (required — the app throws at runtime if missing in production) and optionally `GEMINI_API_KEY` in your hosting platform's environment variables.

## Remaining Improvements

These are the honest gaps still open after the security/correctness pass above — worth knowing about, not blockers for a demo:

- **Move off ephemeral SQLite for deployment.** The `/tmp` copy-on-cold-start approach means every cold start on Vercel can silently reset or diverge from prior writes. A hosted Postgres/MySQL (or Turso/LibSQL to stay SQLite-compatible) removes this correctness risk entirely.
- **No rate limiting or brute-force protection on login.** `/api/auth/login` has no attempt throttling — fine for a demo, not for a public deployment with real user passwords.
- **No CSRF protection beyond `SameSite=strict`.** Acceptable for same-site form posts as this app currently uses, but worth revisiting if any cross-site integration is added later.
- **`/api/cron/reminders` is gated by an advisor session, not a cron secret.** That's consistent with how the rest of the app is secured, but a *real* scheduled cron job (e.g. Vercel Cron) has no browser session to send — it would need a separate shared-secret header if wired up to an actual scheduler instead of being triggered manually from the browser.
- **No automated UI/e2e tests** — only the API route layer has Jest coverage. A Playwright smoke test for the login → dashboard → CRUD path would catch regressions the API tests can't.

## License

Private/proprietary — no license file present.
