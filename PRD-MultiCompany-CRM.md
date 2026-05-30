# PRD — Multi-Company CRM System
**Document ID:** PRD-CRM-001  
**Version:** 2.0  
**Date:** 2026-05-29  
**Author:** Muhammad Arslan Nazir  
**Status:** Approved — Ready for Development

---

## 1. Overview

A production-grade, multi-tenant CRM SaaS application built on the relational schema defined in DBMS-Project-01. All 12 tables are fully functional with dedicated UI, API routes, and CRUD operations. Multiple independent companies operate on shared infrastructure with strict tenant isolation enforced via `company_id` propagation across every table.

Deployable portfolio product. Clean code. Live on Vercel with Neon Postgres.

---

## 2. Problem Statement

Existing CRM tools are either overbuilt (Salesforce, HubSpot) or underbuilt (spreadsheets). SMBs in a SaaS model need a CRM that is:
- Tenant-isolated by default
- Role-aware across the organization
- Covering the full lifecycle: lead → deal → invoice → payment → follow-up
- Deployable without per-client infrastructure

---

## 3. Goals

| Goal | Description |
|---|---|
| All 12 tables functional | Every table has its own UI page, API route, and full CRUD |
| Multi-tenancy | Every query scoped to `company_id` from session — never from client |
| Authentication | NextAuth v5 credentials + JWT, middleware-protected routes |
| Role-based access | Admin / Manager / Sales Rep with enforced permission gates |
| Speed-optimized dev | Libraries chosen to eliminate boilerplate, not add it |
| Portfolio quality | TypeScript strict mode, zod validation, deployed to Vercel |

---

## 4. Non-Goals (v1)

- Email sending / notifications (Resend — v2)
- File attachments
- Mobile app
- OAuth / social login
- Real-time updates / websockets
- Stripe billing integration (`subscription_plans` is data-only in v1)
- Per-user "change password on first login" flow (v2)

---

## 5. Tech Stack

### 5.1 Core Stack

| Layer | Choice | Why it's fast |
|---|---|---|
| Framework | Next.js 14 App Router | SSR + API in one repo, zero config deploy on Vercel |
| Database | Neon (PostgreSQL) | Serverless, HTTP driver, free tier, no connection pool to manage |
| DB Layer | `@neondatabase/serverless` raw SQL | Schema already written — no migration friction, no ORM learning curve |
| Auth | NextAuth v5 (Auth.js) | Credentials + JWT in ~30 lines; middleware handles all route protection |
| UI Components | shadcn/ui | Copy-paste components, already wired to Tailwind, zero custom CSS needed |
| Styling | Tailwind CSS v3 | Utility-first, no CSS files to maintain |
| Language | TypeScript strict | Catches tenant isolation bugs at compile time |

### 5.2 Speed-Multiplier Libraries

These are the libraries that cut development time in half. Every one of them has a specific job.

| Package | Job | Why it saves time |
|---|---|---|
| `react-hook-form` | Form state + validation | Zero controlled-input boilerplate; integrates directly with zod |
| `zod` | Schema validation (server + client) | One schema used for both API validation and form validation |
| `@hookform/resolvers` | Bridge between zod and react-hook-form | Single `zodResolver(schema)` call wires everything |
| `@tanstack/react-table` | Tables with sort / filter / pagination | Never write a table from scratch; all state managed internally |
| `@tanstack/react-query` | Server state, caching, loading/error states | Replaces 80% of `useEffect`+`useState` data-fetching boilerplate |
| `sonner` | Toast notifications | One `toast.success()` call, zero setup |
| `recharts` | Dashboard charts | Declarative, works with Tailwind colors, no D3 knowledge needed |
| `date-fns` | Date formatting + manipulation | Tree-shakeable, no moment.js bloat |
| `bcryptjs` | Password hashing | Simple, no native bindings, works in Vercel edge |
| `nuqs` | URL search params as state | Persist filters/pagination in URL with one hook — no manual URLSearchParams |
| `lucide-react` | Icons | Already bundled with shadcn, consistent set |

### 5.3 The react-hook-form + zod + shadcn Pattern

Every form in the app follows this exact pattern — write it once as a template, copy for every entity:

```typescript
// 1. Define schema (used for both API validation AND form)
const createLeadSchema = z.object({
  contact_id: z.number().int().positive(),
  assigned_to: z.number().int().positive(),
  status: z.enum(['new', 'contacted', 'qualified', 'lost']),
  notes: z.string().optional(),
})

// 2. Form component — zero manual validation logic
const form = useForm<z.infer<typeof createLeadSchema>>({
  resolver: zodResolver(createLeadSchema),
})

// 3. shadcn FormField handles error display automatically
<FormField control={form.control} name="status" render={({ field }) => (
  <FormItem>
    <FormLabel>Status</FormLabel>
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      ...
    </Select>
    <FormMessage /> {/* ← auto-shows zod error */}
  </FormItem>
)} />
```

This pattern eliminates all manual error state, all `onChange` handlers, and all validation logic from every form.

### 5.4 The react-query Data Fetching Pattern

Every list page follows this pattern:

```typescript
// Fetch — auto loading + error states
const { data, isLoading } = useQuery({
  queryKey: ['leads', filters],
  queryFn: () => fetch('/api/leads?' + new URLSearchParams(filters)).then(r => r.json()),
})

// Mutate — auto cache invalidation on success
const mutation = useMutation({
  mutationFn: (data) => fetch('/api/leads', { method: 'POST', body: JSON.stringify(data) }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] })
    toast.success('Lead created')
  },
})
```

No manual loading state. No manual refetch after create/edit/delete. Cache invalidation is one line.

### 5.5 Deployment

| Service | Purpose |
|---|---|
| Vercel | Frontend + API routes, auto-deploy from GitHub |
| Neon | Managed Postgres, free tier, HTTP-based driver |
| GitHub | Source control + CI/CD trigger |

---

