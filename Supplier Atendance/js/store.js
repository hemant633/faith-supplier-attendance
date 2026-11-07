// ==============================================================================
// FAITH ENGINEERS - DATA STORE & BUSINESS LOGIC ENGINE (v2.1)
// With Retroactive / Past-date Attendance & Manager Approval Workflow
// ==============================================================================

const FaithStore = {
  state: {
    projects: [],
    suppliers: [],
    employees: [],
    users: [],
    attendance: [],
    rules: {
      standard_shift_hours: 8.0,
      half_day_min_hours: 4.0,
      ot_grace_minutes: 15,
      ot_rounding_minutes: 30,
      enable_ot: true
    },
    isOnline: false,
    lastSyncTime: null
  },

  /**
   * Initialize Store from LocalStorage or Default Config
   */
  async init() {
    this.loadFromLocalStorage();
    
    // Check if Supabase client is available and sync
    const client = window.getSupabaseClient();
    if (client) {
      this.state.isOnline = true;
      await this.syncWithSupabase();
    }

    // Listen to realtime events
    window.addEventListener('faith:realtime-attendance', async () => {
      console.log('⚡ Syncing attendance due to realtime broadcast...');
      await this.syncAttendanceFromSupabase();
      window.dispatchEvent(new CustomEvent('faith:data-changed'));
    });

    window.addEventListener('faith:realtime-masters', async () => {
      console.log('⚡ Syncing masters due to realtime broadcast...');
      await this.syncMastersFromSupabase();
      window.dispatchEvent(new CustomEvent('faith:data-changed'));
    });

    return this.state;
  },

  /**
   * Load data from LocalStorage or seed defaults
   */
  loadFromLocalStorage() {
    const pfx = (window.FAITH_CONFIG && window.FAITH_CONFIG.STORAGE_PREFIX) || 'faith_attendance_v2_';
    
    const storedProjects = localStorage.getItem(pfx + 'projects');
    this.state.projects = storedProjects ? JSON.parse(storedProjects) : [...(window.FAITH_CONFIG.DEFAULT_PROJECTS || [])];

    const storedSuppliers = localStorage.getItem(pfx + 'suppliers');
    this.state.suppliers = storedSuppliers ? JSON.parse(storedSuppliers) : [...(window.FAITH_CONFIG.DEFAULT_SUPPLIERS || [])];

    const storedEmployees = localStorage.getItem(pfx + 'employees');
    this.state.employees = storedEmployees ? JSON.parse(storedEmployees) : [...(window.FAITH_CONFIG.DEFAULT_EMPLOYEES || [])];

    const storedUsers = localStorage.getItem(pfx + 'users');
    let loadedUsers = storedUsers ? JSON.parse(storedUsers) : [...(window.FAITH_CONFIG.DEFAULT_USERS || [])];
    // Ensure default admin & manager exist and have correct permissions
    (window.FAITH_CONFIG.DEFAULT_USERS || []).forEach(defUser => {
      const idx = loadedUsers.findIndex(u => u.email.toLowerCase() === defUser.email.toLowerCase());
      if (idx === -1) {
        loadedUsers.push(defUser);
      } else {
        // Ensure permissions & role are up-to-date for admin/manager
        if (defUser.role === 'admin' || defUser.role === 'management') {
          loadedUsers[idx].role = defUser.role;
          loadedUsers[idx].permissions = { ...defUser.permissions, ...(loadedUsers[idx].permissions || {}) };
          loadedUsers[idx].permissions.can_approve_backdated = true;
          loadedUsers[idx].permissions.can_manage_users = true;
        }
      }
    });
    this.state.users = loadedUsers;

    const storedAttendance = localStorage.getItem(pfx + 'logs');
    this.state.attendance = storedAttendance ? JSON.parse(storedAttendance) : this.generateSampleAttendance();

    const storedRules = localStorage.getItem(pfx + 'rules');
    if (storedRules) {
      this.state.rules = JSON.parse(storedRules);
    } else if (window.FAITH_CONFIG.CALCULATION_RULES) {
      this.state.rules = { ...window.FAITH_CONFIG.CALCULATION_RULES };
    }

    this.saveToLocalStorage();
  },

  saveToLocalStorage() {
    const pfx = (window.FAITH_CONFIG && window.FAITH_CONFIG.STORAGE_PREFIX) || 'faith_attendance_v2_';
    try {
      localStorage.setItem(pfx + 'projects', JSON.stringify(this.state.projects));
      localStorage.setItem(pfx + 'suppliers', JSON.stringify(this.state.suppliers));
      localStorage.setItem(pfx + 'employees', JSON.stringify(this.state.employees));
      localStorage.setItem(pfx + 'users', JSON.stringify(this.state.users));
      localStorage.setItem(pfx + 'logs', JSON.stringify(this.state.attendance));
      localStorage.setItem(pfx + 'rules', JSON.stringify(this.state.rules));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  },

  /**
   * Seed realistic sample attendance records
   */
  generateSampleAttendance() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

    return [
      {
        id: 'att-seed-01',
        date: yesterday,
        project_code: 'FA-285',
        project_title: 'BIW Robotic Welding Line - RH & LH Fixtures',
        location_type: 'Onsite',
        supplier_id: '11111111-1111-1111-1111-111111111111',
        supplier_name: 'JBB Automation & Controls',
        employee_id: 'emp-01',
        employee_name: 'Ramesh Pawar',
        trade: 'Wireman',
        in_time: '08:30',
        out_time: '19:00',
        status: 'COMPLETED',
        hours_worked: 10.5,
        mandays: 1.0,
        ot_hours: 2.5,
        manday_rate: 950.0,
        ot_rate: 175.0,
        manday_cost: 950.0,
        ot_cost: 437.5,
        total_cost: 1387.5,
        activity_description: 'Control panel junction box termination and cable dressing on Jig #02',
        marked_by_supervisor: 'Puttraj Hajnale (Execution Lead)',
        is_backdated: false,
        approval_status: 'APPROVED',
        approved_by: 'Auto (On-Time)'
      },
      // Sample Backdated Attendance (Pending Manager Approval)
      {
        id: 'att-seed-02',
        date: twoDaysAgo,
        project_code: 'FA-301',
        project_title: 'Underbody Main Geometrical Fixtures',
        location_type: 'Inhouse',
        supplier_id: '22222222-2222-2222-2222-222222222222',
        supplier_name: 'Sakshi Electricals',
        employee_id: 'emp-06',
        employee_name: 'Kiran Shinde',
        trade: 'Wireman',
        in_time: '09:00',
        out_time: '17:30',
        status: 'COMPLETED',
        hours_worked: 8.5,
        mandays: 1.0,
        ot_hours: 0.5,
        manday_rate: 800.0,
        ot_rate: 160.0,
        manday_cost: 800.0,
        ot_cost: 80.0,
        total_cost: 880.0,
        activity_description: 'Retroactive log: Sensor routing and optical sensor bracket cable ferruling in Bay 2',
        marked_by_supervisor: 'Rajesh Sharma (Site Supervisor)',
        is_backdated: true,
        approval_status: 'PENDING_APPROVAL',
        approved_by: null,
        approval_remarks: 'Retroactive attendance submitted by supervisor for approval'
      },
      // Sample Forgotten Out-Punch from yesterday (Identified by system)
      {
        id: 'att-seed-forgotten-01',
        date: yesterday,
        project_code: 'FA-286',
        project_title: 'Rear Floor Welded Sub-Assembly Line',
        location_type: 'Onsite',
        supplier_id: '33333333-3333-3333-3333-333333333333',
        supplier_name: 'Tirupati Engineering Services',
        employee_id: 'emp-10',
        employee_name: 'Mahesh Chavan',
        trade: 'Fitter',
        in_time: '08:00',
        out_time: null,
        status: 'WORKING',
        hours_worked: 0.0,
        mandays: 0.0,
        ot_hours: 0.0,
        manday_rate: 880.0,
        ot_rate: 150.0,
        manday_cost: 0.0,
        ot_cost: 0.0,
        total_cost: 0.0,
        activity_description: '',
        marked_by_supervisor: 'Puttraj Hajnale (Execution Lead)',
        is_backdated: true,
        approval_status: 'PENDING_APPROVAL',
        approved_by: null,
        approval_remarks: 'Forgotten out-punch: worker marked IN yesterday but OUT was not punched.'
      },
      {
        id: 'att-seed-03',
        date: today,
        project_code: 'FA-285',
        project_title: 'BIW Robotic Welding Line - RH & LH Fixtures',
        location_type: 'Onsite',
        supplier_id: '11111111-1111-1111-1111-111111111111',
        supplier_name: 'JBB Automation & Controls',
        employee_id: 'emp-01',
        employee_name: 'Ramesh Pawar',
        trade: 'Wireman',
        in_time: '08:30',
        out_time: null,
        status: 'WORKING',
        hours_worked: 0.0,
        mandays: 0.0,
        ot_hours: 0.0,
        manday_rate: 950.0,
        ot_rate: 175.0,
        manday_cost: 0.0,
        ot_cost: 0.0,
        total_cost: 0.0,
        activity_description: '',
        marked_by_supervisor: 'Puttraj Hajnale (Execution Lead)',
        is_backdated: false,
        approval_status: 'APPROVED',
        approved_by: 'Auto (On-Time)'
      }
    ];
  },

  /**
   * Sync All Data with Supabase Cloud
   */
  async syncWithSupabase() {
    const client = window.getSupabaseClient();
    if (!client) return false;

    try {
      await Promise.all([
        this.syncMastersFromSupabase(),
        this.syncAttendanceFromSupabase()
      ]);
      this.state.isOnline = true;
      this.state.lastSyncTime = new Date().toLocaleTimeString();
      return true;
    } catch (err) {
      console.warn('Supabase sync warning:', err);
      return false;
    }
  },

  async syncMastersFromSupabase() {
    const client = window.getSupabaseClient();
    if (!client) return;

    try {
      const [projRes, supRes, empRes, usrRes, ruleRes] = await Promise.all([
        client.from('faith_projects').select('*'),
        client.from('faith_suppliers').select('*'),
        client.from('faith_supplier_employees').select('*'),
        client.from('faith_users').select('*'),
        client.from('faith_calculation_rules').select('*').limit(1)
      ]);

      if (!projRes.error && projRes.data && projRes.data.length > 0) this.state.projects = projRes.data;
      if (!supRes.error && supRes.data && supRes.data.length > 0) this.state.suppliers = supRes.data;
      if (!empRes.error && empRes.data && empRes.data.length > 0) this.state.employees = empRes.data;
      if (!usrRes.error && usrRes.data && usrRes.data.length > 0) this.state.users = usrRes.data;
      if (!ruleRes.error && ruleRes.data && ruleRes.data.length > 0) {
        const r = ruleRes.data[0];
        this.state.rules = {
          standard_shift_hours: parseFloat(r.standard_shift_hours) || 8.0,
          half_day_min_hours: parseFloat(r.half_day_min_hours) || 4.0,
          ot_grace_minutes: parseInt(r.ot_grace_minutes) || 15,
          ot_rounding_minutes: parseInt(r.ot_rounding_minutes) || 30,
          enable_ot: true
        };
      }

      this.saveToLocalStorage();
    } catch (e) {
      console.warn('Sync masters failed:', e);
    }
  },

  async syncAttendanceFromSupabase() {
    const client = window.getSupabaseClient();
    if (!client) return;

    try {
      const { data, error } = await client.from('faith_attendance_logs').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        this.state.attendance = data;
        this.saveToLocalStorage();
      }
    } catch (e) {
      console.warn('Sync attendance failed:', e);
    }
  },

  // ============================================================================
  // BUSINESS LOGIC: EMPLOYEE-SPECIFIC MANDAY & OT CALCULATION ENGINE
  // ============================================================================

  calculateHoursWorked(inTime, outTime) {
    if (!inTime || !outTime) return 0;
    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);

    let startMinutes = inH * 60 + inM;
    let endMinutes = outH * 60 + outM;

    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60; // shift crossing midnight
    }

    const diffMinutes = Math.max(0, endMinutes - startMinutes);
    return parseFloat((diffMinutes / 60).toFixed(2));
  },

  computeAttendanceMetrics(inTime, outTime, employee = null, supplier = null, locationType = 'Onsite') {
    const hoursWorked = this.calculateHoursWorked(inTime, outTime);

    // 1. Hierarchy: Employee -> Supplier -> Global
    const shiftHours = parseFloat(
      (employee && employee.standard_shift_hours) || 
      (supplier && supplier.standard_shift_hours) || 
      this.state.rules.standard_shift_hours || 
      8.0
    );

    const halfDayHours = parseFloat(
      (employee && employee.half_day_min_hours) || 
      this.state.rules.half_day_min_hours || 
      4.0
    );

    const graceMinutes = parseInt(
      (employee && employee.ot_grace_minutes !== undefined ? employee.ot_grace_minutes : this.state.rules.ot_grace_minutes) || 
      15
    );

    const roundMinutes = parseInt(
      (employee && employee.ot_rounding_minutes !== undefined ? employee.ot_rounding_minutes : (supplier && supplier.ot_rounding_minutes !== undefined ? supplier.ot_rounding_minutes : this.state.rules.ot_rounding_minutes)) || 
      30
    );

    // 2. Resolve Rate based on Location (Onsite vs Inhouse)
    let mandayRate = 850.0;
    let otHourlyRate = 160.0;

    if (locationType === 'Onsite') {
      mandayRate = parseFloat(
        (employee && employee.onsite_manday_rate) || 
        (supplier && supplier.default_onsite_manday_rate) || 
        950.0
      );
    } else {
      mandayRate = parseFloat(
        (employee && employee.inhouse_manday_rate) || 
        (supplier && supplier.default_inhouse_manday_rate) || 
        850.0
      );
    }

    otHourlyRate = parseFloat(
      (employee && employee.ot_rate) || 
      (supplier && supplier.default_ot_rate) || 
      160.0
    );

    // 3. Compute Mandays
    let mandays = 0.0;
    if (hoursWorked >= shiftHours) {
      mandays = 1.0;
    } else if (hoursWorked >= halfDayHours) {
      mandays = 0.5;
    } else {
      mandays = parseFloat((hoursWorked / shiftHours).toFixed(2));
    }

    // 4. Compute OT Hours
    let otHours = 0.0;
    if (hoursWorked > shiftHours) {
      const extraMinutes = (hoursWorked - shiftHours) * 60;
      if (extraMinutes >= graceMinutes) {
        if (roundMinutes > 0) {
          const roundedMins = Math.round(extraMinutes / roundMinutes) * roundMinutes;
          otHours = parseFloat((roundedMins / 60).toFixed(2));
        } else {
          otHours = parseFloat((extraMinutes / 60).toFixed(2));
        }
      }
    }

    // 5. Costs
    const mandayCost = parseFloat((mandays * mandayRate).toFixed(2));
    const otCost = parseFloat((otHours * otHourlyRate).toFixed(2));
    const totalCost = parseFloat((mandayCost + otCost).toFixed(2));

    return {
      hoursWorked,
      mandays,
      otHours,
      mandayRate,
      otHourlyRate,
      mandayCost,
      otCost,
      totalCost
    };
  },

  // ============================================================================
  // ATTENDANCE MARKING WITH DATE SELECTION & MANAGER APPROVAL WORKFLOW
  // ============================================================================

  /**
   * Step 4: Mark IN Time
   * - Supports picking past date (defaults to current date)
   * - If date < today, marks is_backdated = true and approval_status = 'PENDING_APPROVAL'
   */
  async markInAttendance({ projectCode, locationType, supplierId, employeeIds, inTime, supervisorName, attendanceDate }) {
    if (!projectCode) throw new Error('Project Code is required.');
    if (!supplierId) throw new Error('Supplier selection is required.');
    if (!employeeIds || employeeIds.length === 0) throw new Error('Please select at least one employee.');
    if (!inTime) throw new Error('In-Time is required.');

    const project = this.state.projects.find(p => p.code === projectCode);
    if (!project) throw new Error(`Project ${projectCode} not found.`);
    if (project.status === 'Completed' || project.status === 'Closed') {
      throw new Error(`Project ${projectCode} is marked as COMPLETED. Booking attendance is not permitted.`);
    }

    const supplier = this.state.suppliers.find(s => s.id === supplierId || s.code === supplierId);
    if (!supplier) throw new Error('Invalid supplier selected.');
    if (supplier.is_blocked === true) {
      throw new Error(`Supplier "${supplier.name}" has been BLOCKED by Faith Engineers Management. Attendance marking is disabled.`);
    }

    // DATE HANDLING: Default to current date if omitted
    const today = new Date().toISOString().split('T')[0];
    const targetDate = attendanceDate || today;

    // Verify date is not in future
    if (targetDate > today) {
      throw new Error('Cannot mark attendance for future dates.');
    }

    // RETROACTIVE / BACKDATED CHECK
    const isBackdated = targetDate < today;
    const initialApprovalStatus = isBackdated ? 'PENDING_APPROVAL' : 'APPROVED';

    const client = window.getSupabaseClient();
    const newRecords = [];

    for (const empId of employeeIds) {
      const emp = this.state.employees.find(e => e.id === empId);
      if (!emp) continue;

      if (emp.is_blocked === true) {
        throw new Error(`Employee "${emp.name}" is BLOCKED by management. Attendance marking not permitted.`);
      }
      if (emp.is_enabled === false) {
        throw new Error(`Employee "${emp.name}" is disabled in Supplier Master.`);
      }

      // STRICT RESTRICTION: Same-day Double Attendance Prohibited
      const existingAttendanceOnDate = this.state.attendance.find(a => 
        a.date === targetDate && 
        a.employee_id === empId
      );

      if (existingAttendanceOnDate) {
        throw new Error(`🚫 DOUBLE ATTENDANCE RESTRICTED: Employee "${emp.name}" already has an attendance record on ${targetDate} (Status: ${existingAttendanceOnDate.status}, In-Time: ${existingAttendanceOnDate.in_time}). Marking attendance twice for the same worker on the same date is strictly prohibited.`);
      }

      const initialMetrics = this.computeAttendanceMetrics(inTime, inTime, emp, supplier, locationType);

      const record = {
        id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        date: targetDate,
        project_code: projectCode,
        project_title: project.title,
        location_type: locationType || 'Onsite',
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        employee_id: emp.id,
        employee_name: emp.name,
        trade: emp.trade || 'Worker',
        in_time: inTime,
        out_time: null,
        status: 'WORKING',
        hours_worked: 0.0,
        mandays: 0.0,
        ot_hours: 0.0,
        manday_rate: initialMetrics.mandayRate,
        ot_rate: initialMetrics.otHourlyRate,
        manday_cost: 0.0,
        ot_cost: 0.0,
        total_cost: 0.0,
        activity_description: '',
        marked_by_supervisor: supervisorName || 'Site Supervisor',
        is_backdated: isBackdated,
        approval_status: initialApprovalStatus,
        approved_by: isBackdated ? null : 'Auto (On-Time)',
        approved_at: isBackdated ? null : new Date().toISOString(),
        approval_remarks: isBackdated ? 'Retroactive shift marked by supervisor, awaiting manager approval' : null,
        created_at: new Date().toISOString()
      };

      newRecords.push(record);
      this.state.attendance.unshift(record);
    }

    this.saveToLocalStorage();

    if (client && newRecords.length > 0) {
      try {
        await client.from('faith_attendance_logs').insert(newRecords);
      } catch (err) {
        console.warn('Supabase mark-in sync deferred:', err);
      }
    }

    return { records: newRecords, isBackdated };
  },

  /**
   * Step 5: Mark OUT Time with Mandatory Activity Description
   */
  async markOutAttendance({ attendanceIds, outTime, activityDescription, supervisorName }) {
    if (!attendanceIds || attendanceIds.length === 0) {
      throw new Error('Please select at least one employee to mark Out time.');
    }
    if (!outTime) throw new Error('Out-Time is required.');

    // MANDATORY ACTIVITY VALIDATION
    if (!activityDescription || activityDescription.trim().length < 5) {
      throw new Error('MANDATORY: Please describe the manpower activity performed during the shift (min 5 characters).');
    }

    const client = window.getSupabaseClient();
    const updatedRecords = [];

    for (const attId of attendanceIds) {
      const record = this.state.attendance.find(a => a.id === attId);
      if (!record || record.status === 'COMPLETED') continue;

      const emp = this.state.employees.find(e => e.id === record.employee_id);
      const sup = this.state.suppliers.find(s => s.id === record.supplier_id);

      const metrics = this.computeAttendanceMetrics(
        record.in_time, 
        outTime, 
        emp, 
        sup, 
        record.location_type
      );

      record.out_time = outTime;
      record.status = 'COMPLETED';
      record.hours_worked = metrics.hoursWorked;
      record.mandays = metrics.mandays;
      record.ot_hours = metrics.otHours;
      record.manday_rate = metrics.mandayRate;
      record.ot_rate = metrics.otHourlyRate;
      record.manday_cost = metrics.mandayCost;
      record.ot_cost = metrics.otCost;
      record.total_cost = metrics.totalCost;
      record.activity_description = activityDescription.trim();
      record.marked_by_supervisor = supervisorName || record.marked_by_supervisor;
      record.updated_at = new Date().toISOString();

      // RULE: More than 14 hours working requires Manager Approval
      const exceeds14Hours = metrics.hoursWorked > 14.0;
      record.overtime_exceeded_14h = exceeds14Hours;

      if (exceeds14Hours) {
        record.approval_status = 'PENDING_APPROVAL';
        record.is_backdated = true; // Route to manager approval queue
        record.approved_by = null;
        record.approved_at = null;
        const msg = `⚠️ Long Shift Alert: Working duration (${metrics.hoursWorked}h) exceeds 14.0 hours threshold. Requires Manager Approval under Faith safety policy.`;
        record.approval_remarks = record.approval_remarks ? `${record.approval_remarks} | ${msg}` : msg;
      }

      updatedRecords.push(record);
    }

    this.saveToLocalStorage();

    if (client && updatedRecords.length > 0) {
      try {
        for (const rec of updatedRecords) {
          await client.from('faith_attendance_logs').upsert(rec);
        }
      } catch (err) {
        console.warn('Supabase mark-out sync deferred:', err);
      }
    }

    return updatedRecords;
  },

  // ============================================================================
  // MANAGER APPROVAL METHODS FOR RETROACTIVE / PAST-DATE ATTENDANCE
  // ============================================================================

  async approveBackdatedAttendance(attendanceId, managerName = 'Manager', remarks = '') {
    const record = this.state.attendance.find(a => a.id === attendanceId);
    if (!record) throw new Error('Attendance record not found.');

    record.approval_status = 'APPROVED';
    record.approved_by = managerName;
    record.approved_at = new Date().toISOString();
    if (remarks) record.approval_remarks = remarks;
    record.updated_at = new Date().toISOString();

    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try {
        await client.from('faith_attendance_logs').update({
          approval_status: 'APPROVED',
          approved_by: managerName,
          approved_at: record.approved_at,
          approval_remarks: record.approval_remarks
        }).eq('id', attendanceId);
      } catch (e) {}
    }
    return record;
  },

  async rejectBackdatedAttendance(attendanceId, managerName = 'Manager', remarks = '') {
    const record = this.state.attendance.find(a => a.id === attendanceId);
    if (!record) throw new Error('Attendance record not found.');

    record.approval_status = 'REJECTED';
    record.approved_by = managerName;
    record.approved_at = new Date().toISOString();
    record.approval_remarks = remarks || 'Rejected by management';
    record.updated_at = new Date().toISOString();

    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try {
        await client.from('faith_attendance_logs').update({
          approval_status: 'REJECTED',
          approved_by: managerName,
          approved_at: record.approved_at,
          approval_remarks: record.approval_remarks
        }).eq('id', attendanceId);
      } catch (e) {}
    }
    return record;
  },

  async bulkApproveAttendance(attendanceIds, managerName = 'Manager') {
    const approved = [];
    for (const id of attendanceIds) {
      const rec = await this.approveBackdatedAttendance(id, managerName, 'Bulk Approved by Manager');
      approved.push(rec);
    }
    return approved;
  },

  // ============================================================================
  // FORGOTTEN OUT-PUNCH IDENTIFICATION & RESOLUTION METHODS
  // ============================================================================

  /**
   * Identifies unclosed open shifts:
   * - Records with status === 'WORKING' where date < today (past-date open shifts)
   * - Or today's shift where elapsed time since in_time exceeds 14 hours
   */
  getForgottenOutPunches() {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    return this.state.attendance.filter(log => {
      if (log.status !== 'WORKING') return false;

      // Case 1: Marked IN on a previous date and still open
      if (log.date < today) return true;

      // Case 2: Today's shift but elapsed time is > 14 hours
      if (log.date === today && log.in_time) {
        const [inH, inM] = log.in_time.split(':').map(Number);
        const inMinutes = inH * 60 + inM;
        let diffMinutes = currentTotalMinutes - inMinutes;
        if (diffMinutes < 0) diffMinutes += 24 * 60;
        if (diffMinutes >= 14 * 60) return true;
      }
      return false;
    }).map(log => {
      let elapsedHours = 0;
      if (log.in_time) {
        if (log.date < today) {
          const daysDiff = Math.max(1, Math.round((new Date(today) - new Date(log.date)) / 86400000));
          const [inH, inM] = log.in_time.split(':').map(Number);
          const inMinutes = inH * 60 + inM;
          elapsedHours = (daysDiff * 24) - (inMinutes / 60) + (currentTotalMinutes / 60);
        } else {
          const [inH, inM] = log.in_time.split(':').map(Number);
          const inMinutes = inH * 60 + inM;
          elapsedHours = Math.max(0, currentTotalMinutes - inMinutes) / 60;
        }
      }

      return {
        ...log,
        elapsed_hours: parseFloat(Math.max(0, elapsedHours).toFixed(1))
      };
    });
  },

  /**
   * Force Out-Punch / Resolution for a forgotten shift
   */
  async resolveForgottenOutPunch({ attendanceId, outTime, activityDescription, resolvedBy }) {
    if (!attendanceId) throw new Error('Attendance ID required.');
    if (!outTime) throw new Error('Out-Time is required to close forgotten punch.');
    if (!activityDescription || activityDescription.trim().length < 5) {
      throw new Error('MANDATORY: Please describe the manpower activity performed during the shift (min 5 characters).');
    }

    const record = this.state.attendance.find(a => a.id === attendanceId);
    if (!record) throw new Error('Attendance log not found.');

    const emp = this.state.employees.find(e => e.id === record.employee_id);
    const sup = this.state.suppliers.find(s => s.id === record.supplier_id);

    const metrics = this.computeAttendanceMetrics(
      record.in_time,
      outTime,
      emp,
      sup,
      record.location_type
    );

    record.out_time = outTime;
    record.status = 'COMPLETED';
    record.hours_worked = metrics.hoursWorked;
    record.mandays = metrics.mandays;
    record.ot_hours = metrics.otHours;
    record.manday_rate = metrics.mandayRate;
    record.ot_rate = metrics.otHourlyRate;
    record.manday_cost = metrics.mandayCost;
    record.ot_cost = metrics.otCost;
    record.total_cost = metrics.totalCost;
    record.activity_description = activityDescription.trim();
    record.forgotten_outpunch_resolved = true;
    record.updated_at = new Date().toISOString();

    const user = FaithAuth.getCurrentUser();
    const isManagerOrAdmin = FaithAuth.isAdmin() || (user && user.role === 'management');

    // If resolved by supervisor, submit for Manager Approval
    if (isManagerOrAdmin) {
      record.approval_status = 'APPROVED';
      record.approved_by = resolvedBy || (user ? user.full_name : 'Plant Manager');
      record.approved_at = new Date().toISOString();
      record.approval_remarks = 'Forgotten out-punch resolved and approved by Management.';
    } else {
      record.approval_status = 'PENDING_APPROVAL';
      record.is_backdated = true;
      record.approved_by = null;
      record.approved_at = null;
      record.approval_remarks = `Forgotten out-punch resolved by supervisor (${resolvedBy || 'Supervisor'}). Awaiting Manager Approval.`;
    }

    if (metrics.hoursWorked > 14.0) {
      record.overtime_exceeded_14h = true;
      if (!isManagerOrAdmin) record.approval_status = 'PENDING_APPROVAL';
    }

    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try {
        await client.from('faith_attendance_logs').upsert(record);
      } catch (e) {
        console.warn('Supabase sync deferred:', e);
      }
    }

    return record;
  },

  // ============================================================================
  // MASTER ACTIONS: BLOCKING, RATES, AUTHORISATION MATRIX
  // ============================================================================

  async toggleBlockSupplier(supplierId, isBlocked, reason = '') {
    const sup = this.state.suppliers.find(s => s.id === supplierId);
    if (!sup) throw new Error('Supplier not found.');

    sup.is_blocked = isBlocked;
    sup.block_reason = isBlocked ? (reason || 'Blocked by management') : null;
    sup.blocked_at = isBlocked ? new Date().toISOString() : null;
    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try {
        await client.from('faith_suppliers').update({
          is_blocked: isBlocked,
          block_reason: sup.block_reason,
          blocked_at: sup.blocked_at
        }).eq('id', supplierId);
      } catch (e) {}
    }
    return sup;
  },

  async addSupplier(supplier) {
    if (!supplier.name) throw new Error('Supplier name is required.');
    const code = supplier.code || ('SUP-' + String(this.state.suppliers.length + 1).padStart(2, '0'));

    const newSup = {
      id: 'sup-' + Date.now(),
      code: code.trim(),
      name: supplier.name.trim(),
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      is_blocked: false,
      is_active: true,
      default_onsite_manday_rate: parseFloat(supplier.default_onsite_manday_rate) || 950.0,
      default_inhouse_manday_rate: parseFloat(supplier.default_inhouse_manday_rate) || 850.0,
      default_ot_rate: parseFloat(supplier.default_ot_rate) || 160.0,
      standard_shift_hours: parseFloat(supplier.standard_shift_hours) || 8.0,
      ot_rounding_minutes: parseInt(supplier.ot_rounding_minutes) || 30,
      created_at: new Date().toISOString()
    };

    this.state.suppliers.push(newSup);
    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try { await client.from('faith_suppliers').insert([newSup]); } catch (e) {}
    }
    return newSup;
  },

  async updateSupplier(id, updates) {
    const sup = this.state.suppliers.find(s => s.id === id);
    if (!sup) throw new Error('Supplier not found.');
    Object.assign(sup, updates);
    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try { await client.from('faith_suppliers').update(updates).eq('id', id); } catch (e) {}
    }
    return sup;
  },

  async toggleBlockEmployee(employeeId, isBlocked, reason = '') {
    const emp = this.state.employees.find(e => e.id === employeeId);
    if (!emp) throw new Error('Employee not found.');

    emp.is_blocked = isBlocked;
    emp.block_reason = isBlocked ? (reason || 'Blocked by management') : null;
    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try {
        await client.from('faith_supplier_employees').update({
          is_blocked: isBlocked,
          block_reason: emp.block_reason
        }).eq('id', employeeId);
      } catch (e) {}
    }
    return emp;
  },

  async toggleEmployeeStatus(id, isEnabled) {
    const emp = this.state.employees.find(e => e.id === id);
    if (!emp) throw new Error('Employee not found.');
    emp.is_enabled = isEnabled;
    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try { await client.from('faith_supplier_employees').update({ is_enabled: isEnabled }).eq('id', id); } catch (e) {}
    }
    return emp;
  },

  async addEmployee(emp) {
    if (!emp.supplier_id || !emp.name) throw new Error('Supplier and employee name are required.');
    
    const supplier = this.state.suppliers.find(s => s.id === emp.supplier_id);
    const defOnsite = supplier ? supplier.default_onsite_manday_rate : 950.0;
    const defInhouse = supplier ? supplier.default_inhouse_manday_rate : 850.0;
    const defOt = supplier ? supplier.default_ot_rate : 160.0;
    const defShift = supplier ? supplier.standard_shift_hours : 8.0;

    const newEmp = {
      id: 'emp-' + Date.now(),
      supplier_id: emp.supplier_id,
      employee_code: emp.employee_code || ('EMP-' + Date.now().toString().slice(-4)),
      name: emp.name.trim(),
      trade: emp.trade || 'Fitter',
      phone: emp.phone || '',
      is_blocked: false,
      is_enabled: true,
      onsite_manday_rate: parseFloat(emp.onsite_manday_rate) || defOnsite,
      inhouse_manday_rate: parseFloat(emp.inhouse_manday_rate) || defInhouse,
      ot_rate: parseFloat(emp.ot_rate) || defOt,
      standard_shift_hours: parseFloat(emp.standard_shift_hours) || defShift,
      half_day_min_hours: parseFloat(emp.half_day_min_hours) || 4.0,
      ot_grace_minutes: parseInt(emp.ot_grace_minutes) || 15,
      ot_rounding_minutes: parseInt(emp.ot_rounding_minutes) || 30,
      created_at: new Date().toISOString()
    };

    this.state.employees.push(newEmp);
    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try { await client.from('faith_supplier_employees').insert([newEmp]); } catch (e) {}
    }
    return newEmp;
  },

  async updateEmployee(id, updates) {
    const emp = this.state.employees.find(e => e.id === id);
    if (!emp) throw new Error('Employee not found.');
    Object.assign(emp, updates);
    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try { await client.from('faith_supplier_employees').update(updates).eq('id', id); } catch (e) {}
    }
    return emp;
  },

  async addProject(project) {
    if (!project.code || !project.title) throw new Error('Project code and title are required.');
    if (this.state.projects.some(p => p.code.toUpperCase() === project.code.toUpperCase())) {
      throw new Error(`Project code ${project.code} already exists.`);
    }

    const newProj = {
      id: 'proj-' + Date.now(),
      code: project.code.toUpperCase().trim(),
      title: project.title.trim(),
      customer: project.customer || 'General Client',
      location: project.location || 'Pune',
      status: project.status || 'Active',
      created_at: new Date().toISOString()
    };

    this.state.projects.push(newProj);
    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try { await client.from('faith_projects').insert([newProj]); } catch (e) {}
    }
    return newProj;
  },

  async updateProject(code, updates) {
    const proj = this.state.projects.find(p => p.code === code);
    if (!proj) throw new Error('Project not found.');
    Object.assign(proj, updates);
    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try { await client.from('faith_projects').update(updates).eq('code', code); } catch (e) {}
    }
    return proj;
  },

  async toggleUserActivation(userId, isActive) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    user.is_active = isActive;
    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try { await client.from('faith_users').update({ is_active: isActive }).eq('id', userId); } catch (e) {}
    }
    return user;
  },

  async updateUserPermissions(userId, permissions) {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    user.permissions = { ...user.permissions, ...permissions };
    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try { await client.from('faith_users').update({ permissions: user.permissions }).eq('id', userId); } catch (e) {}
    }
    return user;
  },

  async addUser(user) {
    if (!user.email || !user.full_name) throw new Error('Email and Full Name are required.');
    if (this.state.users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      throw new Error(`User with email ${user.email} already exists.`);
    }

    const defaultPerms = user.role === 'admin' ? {
      can_mark_attendance: true,
      can_view_dashboard: true,
      can_view_reports: true,
      can_export_reports: true,
      can_manage_suppliers: true,
      can_manage_projects: true,
      can_manage_users: true,
      can_manage_rules: true,
      can_approve_backdated: true
    } : {
      can_mark_attendance: true,
      can_view_dashboard: true,
      can_view_reports: true,
      can_export_reports: false,
      can_manage_suppliers: false,
      can_manage_projects: false,
      can_manage_users: false,
      can_manage_rules: false,
      can_approve_backdated: false
    };

    const newUser = {
      id: 'usr-' + Date.now(),
      email: user.email.toLowerCase().trim(),
      password_hash: user.password || 'pass123',
      full_name: user.full_name.trim(),
      employee_code: user.employee_code || ('FE-' + Date.now().toString().slice(-4)),
      role: user.role || 'supervisor',
      phone: user.phone || '',
      is_active: user.is_active !== undefined ? user.is_active : true,
      permissions: user.permissions || defaultPerms,
      created_at: new Date().toISOString()
    };

    this.state.users.push(newUser);
    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try { await client.from('faith_users').insert([newUser]); } catch (e) {}
    }
    return newUser;
  },

  async updateUser(id, updates) {
    const user = this.state.users.find(u => u.id === id);
    if (!user) throw new Error('User not found.');
    Object.assign(user, updates);
    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try { await client.from('faith_users').update(updates).eq('id', id); } catch (e) {}
    }
    return user;
  },

  async updateRules(newRules) {
    this.state.rules = {
      ...this.state.rules,
      ...newRules
    };
    this.saveToLocalStorage();

    const client = window.getSupabaseClient();
    if (client) {
      try {
        await client.from('faith_calculation_rules').upsert({
          rule_name: 'Standard Faith Rule',
          standard_shift_hours: this.state.rules.standard_shift_hours,
          half_day_min_hours: this.state.rules.half_day_min_hours,
          ot_grace_minutes: this.state.rules.ot_grace_minutes,
          ot_rounding_minutes: this.state.rules.ot_rounding_minutes,
          is_default: true
        });
      } catch (e) {}
    }
    return this.state.rules;
  }
};

window.FaithStore = FaithStore;
