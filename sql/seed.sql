-- Seed subscription plans
INSERT INTO subscription_plans (plan_id, plan_name, price_per_month, max_users, max_contacts, features) VALUES
(1, 'Free', 0.00, 3, 50, 'Basic CRM access, lead & task tracking'),
(2, 'Growth', 49.00, 10, 500, 'Growth metrics, lead scoring, invoice generation, automated followups'),
(3, 'Enterprise', 149.00, 9999, 99999, 'Unlimited access, multi-tenant isolation, priority support, complete operations module')
ON CONFLICT (plan_id) DO NOTHING;

SELECT setval('subscription_plans_plan_id_seq', (SELECT MAX(plan_id) FROM subscription_plans));

-- Seed roles
INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'admin', 'Full system configuration, user management, and billing access'),
(2, 'manager', 'Pipeline supervision, data management, and operational controls'),
(3, 'sales_rep', 'Lead nurturing, deal closing, tasks assignment, and activity logging')
ON CONFLICT (role_id) DO NOTHING;

SELECT setval('roles_role_id_seq', (SELECT MAX(role_id) FROM roles));

-- Seed companies
INSERT INTO companies (company_id, plan_id, company_name, industry, email, phone, address, city, country, status) VALUES
(1, 3, 'Nexus Data Corp', 'Software & Technology', 'info@nexusdata.io', '+1-555-0199', '100 Innovation Way', 'San Francisco', 'United States', 'active'),
(2, 2, 'Aura Logistics', 'Transportation & Logistics', 'contact@auralogistics.com', '+1-555-0244', '400 Transit Boulevard', 'Chicago', 'United States', 'active')
ON CONFLICT (company_id) DO NOTHING;

SELECT setval('companies_company_id_seq', (SELECT MAX(company_id) FROM companies));

-- Seed users (password_hash is bcrypt hash of 'Admin1234!')
-- Bcrypt hash: $2b$10$c0FtK04NTI5o992lP.OrLuALWPA8CmIx4E8Yc1Ybf5Cnf.VNN9rWO
INSERT INTO users (user_id, company_id, role_id, full_name, email, password_hash, phone, status) VALUES
-- Nexus Data Corp Users (1 admin, 2 managers, 2 sales reps)
(1, 1, 1, 'Nexus Admin', 'admin@nexusdata.io', '$2b$10$c0FtK04NTI5o992lP.OrLuALWPA8CmIx4E8Yc1Ybf5Cnf.VNN9rWO', '+1-555-0101', 'active'),
(2, 1, 2, 'Sarah Jenkins', 'sarah.j@nexusdata.io', '$2b$10$c0FtK04NTI5o992lP.OrLuALWPA8CmIx4E8Yc1Ybf5Cnf.VNN9rWO', '+1-555-0102', 'active'),
(3, 1, 2, 'Robert Chen', 'robert.c@nexusdata.io', '$2b$10$c0FtK04NTI5o992lP.OrLuALWPA8CmIx4E8Yc1Ybf5Cnf.VNN9rWO', '+1-555-0103', 'active'),
(4, 1, 3, 'Alice Smith', 'alice.s@nexusdata.io', '$2b$10$c0FtK04NTI5o992lP.OrLuALWPA8CmIx4E8Yc1Ybf5Cnf.VNN9rWO', '+1-555-0104', 'active'),
(5, 1, 3, 'David Miller', 'david.m@nexusdata.io', '$2b$10$c0FtK04NTI5o992lP.OrLuALWPA8CmIx4E8Yc1Ybf5Cnf.VNN9rWO', '+1-555-0105', 'active'),