## 6. System Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Next.js 14 App                    │
│                                                      │
│  ┌─────────────────────┐   ┌────────────────────┐   │
│  │   App Router (RSC)  │   │    API Routes       │   │
│  │                     │   │                     │   │
│  │  /login /register   │   │  POST /api/register │   │
│  │  /dashboard/*       │   │  /api/companies     │   │
│  │                     │   │  /api/users         │   │
│  │  React Query cache  │   │  /api/contacts      │   │
│  │  react-hook-form    │   │  /api/leads         │   │
│  │  TanStack Table     │   │  /api/deals         │   │
│  │  recharts           │   │  /api/activities    │   │
│  └─────────────────────┘   │  /api/tasks         │   │
│                            │  /api/invoices      │   │
│                            │  /api/payments      │   │
│                            │  /api/followups     │   │
│                            │  /api/plans         │   │
│                            │  /api/roles         │   │
│                            │  /api/stats         │   │
│                            └────────┬────────────┘   │
│                                     │ raw SQL        │
│                                     ▼                │
│                     ┌───────────────────────────┐   │
│                     │  Neon Serverless Postgres  │   │
│                     │  12 tables, tenant-scoped  │   │
│                     └───────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Tenant Isolation Pattern

Session always carries `{ userId, companyId, companyName, roleId, roleName, fullName }`. Every API route pulls `companyId` from the session — never from the request body or query params.

```typescript
// lib/db/client.ts
import { neon } from '@neondatabase/serverless'
export const sql = neon(process.env.DATABASE_URL!)

// lib/db/tenant.ts — wraps every query
export async function tq(
  session: Session,
  query: string,
  params: unknown[] = []
) {
  if (!session?.user?.companyId) throw new Error('Unauthorized')
  return sql(query, params) // companyId always injected in the query itself
}
```

---

## 7. Database — All 12 Tables

### 7.1 Schema Adaptation

Source schema from DBMS-Project-01 adapted to PostgreSQL:
- `AUTO_INCREMENT` → `SERIAL`  
- MySQL `ENUM` → PostgreSQL `CREATE TYPE ... AS ENUM`
- `VARCHAR` lengths preserved
- All FK constraints and CASCADE rules preserved

### 7.2 Complete Table Specifications

---

#### TABLE 1 — `subscription_plans`
**Module:** Core Tenancy  
**UI Page:** `/dashboard/plans` (admin-only, read + edit)  
**Purpose:** Defines available plan tiers. Seeded at DB init. Admins can view current plan details.

| Column | Type | Constraints |
|---|---|---|
| plan_id | SERIAL | PK |
| plan_name | VARCHAR(50) | NOT NULL, UNIQUE |
| price_per_month | DECIMAL(10,2) | NOT NULL |
| max_users | INT | NOT NULL |
| max_contacts | INT | NOT NULL |
| features | TEXT | |
| created_at | TIMESTAMP | DEFAULT NOW() |

**Seeded plans:** Free (0/mo, 3 users, 50 contacts), Growth ($49/mo, 10 users, 500 contacts), Enterprise ($149/mo, unlimited, unlimited)

**API Routes:**
- `GET /api/plans` — list all plans (public, used on register page plan display)
- `GET /api/plans/[id]` — get single plan

**UI:**
- `/dashboard/plans` — read-only card view showing all 3 plans, current company plan highlighted with a badge. Admin can see plan limits vs current usage (users count, contacts count). No editing in v1 — upgrade CTA links to a contact form.

---

#### TABLE 2 — `companies`
**Module:** Core Tenancy  
**UI Page:** `/dashboard/companies` (admin-only)  
**Purpose:** Tenant root. Every other table scopes to this via `company_id`.

| Column | Type | Constraints |
|---|---|---|
| company_id | SERIAL | PK |
| plan_id | INT | FK → subscription_plans |
| company_name | VARCHAR(100) | NOT NULL |
| industry | VARCHAR(100) | |
| email | VARCHAR(100) | NOT NULL, UNIQUE |
| phone | VARCHAR(20) | |
| address | TEXT | |
| city | VARCHAR(50) | |
| country | VARCHAR(50) | |
| status | ENUM | active / suspended / cancelled |
| created_at | TIMESTAMP | DEFAULT NOW() |

**API Routes:**
- `GET /api/companies/me` — get own company (session-scoped, no ID needed)
- `PATCH /api/companies/me` — update own company info (admin only)

**UI:**
- `/dashboard/companies` — single-page settings form. Company name, industry, contact info, address fields. Current plan shown as a read-only badge. Save button triggers `PATCH /api/companies/me`. Only admins can reach this page (middleware role-gate).

---

#### TABLE 3 — `roles`
**Module:** Core Tenancy  
**UI Page:** Referenced in `/dashboard/users`, no dedicated page  
**Purpose:** System-defined roles. Seeded at DB init. Not user-editable.

| Column | Type | Constraints |
|---|---|---|
| role_id | SERIAL | PK |
| role_name | VARCHAR(50) | NOT NULL, UNIQUE |
| description | TEXT | |

**Seeded roles:** `admin` (role_id: 1), `manager` (role_id: 2), `sales_rep` (role_id: 3)

**API Routes:**
- `GET /api/roles` — list all roles (used to populate role select dropdowns in user forms)

**UI:**
- No dedicated page. Roles appear as a `<Select>` dropdown in the Create/Edit User drawer on `/dashboard/users`. The `admin` role is excluded from the dropdown — only 1 admin per company, set at registration.

---

#### TABLE 4 — `users`
**Module:** Core Tenancy  
**UI Page:** `/dashboard/users` (admin-only)  
**Purpose:** Company employees. Created by admin only. Each user scoped to one company.

| Column | Type | Constraints |
|---|---|---|
| user_id | SERIAL | PK |
| company_id | INT | FK → companies |
| role_id | INT | FK → roles |
| full_name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(100) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(20) | |
| status | ENUM | active / inactive |
| created_at | TIMESTAMP | DEFAULT NOW() |

**API Routes:**
- `GET /api/users` — list users in own company
- `POST /api/users` — create team member (admin only)
- `PATCH /api/users/[id]` — update role, status, name, phone (admin only)
- `DELETE /api/users/[id]` — soft delete: sets status = inactive (admin only)

**UI:**
- `/dashboard/users` — TanStack table with columns: name, email, role badge, status badge, created date, actions menu. "New User" button opens a Sheet (drawer) with react-hook-form: full_name, email, password, role (Manager/Sales Rep only), phone. Edit user opens same drawer pre-populated. Deactivate = status toggle, not hard delete.

---

#### TABLE 5 — `contacts`
**Module:** Sales Pipeline  
**UI Page:** `/dashboard/contacts`  
**Purpose:** People tracked in the CRM. Each contact belongs to a company (tenant) and is created by a user.

| Column | Type | Constraints |
|---|---|---|
| contact_id | SERIAL | PK |
| company_id | INT | FK → companies |
| full_name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(100) | |
| phone | VARCHAR(20) | |
| job_title | VARCHAR(100) | |
| source | ENUM | referral / web / cold_outreach / social |
| created_by | INT | FK → users |
| created_at | TIMESTAMP | DEFAULT NOW() |

**API Routes:**
- `GET /api/contacts` — list (paginated, filterable by source, search by name/email)
- `POST /api/contacts` — create
- `GET /api/contacts/[id]` — detail with linked leads and activities
- `PATCH /api/contacts/[id]` — update
- `DELETE /api/contacts/[id]` — hard delete (admin/manager only)

**UI:**
- `/dashboard/contacts` — TanStack table with search bar (nuqs-persisted), source filter tabs, "New Contact" button → Sheet drawer form. Columns: name, email, job title, source badge, created by, date.
- `/dashboard/contacts/[id]` — detail page: contact info card + tabbed panels: Leads (linked leads list), Activities (timeline), Follow-ups (linked followup_logs).

---

#### TABLE 6 — `leads`
**Module:** Sales Pipeline  
**UI Page:** `/dashboard/leads`  
**Purpose:** Contacts in the sales funnel. Assigned to users. Can be converted to deals.

| Column | Type | Constraints |
|---|---|---|
| lead_id | SERIAL | PK |
| contact_id | INT | FK → contacts |
| company_id | INT | FK → companies |
| assigned_to | INT | FK → users |
| status | ENUM | new / contacted / qualified / lost |
| notes | TEXT | |
| created_at | TIMESTAMP | DEFAULT NOW() |

**API Routes:**
- `GET /api/leads` — list (paginated, filterable by status and assigned_to)
- `POST /api/leads` — create
- `GET /api/leads/[id]` — detail with contact info, assigned user, linked deal if converted
- `PATCH /api/leads/[id]` — update status, notes, assigned_to
- `DELETE /api/leads/[id]` — admin/manager only
- `POST /api/leads/[id]/convert` — creates a deal from this lead, returns deal_id

**UI:**
- `/dashboard/leads` — toggle between Kanban view (4 columns: new / contacted / qualified / lost, click card to move status) and Table view. nuqs persists active view + filters. "New Lead" button → Sheet: contact selector (searchable), assign to user, status, notes.
- `/dashboard/leads/[id]` — detail: lead info, contact card, assigned user, status selector, notes textarea with save, "Convert to Deal" button (opens modal to set deal title + value). If already converted, shows linked deal card.

---

#### TABLE 7 — `deals`
**Module:** Sales Pipeline  
**UI Page:** `/dashboard/deals`  
**Purpose:** Converted leads with monetary value and pipeline stage.

| Column | Type | Constraints |
|---|---|---|
| deal_id | SERIAL | PK |
| lead_id | INT | FK → leads |
| company_id | INT | FK → companies |
| assigned_to | INT | FK → users |
| deal_title | VARCHAR(150) | NOT NULL |
| value | DECIMAL(12,2) | |
| stage | ENUM | proposal / negotiation / closed_won / closed_lost |
| expected_close_date | DATE | |
| actual_close_date | DATE | |
| created_at | TIMESTAMP | DEFAULT NOW() |

**API Routes:**
- `GET /api/deals` — list (filterable by stage, assigned_to; includes value totals per stage)
- `POST /api/deals` — create (also callable standalone, not just via lead convert)
- `GET /api/deals/[id]` — detail with linked lead, activities, invoices
- `PATCH /api/deals/[id]` — update stage, value, dates, assigned_to
- `DELETE /api/deals/[id]` — admin/manager only

**UI:**
- `/dashboard/deals` — TanStack table with stage filter pills, total value per stage shown in header cards (proposal: $X, negotiation: $X, closed_won: $X). "New Deal" button → Sheet form.
- `/dashboard/deals/[id]` — detail: deal title + value + stage stepper (4-step progress indicator). Tabs: Activities (timeline), Invoices (linked invoice list with "Generate Invoice" button), Source Lead card.

---

#### TABLE 8 — `activities`
**Module:** Sales Pipeline  
**UI Page:** `/dashboard/activities`  
**Purpose:** Interaction log — calls, emails, meetings, notes — tied to deals and contacts.

| Column | Type | Constraints |
|---|---|---|
| activity_id | SERIAL | PK |
| deal_id | INT | FK → deals |
| contact_id | INT | FK → contacts |
| company_id | INT | FK → companies |
| performed_by | INT | FK → users |
| activity_type | ENUM | call / email / meeting / note |
| summary | TEXT | |
| activity_date | TIMESTAMP | DEFAULT NOW() |

**API Routes:**
- `GET /api/activities` — list (filterable by type, performed_by, deal_id, contact_id)
- `POST /api/activities` — create
- `GET /api/activities/[id]` — single activity
- `PATCH /api/activities/[id]` — update summary, type, date
- `DELETE /api/activities/[id]` — admin/manager only

**UI:**
- `/dashboard/activities` — full activity log table. Filter bar: type tabs (All / Call / Email / Meeting / Note), user filter, date range picker. Each row: type icon, summary, deal link, contact link, performed by, date. "Log Activity" button → Sheet: type selector (icon buttons), deal selector, contact selector, summary textarea, date picker.
- `<ActivityTimeline>` component — used inside deal detail and contact detail pages. Vertical timeline, grouped by date, each entry shows type icon + summary + performed by.

---

#### TABLE 9 — `tasks`
**Module:** Operations  
**UI Page:** `/dashboard/tasks`  
**Purpose:** Internal work items. Can be tied to deals and/or contacts. Priority and status tracked.

| Column | Type | Constraints |
|---|---|---|
| task_id | SERIAL | PK |
| company_id | INT | FK → companies |
| assigned_to | INT | FK → users |
| deal_id | INT | FK → deals, NULLABLE |
| contact_id | INT | FK → contacts, NULLABLE |
| title | VARCHAR(150) | NOT NULL |
| description | TEXT | |
| due_date | DATE | |
| priority | ENUM | low / medium / high |
| status | ENUM | pending / in_progress / completed |
| created_at | TIMESTAMP | DEFAULT NOW() |

**API Routes:**
- `GET /api/tasks` — list (filterable by status, priority, assigned_to, due_date range)
- `POST /api/tasks` — create
- `PATCH /api/tasks/[id]` — update status, priority, due_date, assignment
- `DELETE /api/tasks/[id]` — admin/manager only

**UI:**
- `/dashboard/tasks` — 3-column Kanban (Pending / In Progress / Completed). Each card shows: title, priority badge (color-coded: red=high, amber=medium, gray=low), due date, assigned user avatar, optional deal/contact link. Click card to move between columns. "New Task" → Sheet form: title, description, priority selector, due date picker, assign to user, optional deal/contact link.
- Sales reps only see tasks assigned to them.

---

#### TABLE 10 — `invoices`
**Module:** Operations & Finance  
**UI Page:** `/dashboard/invoices`  
**Purpose:** Financial documents issued against closed deals. Tracked through draft → sent → paid → overdue lifecycle.

| Column | Type | Constraints |
|---|---|---|
| invoice_id | SERIAL | PK |
| deal_id | INT | FK → deals |
| company_id | INT | FK → companies |
| issued_by | INT | FK → users |
| total_amount | DECIMAL(12,2) | NOT NULL |
| due_date | DATE | |
| status | ENUM | draft / sent / paid / overdue |
| created_at | TIMESTAMP | DEFAULT NOW() |

**API Routes:**
- `GET /api/invoices` — list (filterable by status)
- `POST /api/invoices` — create (linked to a deal)
- `GET /api/invoices/[id]` — detail with linked deal and payments
- `PATCH /api/invoices/[id]` — update status, due_date, amount
- `DELETE /api/invoices/[id]` — admin only, draft status only

**UI:**
- `/dashboard/invoices` — tabbed list: All / Draft / Sent / Paid / Overdue. TanStack table with columns: invoice ID, deal title, amount, due date, status badge, issued by, actions. Summary row at top: total outstanding, total paid, overdue count.
- `/dashboard/invoices/[id]` — detail page: invoice header (ID, status badge, amount, due date), linked deal card, issued by, "Mark as Sent" / "Mark as Paid" / "Mark as Overdue" action buttons based on current status. Linked payments section below.

---

#### TABLE 11 — `payments`
**Module:** Operations & Finance  
**UI Page:** `/dashboard/payments`  
**Purpose:** Records of money received against invoices. Supports multiple partial payments per invoice.

| Column | Type | Constraints |
|---|---|---|
| payment_id | SERIAL | PK |
| invoice_id | INT | FK → invoices |
| company_id | INT | FK → companies |
| amount_paid | DECIMAL(12,2) | NOT NULL |
| payment_date | DATE | NOT NULL |
| payment_method | ENUM | bank_transfer / card / cash / cheque |
| notes | TEXT | |

**API Routes:**
- `GET /api/payments` — list (filterable by method, date range, invoice_id)
- `POST /api/payments` — record payment (admin/manager only)
- `GET /api/payments/[id]` — single payment detail
- `DELETE /api/payments/[id]` — admin only

**UI:**
- `/dashboard/payments` — TanStack table: amount, method badge, linked invoice, payment date, notes. Filter bar: method tabs, date range picker. Total received shown in header card. "Record Payment" button → Sheet: invoice selector (searchable, shows invoice ID + deal name + outstanding amount), amount field, method selector, date picker, notes.

---

#### TABLE 12 — `followup_logs`
**Module:** Operations  
**UI Page:** `/dashboard/followups`  
**Purpose:** Scheduled follow-up actions with outcome tracking. Linked to contacts, leads, and optionally deals.

| Column | Type | Constraints |
|---|---|---|
| followup_id | SERIAL | PK |
| company_id | INT | FK → companies |
| contact_id | INT | FK → contacts |
| lead_id | INT | FK → leads, NULLABLE |
| deal_id | INT | FK → deals, NULLABLE |
| scheduled_by | INT | FK → users |
| scheduled_date | DATETIME | NOT NULL |
| outcome | ENUM | reached / no_answer / rescheduled / converted |
| next_action | TEXT | |
| created_at | TIMESTAMP | DEFAULT NOW() |

**API Routes:**
- `GET /api/followups` — list (filterable by outcome, scheduled_by, upcoming/past, contact_id)
- `POST /api/followups` — schedule a follow-up
- `GET /api/followups/[id]` — single follow-up detail
- `PATCH /api/followups/[id]` — record outcome + next_action (main action on this table)
- `DELETE /api/followups/[id]` — admin/manager only

**UI:**
- `/dashboard/followups` — two-tab layout: **Upcoming** (scheduled_date >= today, no outcome yet, sorted ascending) and **Past** (outcome recorded, sorted descending). Each row: contact name + link, linked lead/deal if set, scheduled date, scheduled by, outcome badge (or "Pending" if none). "Schedule Follow-up" → Sheet: contact selector, lead/deal selectors (optional), date+time picker, scheduled_by (defaults to current user).
- "Record Outcome" button on each row opens an inline modal: outcome selector (reached / no_answer / rescheduled / converted) + next_action textarea. On submit → `PATCH /api/followups/[id]` → row moves from Upcoming to Past tab.

---

### 7.3 Table → Page → API Mapping (Quick Reference)

| # | Table | UI Page | API Route | CRUD |
|---|---|---|---|---|
| 1 | subscription_plans | `/dashboard/plans` | `/api/plans` | R |
| 2 | companies | `/dashboard/companies` | `/api/companies/me` | R, U |
| 3 | roles | (dropdown only) | `/api/roles` | R |
| 4 | users | `/dashboard/users` | `/api/users` | C, R, U, D |
| 5 | contacts | `/dashboard/contacts` + `/[id]` | `/api/contacts` | C, R, U, D |
| 6 | leads | `/dashboard/leads` + `/[id]` | `/api/leads` | C, R, U, D + convert |
| 7 | deals | `/dashboard/deals` + `/[id]` | `/api/deals` | C, R, U, D |
| 8 | activities | `/dashboard/activities` | `/api/activities` | C, R, U, D |
| 9 | tasks | `/dashboard/tasks` | `/api/tasks` | C, R, U, D |
| 10 | invoices | `/dashboard/invoices` + `/[id]` | `/api/invoices` | C, R, U, D |
| 11 | payments | `/dashboard/payments` | `/api/payments` | C, R, D |
| 12 | followup_logs | `/dashboard/followups` | `/api/followups` | C, R, U, D |

---

### 7.4 Seed Data

Two tenant companies pre-loaded for development and demo:

**Nexus Data Corp** — plan: Enterprise
- 5 users: 1 admin, 2 managers, 2 sales reps
- 15 contacts (mix of sources), 12 leads (all 4 statuses), 6 deals (all stages)
- 10 activities (all 4 types), 8 tasks (all priorities + statuses)
- 3 invoices (1 paid, 1 sent, 1 overdue), 2 payments
- 5 followup_logs (3 upcoming, 2 past with outcomes)

**Aura Logistics** — plan: Growth
- 3 users: 1 admin, 2 sales reps
- 8 contacts, 6 leads, 3 deals
- 6 activities, 4 tasks, 2 invoices, 1 payment
- 3 followup_logs

**Login credentials (bcrypt-hashed in seed):**
- `admin@nexusdata.io` / `Admin1234!`
- `admin@auralogistics.com` / `Admin1234!`

---

## 8. Authentication & Authorization

### 8.1 NextAuth v5 Config

- Provider: Credentials (email + password)
- Strategy: JWT
- Session payload: `{ userId, companyId, companyName, roleId, roleName, fullName }`
- Middleware: `middleware.ts` protects all `/dashboard/*` and `/api/*` (except `/api/register` and `/api/plans`)
- Unauthed redirect → `/login`
- Already-authed redirect from `/login` or `/register` → `/dashboard`

### 8.2 Role Permission Matrix

| Action | Admin | Manager | Sales Rep |
|---|---|---|---|
| View all company data | ✓ | ✓ | Own assigned only |
| Manage users | ✓ | ✗ | ✗ |
| Edit company settings | ✓ | ✗ | ✗ |
| Create contacts / leads / deals | ✓ | ✓ | ✓ |
| Delete records | ✓ | ✓ | ✗ |
| View / create invoices & payments | ✓ | ✓ | ✗ |
| Manage tasks | ✓ | ✓ | Own assigned only |
| Log activities | ✓ | ✓ | ✓ |
| Schedule / record follow-ups | ✓ | ✓ | ✓ |

### 8.3 Enforcement Points

- **Middleware** (`middleware.ts`) — route-level: blocks all `/dashboard/*` if no session
- **API routes** — every handler calls `getServerSession()` and checks `roleId` before any DB operation
- **UI** — sidebar hides role-restricted items; restricted pages show 403 component instead of data

---

## 9. User & Company Signup Flow

### 9.1 Model: Admin-Provisioned

No self-service for individual users. Two entry points:

- **Entry A — New company (public):** Admin registers company + own account at `/register`
- **Entry B — Team members (admin only):** Admin creates all user accounts from `/dashboard/users`

### 9.2 Registration Flow

```
/register (2-step form)
    │
    ├── Step 1: Company Info
    │   company_name, industry, email, phone, country
    │
    └── Step 2: Admin Account
        full_name, work_email, password, confirm_password
                   │
                   ▼
        POST /api/register
        ┌─────────────────────────────────┐
        │ BEGIN TRANSACTION               │
        │ INSERT INTO companies (...)     │  ← plan_id: 1 (Free), status: active
        │ INSERT INTO users (...)         │  ← role_id: 1 (admin), bcrypt hash
        │ COMMIT                          │
        └──────────────┬──────────────────┘
                       │ success
                       ▼
             NextAuth auto-signin
                       │
                       ▼
             /dashboard (setup checklist visible)
```

### 9.3 Registration Validation (Zod)

```typescript
const registerSchema = z.object({
  company_name: z.string().min(2).max(100),
  industry: z.string().optional(),
  company_email: z.string().email(),
  phone: z.string().optional(),
  country: z.string().optional(),
  full_name: z.string().min(2).max(100),
  work_email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})
```

Same schema used on both client (react-hook-form zodResolver) and server (API route validation).

### 9.4 Setup Checklist (Post-Registration)

Shows on dashboard home until dismissed. State in `localStorage` — no DB column needed.

```
┌──────────────────────────────────────────────────┐
│  🚀 Get started with your CRM         [Dismiss ×] │
│                                                  │
│  ✅  Company registered                          │
│  ✅  Admin account created                       │
│  ○   Add your first team member     [Go →]       │
│  ○   Add your first contact         [Go →]       │
│  ○   Create your first lead         [Go →]       │
│  ○   Set up a deal                  [Go →]       │
└──────────────────────────────────────────────────┘
```

Dismisses permanently on "×" click. Also auto-dismisses when all 4 items complete.

---

## 10. Application Pages & Routes

### 10.1 Public Routes

| Route | Description |
|---|---|
| `/` | Landing page — product overview, feature list, login + register CTAs |
| `/login` | NextAuth credentials login form |
| `/register` | 2-step company + admin account registration |

### 10.2 Dashboard Routes

| Route | Page | Tables Touched |
|---|---|---|
| `/dashboard` | Home — KPIs + charts + setup checklist | companies, leads, deals, invoices, activities |
| `/dashboard/contacts` | Contact list + create | contacts, users |
| `/dashboard/contacts/[id]` | Contact detail | contacts, leads, activities, followup_logs |
| `/dashboard/leads` | Lead kanban + table | leads, contacts, users |
| `/dashboard/leads/[id]` | Lead detail + convert | leads, contacts, users, deals |
| `/dashboard/deals` | Deal list + stage totals | deals, leads, users |
| `/dashboard/deals/[id]` | Deal detail + activities + invoices | deals, activities, invoices, leads |
| `/dashboard/activities` | Activity log | activities, deals, contacts, users |
| `/dashboard/tasks` | Task kanban | tasks, users, deals, contacts |
| `/dashboard/invoices` | Invoice list tabbed by status | invoices, deals, users |
| `/dashboard/invoices/[id]` | Invoice detail + payments | invoices, deals, payments |
| `/dashboard/payments` | Payment history | payments, invoices |
| `/dashboard/followups` | Follow-up upcoming + past | followup_logs, contacts, leads, deals, users |
| `/dashboard/plans` | Plan cards + current plan | subscription_plans, companies |
| `/dashboard/companies` | Company settings | companies, subscription_plans |
| `/dashboard/users` | User management | users, roles |

---

## 11. Complete API Route Reference

| Method | Route | Auth | Tables | Description |
|---|---|---|---|---|
| POST | `/api/register` | Public | companies, users | Atomic company + admin creation |
| GET | `/api/plans` | Public | subscription_plans | List all plans |
| GET | `/api/roles` | Required | roles | List all roles (for dropdowns) |
| GET | `/api/companies/me` | Required | companies | Get own company |
| PATCH | `/api/companies/me` | Admin | companies | Update company info |
| GET | `/api/users` | Required | users, roles | List company users |
| POST | `/api/users` | Admin | users | Create team member |
| PATCH | `/api/users/[id]` | Admin | users | Update role / status |
| DELETE | `/api/users/[id]` | Admin | users | Deactivate user |
| GET | `/api/contacts` | Required | contacts, users | List contacts (paginated) |
| POST | `/api/contacts` | Required | contacts | Create contact |
| GET | `/api/contacts/[id]` | Required | contacts, leads, activities | Contact detail |
| PATCH | `/api/contacts/[id]` | Required | contacts | Update contact |
| DELETE | `/api/contacts/[id]` | Mgr+ | contacts | Delete contact |
| GET | `/api/leads` | Required | leads, contacts, users | List leads |
| POST | `/api/leads` | Required | leads | Create lead |
| GET | `/api/leads/[id]` | Required | leads, contacts, deals | Lead detail |
| PATCH | `/api/leads/[id]` | Required | leads | Update lead |
| DELETE | `/api/leads/[id]` | Mgr+ | leads | Delete lead |
| POST | `/api/leads/[id]/convert` | Required | leads, deals | Convert lead → deal |
| GET | `/api/deals` | Required | deals, leads, users | List deals |
| POST | `/api/deals` | Required | deals | Create deal |
| GET | `/api/deals/[id]` | Required | deals, activities, invoices | Deal detail |
| PATCH | `/api/deals/[id]` | Required | deals | Update deal |
| DELETE | `/api/deals/[id]` | Mgr+ | deals | Delete deal |
| GET | `/api/activities` | Required | activities, deals, contacts | List activities |
| POST | `/api/activities` | Required | activities | Log activity |
| PATCH | `/api/activities/[id]` | Required | activities | Update activity |
| DELETE | `/api/activities/[id]` | Mgr+ | activities | Delete activity |
| GET | `/api/tasks` | Required | tasks, users | List tasks |
| POST | `/api/tasks` | Required | tasks | Create task |
| PATCH | `/api/tasks/[id]` | Required | tasks | Update task |
| DELETE | `/api/tasks/[id]` | Mgr+ | tasks | Delete task |
| GET | `/api/invoices` | Required | invoices, deals | List invoices |
| POST | `/api/invoices` | Required | invoices | Create invoice |
| GET | `/api/invoices/[id]` | Required | invoices, payments, deals | Invoice detail |
| PATCH | `/api/invoices/[id]` | Required | invoices | Update status / amount |
| DELETE | `/api/invoices/[id]` | Admin | invoices | Delete draft invoice |
| GET | `/api/payments` | Required | payments, invoices | List payments |
| POST | `/api/payments` | Mgr+ | payments | Record payment |
| DELETE | `/api/payments/[id]` | Admin | payments | Delete payment |
| GET | `/api/followups` | Required | followup_logs, contacts | List follow-ups |
| POST | `/api/followups` | Required | followup_logs | Schedule follow-up |
| PATCH | `/api/followups/[id]` | Required | followup_logs | Record outcome |
| DELETE | `/api/followups/[id]` | Mgr+ | followup_logs | Delete follow-up |
| GET | `/api/stats/dashboard` | Required | all | KPI aggregations |

---

## 12. Dashboard — Stats & Charts

### 12.1 KPI Cards (from `/api/stats/dashboard`)

| Card | Query |
|---|---|
| Total Leads | `COUNT(*) FROM leads WHERE company_id = $1` |
| Open Deals | `COUNT(*) FROM deals WHERE company_id = $1 AND stage NOT IN ('closed_won','closed_lost')` |
| Total Revenue | `SUM(value) FROM deals WHERE company_id = $1 AND stage = 'closed_won'` |
| Overdue Invoices | `COUNT(*) FROM invoices WHERE company_id = $1 AND status = 'overdue'` |
| Tasks Due Today | `COUNT(*) FROM tasks WHERE company_id = $1 AND due_date = CURRENT_DATE AND status != 'completed'` |
| Upcoming Follow-ups | `COUNT(*) FROM followup_logs WHERE company_id = $1 AND scheduled_date >= NOW() AND outcome IS NULL` |

### 12.2 Charts

- **Lead Funnel** (bar chart) — count of leads per status: new / contacted / qualified / lost
- **Deal Pipeline by Stage** (bar chart) — total value per stage
- **Revenue Over Time** (line chart) — monthly closed_won deal value, last 6 months
- **Activity Breakdown** (donut chart) — count by activity type

---

## 13. UI Component System

### 13.1 shadcn/ui Components

`Button`, `Input`, `Label`, `Card`, `CardHeader`, `CardContent`, `Table`, `Dialog`, `Sheet`, `Select`, `Badge`, `Tabs`, `TabsContent`, `Separator`, `Avatar`, `DropdownMenu`, `Popover`, `Calendar`, `Textarea`, `Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage`, `FormControl`, `Skeleton`, `ScrollArea`, `Tooltip`, `Progress`, `Alert`, `AlertDescription`

### 13.2 Custom Components

| Component | Used In | Description |
|---|---|---|
| `<AppSidebar>` | All dashboard pages | Collapsible left nav, role-aware item visibility |
| `<TenantBadge>` | Header | Active company name + plan badge |
| `<KPICard>` | Dashboard home | Stat + icon + optional trend arrow |
| `<SetupChecklist>` | Dashboard home | First-login guide, localStorage state, dismissible |
| `<DataTable>` | All list pages | TanStack table wrapper: sort, filter, pagination, column visibility |
| `<StatusBadge>` | All list pages | Colored badge mapped from ENUM value |
| `<LeadKanban>` | `/dashboard/leads` | 4-column kanban, click-to-move status |
| `<TaskKanban>` | `/dashboard/tasks` | 3-column kanban with priority colors |
| `<ActivityTimeline>` | Deal detail, Contact detail | Vertical date-grouped timeline |
| `<QuickCreateSheet>` | All create flows | Sheet wrapper with consistent header + form layout |
| `<ConfirmDialog>` | All delete actions | shadcn AlertDialog wrapper for destructive confirmation |
| `<EmptyState>` | All list pages | Illustration + message + CTA when table is empty |
| `<PageHeader>` | All dashboard pages | Page title + description + primary action button |
| `<FilterBar>` | List pages | nuqs-powered filter pills + search input |

### 13.3 Form Convention

Every create/edit form uses the same shell:

```
<QuickCreateSheet title="New Lead" description="...">
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* FormField blocks */}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Create Lead'}
      </Button>
    </form>
  </Form>
