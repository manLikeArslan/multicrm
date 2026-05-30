-- Alter roles table to support company scoping for custom defined roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(company_id) ON DELETE CASCADE;

-- Drop the global unique constraint on role_name
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_role_name_key;

-- Add a composite unique constraint to enforce uniqueness within each company tenant
ALTER TABLE roles ADD CONSTRAINT roles_role_name_company_unique UNIQUE (role_name, company_id);
