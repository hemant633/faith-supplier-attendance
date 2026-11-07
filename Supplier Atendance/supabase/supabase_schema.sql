-- ==============================================================================
-- FAITH ENGINEERS - DAILY SUPPLIER ATTENDANCE & MANPOWER DATABASE SCHEMA (v2.1)
-- Optimized for Supabase PostgreSQL with Real-Time Subscriptions & RLS
-- Updated with:
-- 1. Date selection provision for past dates with default = current date
-- 2. Retroactive / Past-date Manager Approval Workflow (is_backdated & approval_status)
-- 3. Supplier & Employee Blocking System
-- 4. Project Completion Lifecycle Visibility Filters
-- 5. Separate Onsite & Inhouse Manday Rates (Supplier & Employee specific)
-- 6. Employee-specific OT Calculation Rules & Rates
-- 7. User Master Authorization Matrix & Activation/Deactivation
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & AUTHORIZATION MATRIX MASTER
CREATE TABLE IF NOT EXISTS public.faith_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL DEFAULT 'faith123',
    full_name TEXT NOT NULL,
    employee_code TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'supervisor', -- 'admin', 'supervisor', 'management'
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE, -- User Activation / Deactivation facility
    permissions JSONB DEFAULT '{
      "can_mark_attendance": true,
      "can_view_dashboard": true,
      "can_view_reports": true,
      "can_export_reports": false,
      "can_manage_suppliers": false,
      "can_manage_projects": false,
      "can_manage_users": false,
      "can_manage_rules": false,
      "can_approve_backdated": false
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROJECTS MASTER (Completed projects hidden from attendance marking)
CREATE TABLE IF NOT EXISTS public.faith_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    customer TEXT NOT NULL,
    location TEXT DEFAULT 'Pune, Maharashtra',
    status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Completed', 'On Hold'
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CALCULATION RULES MASTER
CREATE TABLE IF NOT EXISTS public.faith_calculation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name TEXT UNIQUE NOT NULL DEFAULT 'Standard Faith Rule',
    standard_shift_hours NUMERIC(4,2) NOT NULL DEFAULT 8.0,
    half_day_min_hours NUMERIC(4,2) NOT NULL DEFAULT 4.0,
    ot_grace_minutes INTEGER NOT NULL DEFAULT 15,
    ot_rounding_minutes INTEGER NOT NULL DEFAULT 30, -- 15, 30, 60 or 0 (exact)
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUPPLIERS MASTER (With Block status and Separate Onsite & Inhouse Rates)
CREATE TABLE IF NOT EXISTS public.faith_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE, -- Block Supplier Feature
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    default_onsite_manday_rate NUMERIC(10,2) NOT NULL DEFAULT 950.00,  -- Separate Onsite Rate
    default_inhouse_manday_rate NUMERIC(10,2) NOT NULL DEFAULT 850.00, -- Separate Inhouse Rate
    default_ot_rate NUMERIC(10,2) NOT NULL DEFAULT 160.00,
    standard_shift_hours NUMERIC(4,2) NOT NULL DEFAULT 8.0,
    ot_rounding_minutes INTEGER NOT NULL DEFAULT 30,
    block_reason TEXT,
    blocked_at TIMESTAMPTZ,
    blocked_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUPPLIER EMPLOYEES / MANPOWER ROSTER (With Employee Blocking & Specific Rates/Rules)