</QuickCreateSheet>
```

### 13.4 Layout

```
┌──────────────────────────────────────────────────────┐
│  Header: Logo | TenantBadge | UserMenu (avatar)      │
├─────────────┬────────────────────────────────────────┤
│  Sidebar    │  <PageHeader title="" action={button}> │
│  (240px,    │  ─────────────────────────────────────  │
│  collapse-  │  Page content (scrollable)             │
│  able)      │                                        │
│             │  <DataTable> / <Kanban> / <Form>       │
│  role-aware │                                        │
│  nav items  │                                        │
└─────────────┴────────────────────────────────────────┘
```

---

## 14. Project Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx               ← sidebar + header shell
│   │   └── dashboard/
│   │       ├── page.tsx             ← KPIs + charts + checklist
│   │       ├── contacts/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── leads/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── deals/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── activities/page.tsx
│   │       ├── tasks/page.tsx
│   │       ├── invoices/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── payments/page.tsx
│   │       ├── followups/page.tsx
│   │       ├── plans/page.tsx
│   │       ├── companies/page.tsx
│   │       └── users/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── register/route.ts
│   │   ├── plans/route.ts
│   │   ├── roles/route.ts
│   │   ├── companies/me/route.ts
│   │   ├── users/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── contacts/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── leads/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── convert/route.ts
│   │   ├── deals/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── activities/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── tasks/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── invoices/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── payments/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── followups/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── stats/dashboard/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                          ← shadcn primitives (auto-generated)
│   ├── app/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── tenant-badge.tsx
│   │   ├── setup-checklist.tsx
│   │   ├── kpi-card.tsx
│   │   ├── activity-timeline.tsx
│   │   ├── lead-kanban.tsx
│   │   └── task-kanban.tsx
│   └── shared/
│       ├── data-table.tsx
│       ├── status-badge.tsx
│       ├── quick-create-sheet.tsx
│       ├── confirm-dialog.tsx
│       ├── empty-state.tsx
│       ├── page-header.tsx
│       └── filter-bar.tsx
├── lib/
│   ├── db/
│   │   ├── client.ts                ← neon() connection export
│   │   ├── tenant.ts                ← tq() tenant-scoped query wrapper
│   │   └── queries/
│   │       ├── plans.ts
│   │       ├── companies.ts
│   │       ├── users.ts
│   │       ├── contacts.ts
│   │       ├── leads.ts
│   │       ├── deals.ts
│   │       ├── activities.ts
│   │       ├── tasks.ts
│   │       ├── invoices.ts
│   │       ├── payments.ts
│   │       ├── followups.ts
│   │       └── stats.ts
│   ├── auth/
│   │   ├── config.ts                ← NextAuth config
│   │   └── permissions.ts           ← role permission map + helper fns
│   └── validations/
│       ├── register.ts
│       ├── contact.ts
│       ├── lead.ts
│       ├── deal.ts
│       ├── activity.ts
│       ├── task.ts
│       ├── invoice.ts
│       ├── payment.ts
│       └── followup.ts
├── types/
│   └── index.ts                     ← all DB row types + session types
├── hooks/
│   ├── use-contacts.ts              ← react-query hooks per domain
│   ├── use-leads.ts
│   └── ...
├── middleware.ts
└── sql/
    ├── schema.sql
    └── seed.sql
```

