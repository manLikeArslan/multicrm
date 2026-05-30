# Multi-Company CRM — V1 Development Task List

This file tracks all tasks required to deliver the V1 release of the Multi-Company CRM System.

## Project Status Dashboard

- **Total Progress**: `[x] 100%`
- **Sprint 1 (Foundation)**: `[x] 100%`
- **Sprint 2 (Tenancy Core)**: `[x] 100%`
- **Sprint 3 (Sales Pipeline)**: `[x] 100%`
- **Sprint 4 (Operations Module)**: `[x] 100%`
- **Sprint 5 (Dashboard & Polish)**: `[x] 100%`

---

## 🛠️ Sprint 1 — Foundation (Day 1)
- [x] **Next.js Project Initialization**
  - [x] Run `npx create-next-app` (TypeScript, Tailwind CSS, App Router, src-less, ESLint)
  - [x] Configure `tsconfig.json` for strict type checking
- [x] **Dependency Installation**
  - [x] Install utility-first & helper libraries: `zod`, `react-hook-form`, `@hookform/resolvers`, `sonner`, `lucide-react`, `date-fns`, `bcryptjs`, `nuqs`
  - [x] Install serverless database driver: `@neondatabase/serverless`
  - [x] Install state & caching layers: `@tanstack/react-query`, `@tanstack/react-table`
  - [x] Install auth layer: `next-auth@beta` (NextAuth v5)
  - [x] Install charting library: `recharts`
- [x] **shadcn/ui Initialization & Primitives Setup**
  - [x] Initialize shadcn/ui: `npx shadcn-ui@latest init`
  - [x] Install all 22 required UI primitives in one command
- [x] **Neon Database Schema Setup**
  - [x] Create `/sql/schema.sql` with all 12 Postgres tables, standard serial columns, and foreign key cascade rules
  - [x] Create `/sql/seed.sql` with mock data for Nexus Data Corp & Aura Logistics (with bcrypt-hashed passwords)
- [x] **Core Database & Tenancy Wrappers**
  - [x] Implement `lib/db/client.ts` to export standard serverless database connection
  - [x] Implement `lib/db/tenant.ts` with standard `tq()` tenant-scoped query wrapper to prevent cross-company data bleed
- [x] **Core Type Definitions**
  - [x] Implement `types/index.ts` to define types for all 12 table records and the custom JWT/Session payload
- [x] **NextAuth v5 Configuration**
  - [x] Set up NextAuth configuration using Credentials provider and JWT session strategy
  - [x] Inject `userId`, `companyId`, `companyName`, `roleId`, `roleName`, and `fullName` into the session
- [x] **Global Route Protection & Layout**
  - [x] Implement `/middleware.ts` to secure all `/dashboard/*` and `/api/*` routes (except register/plans)
  - [x] Build `/app/(dashboard)/layout.tsx` incorporating collapsible `<AppSidebar>` and top `<Header>` with `<TenantBadge>`
- [x] **Public Auth Pages**
  - [x] Build `/login` form using `react-hook-form`, `zod`, and NextAuth sign-in
  - [x] Build `/register` 2-step registration page (Step 1: Company details, Step 2: Admin credentials) with atomic Postgres transaction support via `/api/register`

---

## 🏢 Sprint 2 — Tenancy Core (Day 2)
- [x] **Tenancy APIs**
  - [x] Implement `GET /api/plans` for public plan viewing
  - [x] Implement `GET /api/roles` for team assignment dropdowns
  - [x] Implement `GET /api/companies/me` & `PATCH /api/companies/me` (Admin only) to fetch/update company profile
  - [x] Implement `GET|POST|PATCH|DELETE /api/users` (Admin only, user soft-deactivation)
- [x] **Tenancy Views**
  - [x] Build `/dashboard/plans` card layout highlighting active subscription, limits, and usage metrics
  - [x] Build `/dashboard/companies` settings page containing editable forms for company details
  - [x] Build `/dashboard/users` utilizing `<DataTable>` wrapper and side drawer Sheets for creating & editing users
- [x] **Role-Aware Security Controls**
  - [x] Implement sidebar menu item filtering based on active user's `roleName`
  - [x] Build custom 403 Forbidden page/component displayed when a non-admin attempts to access `/dashboard/users` or settings
- [x] **Onboarding & Smoke Testing**
  - [x] Build `<SetupChecklist>` dashboard component leveraging client-side `localStorage` state
  - [x] Execute smoke tests for tenant data separation between Nexus Data Corp & Aura Logistics