CREATE TABLE IF NOT EXISTS public.faith_supplier_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES public.faith_suppliers(id) ON DELETE CASCADE,
    employee_code TEXT,
    name TEXT NOT NULL,
    trade TEXT NOT NULL DEFAULT 'Fitter', -- 'Fitter', 'Welder', 'Wireman', 'Helper', 'Supervisor', 'Controls Tech'
    phone TEXT,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE, -- Block Specific Employee Feature
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,  -- Enable / Disable visibility
    -- Specific Rates for this individual employee
    onsite_manday_rate NUMERIC(10,2) NOT NULL DEFAULT 950.00,
    inhouse_manday_rate NUMERIC(10,2) NOT NULL DEFAULT 850.00,
    ot_rate NUMERIC(10,2) NOT NULL DEFAULT 160.00,
    -- Employee-Specific OT & Manday Calculation Rules
    standard_shift_hours NUMERIC(4,2) NOT NULL DEFAULT 8.0,
    half_day_min_hours NUMERIC(4,2) NOT NULL DEFAULT 4.0,
    ot_grace_minutes INTEGER NOT NULL DEFAULT 15,
    ot_rounding_minutes INTEGER NOT NULL DEFAULT 30,
    block_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ATTENDANCE SESSIONS & LOGS (With Retroactive / Past-date Manager Approvals)
CREATE TABLE IF NOT EXISTS public.faith_attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE, -- Selected Date (Defaults to CURRENT_DATE, can be previous date)
    project_code TEXT NOT NULL REFERENCES public.faith_projects(code) ON DELETE CASCADE,
    project_title TEXT,
    location_type TEXT NOT NULL DEFAULT 'Onsite', -- 'Onsite', 'Inhouse'
    supplier_id UUID NOT NULL REFERENCES public.faith_suppliers(id) ON DELETE CASCADE,
    supplier_name TEXT NOT NULL,
    employee_id UUID NOT NULL REFERENCES public.faith_supplier_employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    trade TEXT,
    in_time TEXT NOT NULL, -- Format: 'HH:mm'
    out_time TEXT,         -- Format: 'HH:mm' (NULL when currently checked-in)
    status TEXT NOT NULL DEFAULT 'WORKING', -- 'WORKING', 'COMPLETED'
    hours_worked NUMERIC(5,2) DEFAULT 0.0,
    mandays NUMERIC(4,2) DEFAULT 0.0,
    ot_hours NUMERIC(5,2) DEFAULT 0.0,
    manday_rate NUMERIC(10,2) NOT NULL DEFAULT 850.00, -- Applied rate (Onsite or Inhouse)
    ot_rate NUMERIC(10,2) NOT NULL DEFAULT 160.00,
    manday_cost NUMERIC(10,2) DEFAULT 0.0,
    ot_cost NUMERIC(10,2) DEFAULT 0.0,
    total_cost NUMERIC(10,2) DEFAULT 0.0,
    activity_description TEXT, -- Mandatory when marking OUT time!
    marked_by_supervisor TEXT NOT NULL,
    marked_by_user_id UUID,
    
    -- MANAGER APPROVAL WORKFLOW FOR BACKDATED ATTENDANCE & >14H SHIFTS
    is_backdated BOOLEAN NOT NULL DEFAULT FALSE, -- True if date < creation date
    overtime_exceeded_14h BOOLEAN NOT NULL DEFAULT FALSE, -- True if shift duration > 14.0 hours
    forgotten_outpunch_resolved BOOLEAN NOT NULL DEFAULT FALSE, -- True if resolved retroactively
    approval_status TEXT NOT NULL DEFAULT 'APPROVED', -- 'APPROVED', 'PENDING_APPROVAL', 'REJECTED'
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    approval_remarks TEXT,

    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES & CONSTRAINTS FOR FAST QUERYING & SAME-DAY DOUBLE ATTENDANCE PREVENTION
-- ==============================================================================
-- Strict Restriction: Prevents marking the same employee twice on the same date
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_emp_date ON public.faith_attendance_logs (employee_id, date);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.faith_attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_attendance_project ON public.faith_attendance_logs(project_code);
CREATE INDEX IF NOT EXISTS idx_attendance_supplier ON public.faith_attendance_logs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.faith_attendance_logs(status);
CREATE INDEX IF NOT EXISTS idx_attendance_approval ON public.faith_attendance_logs(approval_status, is_backdated);
CREATE INDEX IF NOT EXISTS idx_supplier_blocked ON public.faith_suppliers(is_blocked);
CREATE INDEX IF NOT EXISTS idx_employee_blocked ON public.faith_supplier_employees(supplier_id, is_blocked, is_enabled);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.faith_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_calculation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_supplier_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_attendance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read all users" ON public.faith_users FOR SELECT USING (true);
CREATE POLICY "Allow anon modify users" ON public.faith_users FOR ALL USING (true);