---

## 15. Sprint Plan

**Deadline: June 5, 2026 — 7 days**

### Sprint 1 — Foundation (Day 1)

- [ ] `npx create-next-app` — TypeScript, Tailwind, App Router, src-less
- [ ] Install all libraries: shadcn init, react-hook-form, zod, @hookform/resolvers, @tanstack/react-table, @tanstack/react-query, sonner, recharts, date-fns, bcryptjs, nuqs, @neondatabase/serverless, next-auth@beta
- [ ] Add all shadcn components in one pass: `npx shadcn add button input label card table dialog sheet select badge tabs separator avatar dropdown-menu popover calendar textarea form skeleton scroll-area tooltip progress alert`
- [ ] Neon project setup → run `sql/schema.sql` → run `sql/seed.sql`
- [ ] `lib/db/client.ts` + `lib/db/tenant.ts`
- [ ] `types/index.ts` — all 12 table row types + Session type
- [ ] NextAuth v5 config — credentials + JWT
- [ ] `middleware.ts` — protect `/dashboard/*` + `/api/*`
- [ ] Base layout: header + sidebar shell (placeholder nav items)
- [ ] `/login` page — react-hook-form + sonner on error
- [ ] `/register` page — 2-step form + `POST /api/register` atomic transaction

### Sprint 2 — Tenancy Core (Day 2)