-- Aura Logistics Users (1 admin, 2 sales reps)
(6, 2, 1, 'Aura Admin', 'admin@auralogistics.com', '$2b$10$c0FtK04NTI5o992lP.OrLuALWPA8CmIx4E8Yc1Ybf5Cnf.VNN9rWO', '+1-555-0201', 'active'),
(7, 2, 3, 'James Wilson', 'james.w@auralogistics.com', '$2b$10$c0FtK04NTI5o992lP.OrLuALWPA8CmIx4E8Yc1Ybf5Cnf.VNN9rWO', '+1-555-0202', 'active'),
(8, 2, 3, 'Emily Taylor', 'emily.t@auralogistics.com', '$2b$10$c0FtK04NTI5o992lP.OrLuALWPA8CmIx4E8Yc1Ybf5Cnf.VNN9rWO', '+1-555-0203', 'active')
ON CONFLICT (user_id) DO NOTHING;

SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));

-- Seed contacts
INSERT INTO contacts (contact_id, company_id, full_name, email, phone, job_title, source, created_by) VALUES
-- Nexus Data Corp Contacts
(1, 1, 'John Doe', 'john.doe@techcorp.com', '+1-555-1111', 'Engineering Director', 'referral', 4),
(2, 1, 'Jane Doe', 'jane.doe@innovation.com', '+1-555-2222', 'Chief Product Officer', 'web', 4),
(3, 1, 'Michael Brown', 'm.brown@globalretail.com', '+1-555-3333', 'VP of Logistics', 'cold_outreach', 5),
(4, 1, 'William Davis', 'w.davis@financesolutions.com', '+1-555-4444', 'IT Manager', 'social', 5),
(5, 1, 'Mary Wilson', 'm.wilson@healthsystems.com', '+1-555-5555', 'Operations Lead', 'web', 4),

-- Aura Logistics Contacts
(6, 2, 'Charles Miller', 'c.miller@speedyshipping.com', '+1-555-6666', 'Supply Chain VP', 'referral', 7),
(7, 2, 'Patricia Garcia', 'p.garcia@freshfoods.com', '+1-555-7777', 'Director of Procurement', 'web', 7),
(8, 2, 'Linda Martinez', 'l.martinez@heavyindustries.com', '+1-555-8888', 'Global Fleet Supervisor', 'cold_outreach', 8)
ON CONFLICT (contact_id) DO NOTHING;

SELECT setval('contacts_contact_id_seq', (SELECT MAX(contact_id) FROM contacts));

-- Seed leads
INSERT INTO leads (lead_id, contact_id, company_id, assigned_to, status, notes) VALUES
-- Nexus Data Corp Leads
(1, 1, 1, 4, 'new', 'Interested in our enterprise analytics stack.'),
(2, 2, 1, 4, 'contacted', 'Met at technology conference. Emailed follow-up details.'),
(3, 3, 1, 5, 'qualified', 'Validated requirements and budget alignment for global tracking modules.'),
(4, 4, 1, 5, 'lost', 'Decision postponed until next budget quarter.'),

-- Aura Logistics Leads
(5, 6, 2, 7, 'qualified', 'Requires reliable multi-modal shipping rates across Midwest.'),
(6, 7, 2, 8, 'new', 'Submitted web form requesting immediate cargo quotation.')
ON CONFLICT (lead_id) DO NOTHING;

SELECT setval('leads_lead_id_seq', (SELECT MAX(lead_id) FROM leads));

-- Seed deals
INSERT INTO deals (deal_id, lead_id, company_id, assigned_to, deal_title, value, stage, expected_close_date, actual_close_date) VALUES
-- Nexus Data Corp Deals
(1, 3, 1, 5, 'Global Analytics Rollout', 45000.00, 'negotiation', '2026-07-15', NULL),
(2, 2, 1, 4, 'Enterprise Innovation Suite', 25000.00, 'proposal', '2026-08-30', NULL),
(3, 1, 1, 4, 'TechCorp Basic Implementation', 12000.00, 'closed_won', '2026-05-20', '2026-05-20'),

-- Aura Logistics Deals
(4, 5, 2, 7, 'Midwest Fleet Outsourcing', 78000.00, 'closed_won', '2026-05-25', '2026-05-26')
ON CONFLICT (deal_id) DO NOTHING;

SELECT setval('deals_deal_id_seq', (SELECT MAX(deal_id) FROM deals));