CREATE POLICY "Allow anon read projects" ON public.faith_projects FOR SELECT USING (true);
CREATE POLICY "Allow anon modify projects" ON public.faith_projects FOR ALL USING (true);

CREATE POLICY "Allow anon read rules" ON public.faith_calculation_rules FOR SELECT USING (true);
CREATE POLICY "Allow anon modify rules" ON public.faith_calculation_rules FOR ALL USING (true);

CREATE POLICY "Allow anon read suppliers" ON public.faith_suppliers FOR SELECT USING (true);
CREATE POLICY "Allow anon modify suppliers" ON public.faith_suppliers FOR ALL USING (true);

CREATE POLICY "Allow anon read employees" ON public.faith_supplier_employees FOR SELECT USING (true);
CREATE POLICY "Allow anon modify employees" ON public.faith_supplier_employees FOR ALL USING (true);

CREATE POLICY "Allow anon read attendance" ON public.faith_attendance_logs FOR SELECT USING (true);
CREATE POLICY "Allow anon modify attendance" ON public.faith_attendance_logs FOR ALL USING (true);

-- ==============================================================================
-- REAL-TIME REPLICATION ENABLING
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'faith_attendance_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.faith_attendance_logs;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'faith_suppliers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.faith_suppliers;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'faith_supplier_employees'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.faith_supplier_employees;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'faith_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.faith_users;
  END IF;
END $$;

-- ==============================================================================
-- INITIAL SEED DATA FOR FAITH ENGINEERS
-- ==============================================================================

-- 1. Default Calculation Rules
INSERT INTO public.faith_calculation_rules (rule_name, standard_shift_hours, half_day_min_hours, ot_grace_minutes, ot_rounding_minutes, is_default)
VALUES ('Standard Faith Rule', 8.0, 4.0, 15, 30, TRUE)
ON CONFLICT (rule_name) DO NOTHING;

-- 2. Default Users with Authorisation Matrix & Activation Status
INSERT INTO public.faith_users (email, password_hash, full_name, employee_code, role, phone, is_active, permissions)
VALUES 
  ('admin@faithengineers.com', 'admin123', 'Faith App Admin', 'FE-ADM-01', 'admin', '+91 98220 00001', TRUE, '{
    "can_mark_attendance": true,
    "can_view_dashboard": true,
    "can_view_reports": true,
    "can_export_reports": true,
    "can_manage_suppliers": true,
    "can_manage_projects": true,
    "can_manage_users": true,
    "can_manage_rules": true,
    "can_approve_backdated": true
  }'::jsonb),
  ('manager@faithengineers.com', 'manager123', 'Faith Plant Manager', 'FE-MGR-01', 'management', '+91 98220 00099', TRUE, '{
    "can_mark_attendance": true,
    "can_view_dashboard": true,
    "can_view_reports": true,
    "can_export_reports": true,
    "can_manage_suppliers": true,
    "can_manage_projects": true,
    "can_manage_users": true,
    "can_manage_rules": true,
    "can_approve_backdated": true
  }'::jsonb),
  ('puttraj@faithengineers.com', 'pass123', 'Puttraj Hajnale (Execution Lead)', 'FE-SUP-01', 'supervisor', '+91 98220 00002', TRUE, '{
    "can_mark_attendance": true,
    "can_view_dashboard": true,
    "can_view_reports": true,
    "can_export_reports": true,
    "can_manage_suppliers": false,
    "can_manage_projects": false,
    "can_manage_users": false,
    "can_manage_rules": false,
    "can_approve_backdated": false
  }'::jsonb),
  ('rajesh@faithengineers.com', 'pass123', 'Rajesh Sharma (Site Supervisor)', 'FE-SUP-02', 'supervisor', '+91 98220 00003', TRUE, '{
    "can_mark_attendance": true,
    "can_view_dashboard": true,
    "can_view_reports": true,
    "can_export_reports": false,
    "can_manage_suppliers": false,
    "can_manage_projects": false,
    "can_manage_users": false,
    "can_manage_rules": false,
    "can_approve_backdated": false
  }'::jsonb),
  ('mahesh@faithengineers.com', 'pass123', 'Mahesh Shinde (Quality & Site Sup)', 'FE-SUP-03', 'supervisor', '+91 98220 00004', TRUE, '{
    "can_mark_attendance": true,
    "can_view_dashboard": true,
    "can_view_reports": true,
    "can_export_reports": true,
    "can_manage_suppliers": false,
    "can_manage_projects": false,
    "can_manage_users": false,
    "can_manage_rules": false,
    "can_approve_backdated": false
  }'::jsonb),
  ('supervisor1@faithengineers.com', 'pass123', 'Site Supervisor 1', 'FE-SUP-04', 'supervisor', '+91 98220 00005', TRUE, '{
    "can_mark_attendance": true,
    "can_view_dashboard": true,
    "can_view_reports": false,
    "can_export_reports": false,
    "can_manage_suppliers": false,
    "can_manage_projects": false,
    "can_manage_users": false,
    "can_manage_rules": false,
    "can_approve_backdated": false
  }'::jsonb)