- [ ] `GET /api/roles` + `GET /api/plans`
- [ ] `GET|PATCH /api/companies/me`
- [ ] `GET|POST|PATCH|DELETE /api/users`
- [ ] `/dashboard/companies` — settings form
- [ ] `/dashboard/plans` — plan cards + usage stats
- [ ] `/dashboard/users` — DataTable + create/edit Sheet
- [ ] Role-aware sidebar (hide restricted items by roleName)
- [ ] `<SetupChecklist>` component wired to localStorage
- [ ] Tenant isolation smoke test: both seed accounts, confirm no bleed

### Sprint 3 — Sales Pipeline (Day 3–4)

- [ ] All contacts API routes (`/api/contacts`, `/api/contacts/[id]`)
- [ ] `/dashboard/contacts` — DataTable, FilterBar, create Sheet
- [ ] `/dashboard/contacts/[id]` — detail with tabs
- [ ] All leads API routes + `/convert`
- [ ] `/dashboard/leads` — Kanban + table toggle (nuqs persists view)
- [ ] `/dashboard/leads/[id]` — detail + convert to deal modal
- [ ] All deals API routes
- [ ] `/dashboard/deals` — DataTable + stage value header cards
- [ ] `/dashboard/deals/[id]` — detail + stage stepper + tabs
- [ ] All activities API routes
- [ ] `/dashboard/activities` — log table + FilterBar
- [ ] `<ActivityTimeline>` component (used in deal + contact detail)