-- Seed activities
INSERT INTO activities (activity_id, deal_id, contact_id, company_id, performed_by, activity_type, summary, activity_date) VALUES
-- Nexus
(1, 1, 3, 1, 5, 'call', 'Detailed review of pricing model. Customer requested SLA template.', NOW() - INTERVAL '2 days'),
(2, 2, 2, 1, 4, 'meeting', 'Initial scoping workshop with engineering team.', NOW() - INTERVAL '5 days'),
(3, 3, 1, 1, 4, 'email', 'Sent contract documents and onboarding checklist.', NOW() - INTERVAL '10 days'),

-- Aura
(4, 4, 6, 2, 7, 'call', 'Finalized rate sheet adjustments. Customer confirmed contract signoff.', NOW() - INTERVAL '3 days')
ON CONFLICT (activity_id) DO NOTHING;

SELECT setval('activities_activity_id_seq', (SELECT MAX(activity_id) FROM activities));

-- Seed tasks
INSERT INTO tasks (task_id, company_id, assigned_to, deal_id, contact_id, title, description, due_date, priority, status) VALUES
-- Nexus
(1, 1, 5, 1, 3, 'Submit SLA Draft', 'Complete custom service level agreement changes and submit to client.', CURRENT_DATE + 3, 'high', 'in_progress'),
(2, 1, 4, 2, 2, 'Prepare Technical Spec', 'Draft custom architectural integration outline for CPO review.', CURRENT_DATE + 5, 'medium', 'pending'),
(3, 1, 4, 3, 1, 'Schedule Kickoff Session', 'Coordinate calendars for the client onboarding kickoff meeting.', CURRENT_DATE - 1, 'low', 'completed'),

-- Aura
(4, 2, 7, 4, 6, 'Initiate Carrier Matching', 'Assign primary and secondary haulers for the Midwest routing plan.', CURRENT_DATE + 1, 'high', 'in_progress')
ON CONFLICT (task_id) DO NOTHING;

SELECT setval('tasks_task_id_seq', (SELECT MAX(task_id) FROM tasks));

-- Seed invoices
INSERT INTO invoices (invoice_id, deal_id, company_id, issued_by, total_amount, due_date, status) VALUES
-- Nexus
(1, 3, 1, 4, 12000.00, CURRENT_DATE - 10, 'paid'),
(2, 1, 1, 5, 15000.00, CURRENT_DATE + 15, 'draft'),
(3, 2, 1, 4, 25000.00, CURRENT_DATE - 5, 'overdue'),

-- Aura
(4, 4, 2, 7, 78000.00, CURRENT_DATE + 30, 'sent')
ON CONFLICT (invoice_id) DO NOTHING;

SELECT setval('invoices_invoice_id_seq', (SELECT MAX(invoice_id) FROM invoices));

-- Seed payments
INSERT INTO payments (payment_id, invoice_id, company_id, amount_paid, payment_date, payment_method, notes) VALUES
-- Nexus
(1, 1, 1, 12000.00, CURRENT_DATE - 10, 'bank_transfer', 'Full project payment received.')
ON CONFLICT (payment_id) DO NOTHING;

SELECT setval('payments_payment_id_seq', (SELECT MAX(payment_id) FROM payments));

-- Seed followups
INSERT INTO followup_logs (followup_id, company_id, contact_id, lead_id, deal_id, scheduled_by, scheduled_date, outcome, next_action) VALUES
-- Nexus
(1, 1, 1, 1, 3, 4, NOW() + INTERVAL '2 days', NULL, 'Follow up regarding additional user seats.'),
(2, 1, 2, 2, 2, 4, NOW() - INTERVAL '4 days', 'reached', 'Customer agreed to the proposal review scheduled for next week.'),

-- Aura
(3, 2, 7, 6, NULL, 8, NOW() + INTERVAL '1 day', NULL, 'Call contact to gather additional cargo volume requirements.')
ON CONFLICT (followup_id) DO NOTHING;

SELECT setval('followup_logs_followup_id_seq', (SELECT MAX(followup_id) FROM followup_logs));
