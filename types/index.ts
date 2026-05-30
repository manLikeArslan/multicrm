export type CompanyStatus = 'active' | 'suspended' | 'cancelled';
export type UserStatus = 'active' | 'inactive';
export type ContactSource = 'referral' | 'web' | 'cold_outreach' | 'social';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'lost';
export type DealStage = 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type ActivityType = 'call' | 'email' | 'meeting' | 'note';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export type PaymentMethod = 'bank_transfer' | 'card' | 'cash' | 'cheque';
export type FollowupOutcome = 'reached' | 'no_answer' | 'rescheduled' | 'converted';

export interface SubscriptionPlan {
  plan_id: number;
  plan_name: string;
  price_per_month: number;
  max_users: number;
  max_contacts: number;
  features?: string | null;
  created_at?: Date;
}

export interface Company {
  company_id: number;
  plan_id: number;
  company_name: string;
  industry?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  status: CompanyStatus;
  created_at?: Date;
}

export interface Role {
  role_id: number;
  role_name: 'admin' | 'manager' | 'sales_rep';
  description?: string | null;
}

export interface User {
  user_id: number;
  company_id: number;
  role_id: number;
  full_name: string;
  email: string;
  password_hash: string;
  phone?: string | null;
  status: UserStatus;
  created_at?: Date;
}

export interface Contact {
  contact_id: number;
  company_id: number;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  source: ContactSource;
  created_by?: number | null;
  created_at?: Date;
}

export interface Lead {
  lead_id: number;
  contact_id: number;
  company_id: number;
  assigned_to?: number | null;
  status: LeadStatus;
  notes?: string | null;
  created_at?: Date;
}

export interface Deal {
  deal_id: number;
  lead_id?: number | null;
  company_id: number;
  assigned_to?: number | null;
  deal_title: string;
  value?: number | null;
  stage: DealStage;
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  created_at?: Date;
}

export interface Activity {
  activity_id: number;
  deal_id?: number | null;
  contact_id?: number | null;
  company_id: number;
  performed_by?: number | null;
  activity_type: ActivityType;
  summary?: string | null;
  activity_date?: Date;
}

export interface Task {
  task_id: number;
  company_id: number;
  assigned_to?: number | null;
  deal_id?: number | null;
  contact_id?: number | null;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at?: Date;
}

export interface Invoice {
  invoice_id: number;
  deal_id: number;
  company_id: number;
  issued_by?: number | null;
  total_amount: number;
  due_date?: string | null;
  status: InvoiceStatus;
  created_at?: Date;
}

export interface Payment {
  payment_id: number;
  invoice_id: number;
  company_id: number;
  amount_paid: number;
  payment_date: string;
  payment_method: PaymentMethod;
  notes?: string | null;
}

export interface FollowupLog {
  followup_id: number;
  company_id: number;
  contact_id: number;
  lead_id?: number | null;
  deal_id?: number | null;
  scheduled_by?: number | null;
  scheduled_date: string;
  outcome?: FollowupOutcome | null;
  next_action?: string | null;
  created_at?: Date;
}

// NextAuth custom Session & User
export interface SessionUser {
  userId: number;
  companyId: number;
  companyName: string;
  roleId: number;
  roleName: 'admin' | 'manager' | 'sales_rep';
  fullName: string;
  email: string;
}