### Sprint 4 — Operations Module (Day 5)

- [ ] All tasks API routes
- [ ] `/dashboard/tasks` — 3-column Kanban with priority badges
- [ ] All invoices API routes
- [ ] `/dashboard/invoices` + `/dashboard/invoices/[id]`
- [ ] All payments API routes
- [ ] `/dashboard/payments` — history table + record Sheet
- [ ] All followups API routes
- [ ] `/dashboard/followups` — Upcoming / Past tabs + outcome modal

### Sprint 5 — Dashboard + Polish (Day 6–7)

- [ ] `GET /api/stats/dashboard` — all 6 KPI queries + 4 chart datasets in one call
- [ ] `/dashboard` — 6 KPI cards + 4 recharts charts + recent activity feed
- [ ] `<EmptyState>` on all list pages
- [ ] Skeleton loaders on all data pages (react-query `isLoading`)
- [ ] `<ConfirmDialog>` wired to all delete actions
- [ ] Error handling: zod 400, auth 401, role 403, not found 404, server 500
- [ ] Responsive: sidebar collapses to icon-only on md, drawer on mobile
- [ ] QueryClientProvider + Toaster setup in root layout
- [ ] Final Vercel deploy + env vars
- [ ] `README.md` — setup instructions, env vars, live URL, screenshots

