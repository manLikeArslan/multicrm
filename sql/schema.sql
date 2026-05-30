-- Drop tables if they exist (for easy resetting/seeding)
DROP TABLE IF EXISTS followup_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Drop types if they exist
DROP TYPE IF EXISTS company_status CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS contact_source CASCADE;
DROP TYPE IF EXISTS lead_status CASCADE;
DROP TYPE IF EXISTS deal_stage CASCADE;
DROP TYPE IF EXISTS activity_type CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS invoice_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS followup_outcome CASCADE;

-- Create custom types
CREATE TYPE company_status AS ENUM ('active', 'suspended', 'cancelled');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE contact_source AS ENUM ('referral', 'web', 'cold_outreach', 'social');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'lost');
CREATE TYPE deal_stage AS ENUM ('proposal', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'note');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');
CREATE TYPE payment_method AS ENUM ('bank_transfer', 'card', 'cash', 'cheque');
CREATE TYPE followup_outcome AS ENUM ('reached', 'no_answer', 'rescheduled', 'converted');

-- 1. subscription_plans
CREATE TABLE subscription_plans (
    plan_id SERIAL PRIMARY KEY,
    plan_name VARCHAR(50) NOT NULL UNIQUE,
    price_per_month DECIMAL(10,2) NOT NULL,
    max_users INT NOT NULL,
    max_contacts INT NOT NULL,
    features TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. companies
CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    plan_id INT REFERENCES subscription_plans(plan_id) ON DELETE RESTRICT,
    company_name VARCHAR(100) NOT NULL,
    industry VARCHAR(100),
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    country VARCHAR(50),
    status company_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. roles
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    description TEXT,
    company_id INT REFERENCES companies(company_id) ON DELETE CASCADE,
    CONSTRAINT roles_role_name_company_unique UNIQUE (role_name, company_id)
);

-- 4. users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    status user_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. contacts
CREATE TABLE contacts (
    contact_id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    job_title VARCHAR(100),
    source contact_source DEFAULT 'web',
    created_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. leads
CREATE TABLE leads (
    lead_id SERIAL PRIMARY KEY,
    contact_id INT NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
    company_id INT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    assigned_to INT REFERENCES users(user_id) ON DELETE SET NULL,
    status lead_status DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. deals
CREATE TABLE deals (
    deal_id SERIAL PRIMARY KEY,
    lead_id INT REFERENCES leads(lead_id) ON DELETE SET NULL,
    company_id INT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    assigned_to INT REFERENCES users(user_id) ON DELETE SET NULL,
    deal_title VARCHAR(150) NOT NULL,
    value DECIMAL(12,2),
    stage deal_stage DEFAULT 'proposal',
    expected_close_date DATE,
    actual_close_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. activities
CREATE TABLE activities (
    activity_id SERIAL PRIMARY KEY,
    deal_id INT REFERENCES deals(deal_id) ON DELETE CASCADE,
    contact_id INT REFERENCES contacts(contact_id) ON DELETE CASCADE,
    company_id INT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    performed_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    activity_type activity_type DEFAULT 'note',
    summary TEXT,
    activity_date TIMESTAMP DEFAULT NOW()
);

-- 9. tasks
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    assigned_to INT REFERENCES users(user_id) ON DELETE SET NULL,
    deal_id INT REFERENCES deals(deal_id) ON DELETE CASCADE,
    contact_id INT REFERENCES contacts(contact_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    due_date DATE,
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 10. invoices
CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,
    deal_id INT REFERENCES deals(deal_id) ON DELETE RESTRICT,
    company_id INT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    issued_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    due_date DATE,
    status invoice_status DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 11. payments
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    company_id INT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method payment_method NOT NULL DEFAULT 'bank_transfer',
    notes TEXT
);

-- 12. followup_logs
CREATE TABLE followup_logs (
    followup_id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    contact_id INT NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
    lead_id INT REFERENCES leads(lead_id) ON DELETE CASCADE,
    deal_id INT REFERENCES deals(deal_id) ON DELETE CASCADE,
    scheduled_by INT REFERENCES users(user_id) ON DELETE SET NULL,
    scheduled_date TIMESTAMP NOT NULL,
    outcome followup_outcome,
    next_action TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
