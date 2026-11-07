// ==============================================================================
// FAITH ENGINEERS - DAILY SUPPLIER ATTENDANCE CONFIGURATION (v2.0)
// ==============================================================================

function safeStorageGet(key) {
  try {
    if (typeof localStorage !== 'undefined' && localStorage !== null) {
      return localStorage.getItem(key) || '';
    }
  } catch (e) {
    console.warn('LocalStorage access suppressed:', e);
  }
  return '';
}

function safeStorageSet(key, value) {
  try {
    if (typeof localStorage !== 'undefined' && localStorage !== null) {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn('LocalStorage write suppressed:', e);
  }
}

const FAITH_CONFIG = {
  APP_NAME: 'Faith Engineers - Daily Supplier Attendance',
  COMPANY_NAME: 'Faith Engineers',
  VERSION: '2.0.0',
  STORAGE_PREFIX: 'faith_attendance_v2_',

  // Supabase Credentials
  SUPABASE_URL: safeStorageGet('FAITH_SUPABASE_URL') || 'https://auogpefvntixexxxkrui.supabase.co',
  SUPABASE_ANON_KEY: safeStorageGet('FAITH_SUPABASE_ANON_KEY') || 'sb_publishable_9NYcFiHZ5AvxCnsrMyynTw_JeSC4NYo',

  // Global Default Calculation Rules
  CALCULATION_RULES: {
    standard_shift_hours: 8.0,
    half_day_min_hours: 4.0,
    ot_grace_minutes: 15,
    ot_rounding_minutes: 30, // 0 = exact, 15 = quarter hr, 30 = half hr
    enable_ot: true
  },

  // Projects Master (Active & Completed)
  DEFAULT_PROJECTS: [
    { code: 'FA-285', title: 'BIW Robotic Welding Line - RH & LH Fixtures', customer: 'Tata Motors Passenger Vehicles', location: 'Pune Plant', status: 'Active' },
    { code: 'FA-286', title: 'Rear Floor Welded Sub-Assembly Line', customer: 'Mahindra & Mahindra', location: 'Chakan Plant', status: 'Active' },
    { code: 'FA-290', title: 'EV Battery Enclosure Automation Cell', customer: 'Tata AutoComp Systems', location: 'Pune Plant', status: 'Active' },
    { code: 'FA-301', title: 'Underbody Main Geometrical Fixtures', customer: 'Maruti Suzuki India Ltd', location: 'Inhouse Bay 2', status: 'Active' },
    { code: 'FA-250', title: 'Completed Pilot Fixture Line (Old)', customer: 'Bajaj Auto Ltd', location: 'Akurdi Plant', status: 'Completed' }
  ],

  // Suppliers Master (With Block Status and Separate Onsite & Inhouse Rates)
  DEFAULT_SUPPLIERS: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      code: 'SUP-01',
      name: 'JBB Automation & Controls',
      contact_person: 'Ganesh More',
      phone: '+91 98221 44551',
      email: 'ganesh@jbbauto.com',
      is_blocked: false,
      is_active: true,
      default_onsite_manday_rate: 950.00,
      default_inhouse_manday_rate: 850.00,
      default_ot_rate: 175.00,
      standard_shift_hours: 8.0,
      ot_rounding_minutes: 30
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      code: 'SUP-02',
      name: 'Sakshi Electricals',
      contact_person: 'Sambhaji Shinde',
      phone: '+91 98222 77882',
      email: 'sambhaji@sakshielec.com',
      is_blocked: false,
      is_active: true,
      default_onsite_manday_rate: 900.00,
      default_inhouse_manday_rate: 800.00,
      default_ot_rate: 160.00,
      standard_shift_hours: 8.0,
      ot_rounding_minutes: 30
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      code: 'SUP-03',
      name: 'Tirupati Engineering Services',
      contact_person: 'Tirupati Rao',
      phone: '+91 98223 99003',
      email: 'info@tirupatieng.com',
      is_blocked: false,
      is_active: true,
      default_onsite_manday_rate: 880.00,
      default_inhouse_manday_rate: 780.00,
      default_ot_rate: 150.00,
      standard_shift_hours: 8.0,
      ot_rounding_minutes: 30
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      code: 'SUP-04',
      name: 'Precision Industrial Wiring',
      contact_person: 'Amit Patil',
      phone: '+91 98224 11223',
      email: 'contact@precisionwiring.com',
      is_blocked: false,
      is_active: true,
      default_onsite_manday_rate: 1000.00,
      default_inhouse_manday_rate: 900.00,
      default_ot_rate: 180.00,
      standard_shift_hours: 8.0,
      ot_rounding_minutes: 30
    }
  ],

  // Supplier Employees Roster (With Blocking, Individual Onsite/Inhouse Rates & Individual Rules)
  DEFAULT_EMPLOYEES: [
    // JBB Automation & Controls
    {
      id: 'emp-01', supplier_id: '11111111-1111-1111-1111-111111111111', employee_code: 'JBB-W01', name: 'Ramesh Pawar', trade: 'Wireman', phone: '+91 97654 00101',
      is_blocked: false, is_enabled: true,
      onsite_manday_rate: 950.00, inhouse_manday_rate: 850.00, ot_rate: 175.00,
      standard_shift_hours: 8.0, half_day_min_hours: 4.0, ot_grace_minutes: 15, ot_rounding_minutes: 30
    },
    {
      id: 'emp-02', supplier_id: '11111111-1111-1111-1111-111111111111', employee_code: 'JBB-W02', name: 'Santosh Kadam', trade: 'Wireman', phone: '+91 97654 00102',
      is_blocked: false, is_enabled: true,
      onsite_manday_rate: 950.00, inhouse_manday_rate: 850.00, ot_rate: 175.00,
      standard_shift_hours: 8.0, half_day_min_hours: 4.0, ot_grace_minutes: 15, ot_rounding_minutes: 30
    },
    {
      id: 'emp-03', supplier_id: '11111111-1111-1111-1111-111111111111', employee_code: 'JBB-F01', name: 'Ajay Jadhav', trade: 'Fitter', phone: '+91 97654 00103',
      is_blocked: false, is_enabled: true,
      onsite_manday_rate: 980.00, inhouse_manday_rate: 880.00, ot_rate: 180.00,
      standard_shift_hours: 8.0, half_day_min_hours: 4.0, ot_grace_minutes: 15, ot_rounding_minutes: 30
    },
    {
      id: 'emp-04', supplier_id: '11111111-1111-1111-1111-111111111111', employee_code: 'JBB-H01', name: 'Deepak Salunkhe', trade: 'Helper', phone: '+91 97654 00104',
      is_blocked: false, is_enabled: true,
      onsite_manday_rate: 750.00, inhouse_manday_rate: 650.00, ot_rate: 130.00,
      standard_shift_hours: 8.0, half_day_min_hours: 4.0, ot_grace_minutes: 15, ot_rounding_minutes: 30
    },
    {
      id: 'emp-05', supplier_id: '11111111-1111-1111-1111-111111111111', employee_code: 'JBB-S01', name: 'Vijay Deshmukh', trade: 'Supervisor', phone: '+91 97654 00105',
      is_blocked: false, is_enabled: true,
      onsite_manday_rate: 1200.00, inhouse_manday_rate: 1100.00, ot_rate: 220.00,
      standard_shift_hours: 8.0, half_day_min_hours: 4.0, ot_grace_minutes: 15, ot_rounding_minutes: 30
    },

    // Sakshi Electricals
    {
      id: 'emp-06', supplier_id: '22222222-2222-2222-2222-222222222222', employee_code: 'SAK-W01', name: 'Kiran Shinde', trade: 'Wireman', phone: '+91 97654 00201',
      is_blocked: false, is_enabled: true,
      onsite_manday_rate: 900.00, inhouse_manday_rate: 800.00, ot_rate: 160.00,
      standard_shift_hours: 8.0, half_day_min_hours: 4.0, ot_grace_minutes: 15, ot_rounding_minutes: 30
    },
    {
      id: 'emp-07', supplier_id: '22222222-2222-2222-2222-222222222222', employee_code: 'SAK-W02', name: 'Pravin Kale', trade: 'Wireman', phone: '+91 97654 00202',
      is_blocked: false, is_enabled: true,
      onsite_manday_rate: 900.00, inhouse_manday_rate: 800.00, ot_rate: 160.00,
      standard_shift_hours: 8.0, half_day_min_hours: 4.0, ot_grace_minutes: 15, ot_rounding_minutes: 30
    },
    {
      id: 'emp-08', supplier_id: '22222222-2222-2222-2222-222222222222', employee_code: 'SAK-H01', name: 'Sachin Gaikwad', trade: 'Helper', phone: '+91 97654 00203',
      is_blocked: false, is_enabled: true,
      onsite_manday_rate: 700.00, inhouse_manday_rate: 600.00, ot_rate: 120.00,
      standard_shift_hours: 8.0, half_day_min_hours: 4.0, ot_grace_minutes: 15, ot_rounding_minutes: 30
    },
    {
      id: 'emp-09', supplier_id: '22222222-2222-2222-2222-222222222222', employee_code: 'SAK-T01', name: 'Manoj Bhosale', trade: 'Controls Tech', phone: '+91 97654 00204',
      is_blocked: false, is_enabled: true,
      onsite_manday_rate: 1100.00, inhouse_manday_rate: 1000.00, ot_rate: 200.00,
      standard_shift_hours: 8.0, half_day_min_hours: 4.0, ot_grace_minutes: 15, ot_rounding_minutes: 30
    },

    // Tirupati Engineering Services
    {
      id: 'emp-10', supplier_id: '33333333-3333-3333-3333-333333333333', employee_code: 'TIR-F01', name: 'Mahesh Chavan', trade: 'Fitter', phone: '+91 97654 00301',
      is_blocked: false, is_enabled: true,
      onsite_manday_rate: 880.00, inhouse_manday_rate: 780.00, ot_rate: 150.00,
      standard_shift_hours: 8.0, half_day_min_hours: 4.0, ot_grace_minutes: 15, ot_rounding_minutes: 30
    },
    {
      id: 'emp-11', supplier_id: '33333333-3333-3333-3333-333333333333', employee_code: 'TIR-F02', name: 'Gopal Rathi', trade: 'Fitter', phone: '+91 97654 00302',
      is_blocked: false, is_enabled: true,
      onsite_manday_rate: 880.00, inhouse_manday_rate: 780.00, ot_rate: 150.00,
      standard_shift_hours: 8.0, half_day_min_hours: 4.0, ot_grace_minutes: 15, ot_rounding_minutes: 30
    },
    {
      id: 'emp-12', supplier_id: '33333333-3333-3333-3333-333333333333', employee_code: 'TIR-W01', name: 'Dattatray Mane', trade: 'Welder', phone: '+91 97654 00303',
      is_blocked: false, is_enabled: true,
      onsite_manday_rate: 920.00, inhouse_manday_rate: 820.00, ot_rate: 165.00,
      standard_shift_hours: 8.0, half_day_min_hours: 4.0, ot_grace_minutes: 15, ot_rounding_minutes: 30
    },
    {
      id: 'emp-13', supplier_id: '33333333-3333-3333-3333-333333333333', employee_code: 'TIR-H01', name: 'Sunil Jagtap', trade: 'Helper', phone: '+91 97654 00304',
      is_blocked: false, is_enabled: true,
      onsite_manday_rate: 700.00, inhouse_manday_rate: 600.00, ot_rate: 120.00,
      standard_shift_hours: 8.0, half_day_min_hours: 4.0, ot_grace_minutes: 15, ot_rounding_minutes: 30
    }
  ],

  // User Master with Authorisation Matrix & Activation Status
  DEFAULT_USERS: [
    {
      id: 'usr-01', email: 'admin@faithengineers.com', password_hash: 'admin123', full_name: 'Faith App Admin', employee_code: 'FE-ADM-01', role: 'admin', phone: '+91 98220 00001',
      is_active: true,
      permissions: {
        can_mark_attendance: true,
        can_view_dashboard: true,
        can_view_reports: true,
        can_export_reports: true,
        can_manage_suppliers: true,
        can_manage_projects: true,
        can_manage_users: true,
        can_manage_rules: true,
        can_approve_backdated: true
      }
    },
    {
      id: 'usr-manager-01', email: 'manager@faithengineers.com', password_hash: 'manager123', full_name: 'Faith Plant Manager', employee_code: 'FE-MGR-01', role: 'management', phone: '+91 98220 00099',
      is_active: true,
      permissions: {
        can_mark_attendance: true,
        can_view_dashboard: true,
        can_view_reports: true,
        can_export_reports: true,
        can_manage_suppliers: true,
        can_manage_projects: true,
        can_manage_users: true,
        can_manage_rules: true,
        can_approve_backdated: true
      }
    },
    {
      id: 'usr-02', email: 'puttraj@faithengineers.com', password_hash: 'pass123', full_name: 'Puttraj Hajnale (Execution Lead)', employee_code: 'FE-SUP-01', role: 'supervisor', phone: '+91 98220 00002',
      is_active: true,
      permissions: {
        can_mark_attendance: true,
        can_view_dashboard: true,
        can_view_reports: true,
        can_export_reports: true,
        can_manage_suppliers: false,
        can_manage_projects: false,
        can_manage_users: false,
        can_manage_rules: false,
        can_approve_backdated: false
      }
    },
    {
      id: 'usr-03', email: 'rajesh@faithengineers.com', password_hash: 'pass123', full_name: 'Rajesh Sharma (Site Supervisor)', employee_code: 'FE-SUP-02', role: 'supervisor', phone: '+91 98220 00003',
      is_active: true,
      permissions: {
        can_mark_attendance: true,
        can_view_dashboard: true,
        can_view_reports: true,
        can_export_reports: false,
        can_manage_suppliers: false,
        can_manage_projects: false,
        can_manage_users: false,
        can_manage_rules: false
      }
    },
    {
      id: 'usr-04', email: 'mahesh@faithengineers.com', password_hash: 'pass123', full_name: 'Mahesh Shinde (Quality & Site Sup)', employee_code: 'FE-SUP-03', role: 'supervisor', phone: '+91 98220 00004',
      is_active: true,
      permissions: {
        can_mark_attendance: true,
        can_view_dashboard: true,
        can_view_reports: true,
        can_export_reports: true,
        can_manage_suppliers: false,
        can_manage_projects: false,
        can_manage_users: false,
        can_manage_rules: false
      }
    },
    {
      id: 'usr-05', email: 'supervisor1@faithengineers.com', password_hash: 'pass123', full_name: 'Site Supervisor 1', employee_code: 'FE-SUP-04', role: 'supervisor', phone: '+91 98220 00005',
      is_active: true,
      permissions: {
        can_mark_attendance: true,
        can_view_dashboard: true,
        can_view_reports: false,
        can_export_reports: false,
        can_manage_suppliers: false,
        can_manage_projects: false,
        can_manage_users: false,
        can_manage_rules: false
      }
    }
  ]
};

window.FAITH_CONFIG = FAITH_CONFIG;