---

## 16. Environment Variables

```env
# .env.local
DATABASE_URL=           # neon connection string (pooled)
AUTH_SECRET=            # openssl rand -base64 32
AUTH_URL=               # http://localhost:3000 in dev / https://... in prod
```

---

## 17. Success Criteria

| # | Criteria | Definition of Done |
|---|---|---|
| 1 | All 12 tables functional | Every table has a UI page, API routes, and working CRUD |
| 2 | Registration | New company + admin created atomically, auto-logged in |
| 3 | Auth | Login/logout works, wrong password rejected, session persists |
| 4 | Tenant isolation | Nexus Data user sees zero Aura Logistics data and vice versa |
| 5 | Role gates | Sales rep cannot reach users, invoices, or payments pages |
| 6 | Lead → Deal flow | Convert button creates a deal, lead shows linked deal |
| 7 | Invoice → Payment flow | Record payment links to invoice, invoice status updates |
| 8 | Dashboard live | All 6 KPIs + 4 charts pulling real data from Neon |
| 9 | Setup checklist | Appears on first login, each CTA works, dismisses cleanly |
| 10 | No mocked data | Zero hardcoded arrays — every page reads from Neon |
| 11 | Forms validated | All forms: client-side zod errors shown inline, server rejects invalid payloads |
| 12 | Deployed | Live Vercel URL, env vars set, Neon connected |
| 13 | Code quality | No TypeScript `any`, consistent query pattern across all routes |

---

## 18. Future Scope (Post v1)

- Email notifications via Resend (lead assigned, invoice sent, follow-up reminder)
- Change-password flow for new users
- OAuth login (Google / GitHub)
- CSV import for bulk contacts/leads
- Public client portal (invoice view + payment confirmation)
- Subscription plan enforcement (max_users + max_contacts limits against subscription_plans)
- Audit log table
- Advanced date-range reporting
- Multi-language support