ON CONFLICT (email) DO NOTHING;

-- 3. Projects Master (Active vs Completed)
INSERT INTO public.faith_projects (code, title, customer, location, status)
VALUES 
  ('FA-285', 'BIW Robotic Welding Line - RH & LH Fixtures', 'Tata Motors Passenger Vehicles', 'Pune Plant', 'Active'),
  ('FA-286', 'Rear Floor Welded Sub-Assembly Line', 'Mahindra & Mahindra', 'Chakan Plant', 'Active'),
  ('FA-290', 'EV Battery Enclosure Automation Cell', 'Tata AutoComp Systems', 'Pune Plant', 'Active'),
  ('FA-301', 'Underbody Main Geometrical Fixtures', 'Maruti Suzuki India Ltd', 'Inhouse Bay 2', 'Active'),
  ('FA-250', 'Completed Pilot Fixture Line (Old)', 'Bajaj Auto Ltd', 'Akurdi Plant', 'Completed')
ON CONFLICT (code) DO NOTHING;

-- 4. Suppliers Master (With Block Support and Separate Onsite & Inhouse Rates)
INSERT INTO public.faith_suppliers (id, code, name, contact_person, phone, email, is_blocked, is_active, default_onsite_manday_rate, default_inhouse_manday_rate, default_ot_rate, standard_shift_hours, ot_rounding_minutes)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'SUP-01', 'JBB Automation & Controls', 'Ganesh More', '+91 98221 44551', 'ganesh@jbbauto.com', FALSE, TRUE, 950.00, 850.00, 175.00, 8.0, 30),
  ('22222222-2222-2222-2222-222222222222', 'SUP-02', 'Sakshi Electricals', 'Sambhaji Shinde', '+91 98222 77882', 'sambhaji@sakshielec.com', FALSE, TRUE, 900.00, 800.00, 160.00, 8.0, 30),
  ('33333333-3333-3333-3333-333333333333', 'SUP-03', 'Tirupati Engineering Services', 'Tirupati Rao', '+91 98223 99003', 'info@tirupatieng.com', FALSE, TRUE, 880.00, 780.00, 150.00, 8.0, 30),
  ('44444444-4444-4444-4444-444444444444', 'SUP-04', 'Precision Industrial Wiring', 'Amit Patil', '+91 98224 11223', 'contact@precisionwiring.com', FALSE, TRUE, 1000.00, 900.00, 180.00, 8.0, 30)