---

## 📈 Sprint 3 — Sales Pipeline (Days 3–4)
- [x] **Contacts Domain**
  - [x] Build `lib/db/queries/contacts.ts` (CRUD raw queries)
  - [x] Implement `GET|POST|PATCH|DELETE /api/contacts` APIs
  - [x] Build `/dashboard/contacts` table page with name search and source filter tabs
  - [x] Build `/dashboard/contacts/[id]` contact summary detail page (Leads list, activity history, upcoming follow-ups)
- [x] **Leads Domain**
  - [x] Build `lib/db/queries/leads.ts`
  - [x] Implement `GET|POST|PATCH|DELETE /api/leads` and `/api/leads/[id]/convert` APIs
  - [x] Build `/dashboard/leads` containing a toggle between Kanban list view and standard table view
  - [x] Build `/dashboard/leads/[id]` lead detail view with status updates and "Convert to Deal" trigger modal
- [x] **Deals Domain**
  - [x] Build `lib/db/queries/deals.ts`
  - [x] Implement `GET|POST|PATCH|DELETE /api/deals` APIs
  - [x] Build `/dashboard/deals` showing pipeline totals per stage in header cards and full deal table list
  - [x] Build `/dashboard/deals/[id]` deal layout featuring a 4-step progress stage stepper, activities, and linked invoices
- [x] **Activities Domain**
  - [x] Build `lib/db/queries/activities.ts`
  - [x] Implement `GET|POST|PATCH|DELETE /api/activities` APIs
  - [x] Build `/dashboard/activities` unified interaction log containing filterable types
  - [x] Build reusable vertical `<ActivityTimeline>` component

---

## ⚙️ Sprint 4 — Operations Module (Day 5)
- [x] **Tasks Management**
  - [x] Build `lib/db/queries/tasks.ts`
  - [x] Implement `GET|POST|PATCH|DELETE /api/tasks` APIs
  - [x] Build `/dashboard/tasks` 3-column Kanban dashboard (Pending, In Progress, Completed) with priority badge rendering
- [x] **Billing & Invoices**
  - [x] Build `lib/db/queries/invoices.ts`
  - [x] Implement `GET|POST|PATCH|DELETE /api/invoices` APIs
  - [x] Build `/dashboard/invoices` page summarizing draft, sent, paid, and overdue outstanding balances
  - [x] Build `/dashboard/invoices/[id]` detail view showing link to deal, issued details, and payment collection CTAs
- [x] **Payments Processing**
  - [x] Build `lib/db/queries/payments.ts`
  - [x] Implement `GET|POST|DELETE /api/payments` APIs
  - [x] Build `/dashboard/payments` transaction table with "Record Payment" side drawer component
- [x] **Follow-ups Scheduler**
  - [x] Build `lib/db/queries/followups.ts`
  - [x] Implement `GET|POST|PATCH|DELETE /api/followups` APIs
  - [x] Build `/dashboard/followups` containing tabbed Upcoming & Past logs, and outcome logging inline forms

---

## 🎨 Sprint 5 — Dashboard & Polish (Days 6–7)
- [x] **Statistics Aggregation**
  - [x] Implement `GET /api/stats/dashboard` consolidating 6 KPI calculations and 4 recharts datasets in a single optimized DB fetch
- [x] **Interactive Dashboard**
  - [x] Build `/dashboard` main page with KPI cards (total leads, open deals, closed revenue, outstanding invoices, tasks today, upcoming follow-ups)
  - [x] Render Lead Funnel, Stage Pipeline, Revenue Over Time, and Activity Breakdown graphs using `<recharts>`
- [x] **User Experience (UX) Polish**
  - [x] Design custom `<EmptyState>` layouts to replace blank tables
  - [x] Configure skeleton loading grids using shadcn `<Skeleton>` wrapper
  - [x] Connect custom `<ConfirmDialog>` component to all delete/destructive clicks
  - [x] Standardize API response error states (400 Zod, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error)
- [x] **Responsiveness & Shell Configuration**
  - [x] Make layouts fully responsive across mobile drawer overlays and desktop sidebars
  - [x] Setup `QueryClientProvider` and `Toaster` notifications in the root application layout
  - [x] Deploy live project code to Vercel and configure all required `.env` variables
  - [x] Write detailed `/README.md` including quick start commands, system diagrams, and credentials