ON CONFLICT (code) DO NOTHING;

-- 5. Supplier Employees (With Employee Blocking & Employee-Specific Rates/Rules)
INSERT INTO public.faith_supplier_employees (supplier_id, employee_code, name, trade, phone, is_blocked, is_enabled, onsite_manday_rate, inhouse_manday_rate, ot_rate, standard_shift_hours, half_day_min_hours, ot_grace_minutes, ot_rounding_minutes)
VALUES 
  -- JBB Automation & Controls
  ('11111111-1111-1111-1111-111111111111', 'JBB-W01', 'Ramesh Pawar', 'Wireman', '+91 97654 00101', FALSE, TRUE, 950.00, 850.00, 175.00, 8.0, 4.0, 15, 30),
  ('11111111-1111-1111-1111-111111111111', 'JBB-W02', 'Santosh Kadam', 'Wireman', '+91 97654 00102', FALSE, TRUE, 950.00, 850.00, 175.00, 8.0, 4.0, 15, 30),
  ('11111111-1111-1111-1111-111111111111', 'JBB-F01', 'Ajay Jadhav', 'Fitter', '+91 97654 00103', FALSE, TRUE, 980.00, 880.00, 180.00, 8.0, 4.0, 15, 30),
  ('11111111-1111-1111-1111-111111111111', 'JBB-H01', 'Deepak Salunkhe', 'Helper', '+91 97654 00104', FALSE, TRUE, 750.00, 650.00, 130.00, 8.0, 4.0, 15, 30),
  ('11111111-1111-1111-1111-111111111111', 'JBB-S01', 'Vijay Deshmukh', 'Supervisor', '+91 97654 00105', FALSE, TRUE, 1200.00, 1100.00, 220.00, 8.0, 4.0, 15, 30),
  
  -- Sakshi Electricals
  ('22222222-2222-2222-2222-222222222222', 'SAK-W01', 'Kiran Shinde', 'Wireman', '+91 97654 00201', FALSE, TRUE, 900.00, 800.00, 160.00, 8.0, 4.0, 15, 30),
  ('22222222-2222-2222-2222-222222222222', 'SAK-W02', 'Pravin Kale', 'Wireman', '+91 97654 00202', FALSE, TRUE, 900.00, 800.00, 160.00, 8.0, 4.0, 15, 30),
  ('22222222-2222-2222-2222-222222222222', 'SAK-H01', 'Sachin Gaikwad', 'Helper', '+91 97654 00203', FALSE, TRUE, 700.00, 600.00, 120.00, 8.0, 4.0, 15, 30),
  ('22222222-2222-2222-2222-222222222222', 'SAK-T01', 'Manoj Bhosale', 'Controls Tech', '+91 97654 00204', FALSE, TRUE, 1100.00, 1000.00, 200.00, 8.0, 4.0, 15, 30),

  -- Tirupati Engineering Services
  ('33333333-3333-3333-3333-333333333333', 'TIR-F01', 'Mahesh Chavan', 'Fitter', '+91 97654 00301', FALSE, TRUE, 880.00, 780.00, 150.00, 8.0, 4.0, 15, 30),
  ('33333333-3333-3333-3333-333333333333', 'TIR-F02', 'Gopal Rathi', 'Fitter', '+91 97654 00302', FALSE, TRUE, 880.00, 780.00, 150.00, 8.0, 4.0, 15, 30),
  ('33333333-3333-3333-3333-333333333333', 'TIR-W01', 'Dattatray Mane', 'Welder', '+91 97654 00303', FALSE, TRUE, 920.00, 820.00, 165.00, 8.0, 4.0, 15, 30),
  ('33333333-3333-3333-3333-333333333333', 'TIR-H01', 'Sunil Jagtap', 'Helper', '+91 97654 00304', FALSE, TRUE, 700.00, 600.00, 120.00, 8.0, 4.0, 15, 30)
ON CONFLICT DO NOTHING;
