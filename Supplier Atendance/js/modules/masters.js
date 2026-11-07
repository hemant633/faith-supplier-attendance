// ==============================================================================
// FAITH ENGINEERS - MASTERS MANAGEMENT MODULE (v2.0)
// Includes:
// 1. Supplier Blocking & Employee Blocking (blocks supervisor marking)
// 2. Separate Onsite & Inhouse Manday Rates & Specific OT Rules
// 3. Project Status (Completed projects hidden from attendance)
// 4. User Authorisation Matrix & Activation / Deactivation facility
// ==============================================================================

const MastersModule = {
  activeSubTab: 'suppliers', // 'suppliers', 'projects', 'rules', 'users'
  selectedSupplierForManpower: '',

  init() {
    this.renderMastersView();
  },

  renderMastersView() {
    const container = document.getElementById('tab-masters');
    if (!container) return;

    if (!FaithAuth.canAccessMasters()) {
      this.renderAccessDenied(container);
      return;
    }

    if (!this.selectedSupplierForManpower && FaithStore.state.suppliers.length > 0) {
      this.selectedSupplierForManpower = FaithStore.state.suppliers[0].id;
    }

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Top Authorization Header -->
        <div class="glass-panel rounded-2xl p-5 shadow-lg border border-purple-500/20 relative overflow-hidden">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <i data-lucide="shield-check" class="w-3.5 h-3.5 mr-1 text-purple-400"></i> Authorized Management Zone
                </span>
                <span class="text-xs text-slate-400">Faith Engineers Enterprise Masters</span>
              </div>
              <h2 class="text-xl sm:text-2xl font-bold text-white mt-1">Master Records & System Authorizations</h2>
              <p class="text-sm text-slate-400">Manage Supplier & Employee Blocking, Onsite/Inhouse Rates, Project Lifecycles & User Access Matrix.</p>
            </div>
            
            <div class="flex items-center gap-2">
              <span class="px-3 py-1.5 rounded-xl bg-purple-900/30 text-purple-200 border border-purple-700/50 text-xs font-mono font-semibold">
                Role: ADMIN / MANAGEMENT
              </span>
            </div>
          </div>
        </div>

        <!-- Masters Subtabs Navigation -->
        <div class="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button type="button" class="master-subtab-btn px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${this.activeSubTab === 'suppliers' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'}" onclick="MastersModule.switchSubTab('suppliers')">
            <i data-lucide="building-2" class="inline w-4 h-4 mr-1.5 text-amber-400"></i> Supplier & Manpower Master
          </button>
          <button type="button" class="master-subtab-btn px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${this.activeSubTab === 'projects' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'}" onclick="MastersModule.switchSubTab('projects')">
            <i data-lucide="folder-kanban" class="inline w-4 h-4 mr-1.5 text-blue-400"></i> Project Master & Status
          </button>
          <button type="button" class="master-subtab-btn px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${this.activeSubTab === 'users' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'}" onclick="MastersModule.switchSubTab('users')">
            <i data-lucide="shield-alert" class="inline w-4 h-4 mr-1.5 text-purple-400"></i> User Matrix & Activation
          </button>
          <button type="button" class="master-subtab-btn px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${this.activeSubTab === 'rules' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'}" onclick="MastersModule.switchSubTab('rules')">
            <i data-lucide="calculator" class="inline w-4 h-4 mr-1.5 text-emerald-400"></i> Shift & OT Policies
          </button>
        </div>

        <!-- Subtab Content Body -->
        <div id="master-subtab-content">
          ${this.renderSubTabContent()}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  renderAccessDenied(container) {
    container.innerHTML = `
      <div class="glass-panel rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto my-12 border border-red-500/20 shadow-2xl">
        <div class="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <i data-lucide="lock" class="w-8 h-8"></i>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Restricted Area: Authorized Persons Only</h3>
        <p class="text-sm text-slate-400 mb-6">
          Supplier Master, User Master, and Project Master can only be viewed and modified by authorized Faith Engineers administrative personnel.
        </p>

        <!-- 1-Click Fast Switch Buttons -->
        <div class="mb-6 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-left">
          <p class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">⚡ 1-Click Login to Unlock Masters:</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button type="button" onclick="App.fillDemoLogin('admin@faithengineers.com', 'admin123')" class="p-2.5 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 rounded-lg text-left text-xs border border-purple-500/40 transition-all flex items-center justify-between">
              <div>
                <strong class="text-white block">App Admin (Full Master Access)</strong>
                <span class="text-slate-400 font-mono text-[10px]">admin@faithengineers.com</span>
              </div>
              <span class="text-[10px] text-purple-400 font-bold font-mono">admin123</span>
            </button>
            <button type="button" onclick="App.fillDemoLogin('manager@faithengineers.com', 'manager123')" class="p-2.5 bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 rounded-lg text-left text-xs border border-amber-500/40 transition-all flex items-center justify-between">
              <div>
                <strong class="text-white block">Plant Manager (Approver)</strong>
                <span class="text-slate-400 font-mono text-[10px]">manager@faithengineers.com</span>
              </div>
              <span class="text-[10px] text-amber-400 font-bold font-mono">manager123</span>
            </button>
          </div>
        </div>
        
        <div class="bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-left mb-6">
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Or Enter Admin Authorization PIN / Password:</label>
          <div class="flex gap-2">
            <input type="password" id="admin-unlock-input" value="admin123" placeholder="Enter admin password..." class="flex-1 bg-slate-950 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono">
            <button type="button" onclick="MastersModule.handleAdminUnlock()" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition-all">
              Unlock Master
            </button>
          </div>
          <p class="text-[11px] text-slate-500 mt-2">Default Admin password: <code class="text-purple-400 font-mono">admin123</code> | Manager: <code class="text-amber-400 font-mono">manager123</code></p>
        </div>

        <button type="button" onclick="App.switchTab('attendance')" class="px-4 py-2 text-xs text-slate-400 hover:text-white underline">
          &larr; Return to Supervisor Attendance Marking
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  handleAdminUnlock() {
    const input = document.getElementById('admin-unlock-input');
    const val = input ? input.value : '';
    if (FaithAuth.verifyAdminAuthorization(val)) {
      const currentUser = FaithAuth.getCurrentUser() || { full_name: 'Authorized Admin', role: 'admin' };
      currentUser.role = 'admin';
      FaithAuth.setCurrentUser(currentUser);
      App.showToast('✅ Admin authorization verified! Welcome to Masters.', 'success');
      this.renderMastersView();
    } else {
      App.showToast('❌ Invalid Admin PIN or Password.', 'error');
    }
  },

  switchSubTab(tab) {
    this.activeSubTab = tab;
    const content = document.getElementById('master-subtab-content');
    if (content) {
      content.innerHTML = this.renderSubTabContent();
      if (window.lucide) window.lucide.createIcons();
    }
    const btns = document.querySelectorAll('.master-subtab-btn');
    btns.forEach(btn => {
      btn.className = 'master-subtab-btn px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all text-slate-400 hover:text-white bg-slate-900/60';
    });
    if (window.event && window.event.currentTarget) {
      window.event.currentTarget.className = 'master-subtab-btn px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all bg-blue-600 text-white shadow-md';
    }
  },

  renderSubTabContent() {
    switch (this.activeSubTab) {
      case 'suppliers':
        return this.renderSuppliersAndManpower();
      case 'projects':
        return this.renderProjectsMaster();
      case 'users':
        return this.renderUsersMaster();
      case 'rules':
        return this.renderCalculationRules();
      default:
        return '';
    }
  },

  // ============================================================================
  // SUB-TAB 1: SUPPLIERS & MANPOWER MASTER (WITH BLOCKING & ONSITE/INHOUSE RATES)
  // ============================================================================
  renderSuppliersAndManpower() {
    const suppliers = FaithStore.state.suppliers;
    const selectedSupId = this.selectedSupplierForManpower || (suppliers[0] ? suppliers[0].id : '');
    const currentSup = suppliers.find(s => s.id === selectedSupId) || suppliers[0];
    const employees = currentSup ? FaithStore.state.employees.filter(e => e.supplier_id === currentSup.id) : [];

    return `
      <div class="space-y-6">
        <!-- Suppliers Master Table -->
        <div class="glass-panel rounded-2xl p-5 shadow-lg border border-slate-700/50">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i data-lucide="building-2" class="w-5 h-5 text-amber-400"></i>
                Supplier Agencies & Contractor Master
              </h3>
              <p class="text-xs text-slate-400">Separate Onsite & Inhouse default rates, shift hours, and Supplier Blocking system.</p>
            </div>
            <button type="button" onclick="MastersModule.openAddSupplierModal()" class="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md">
              <i data-lucide="plus" class="w-4 h-4"></i> Add New Supplier
            </button>
          </div>

          <div class="overflow-x-auto mt-4">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-slate-900/80 text-slate-300 uppercase text-[11px] font-semibold">
                <tr>
                  <th class="px-3 py-2.5 rounded-l-lg">Code</th>
                  <th class="px-3 py-2.5">Supplier Name</th>
                  <th class="px-3 py-2.5">Contact Person</th>
                  <th class="px-3 py-2.5">Onsite Manday Rate</th>
                  <th class="px-3 py-2.5">Inhouse Manday Rate</th>
                  <th class="px-3 py-2.5">Standard OT Rate</th>
                  <th class="px-3 py-2.5">Shift Hours</th>
                  <th class="px-3 py-2.5">Supplier Status</th>
                  <th class="px-3 py-2.5 rounded-r-lg">Actions & Blocking</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800 text-slate-200">
                ${suppliers.map(s => {
      const isBlocked = s.is_blocked === true;
      const isSelected = s.id === selectedSupId;
      return `
                    <tr class="hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-blue-900/20' : ''} ${isBlocked ? 'bg-red-950/20' : ''}">
                      <td class="px-3 py-3 font-mono font-bold text-amber-400">${s.code}</td>
                      <td class="px-3 py-3 font-semibold text-white">
                        <div class="flex items-center gap-1.5">
                          ${s.name}
                          ${isBlocked ? '<span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">BLOCKED</span>' : ''}
                        </div>
                      </td>
                      <td class="px-3 py-3 text-slate-300">${s.contact_person || '--'}</td>
                      <td class="px-3 py-3 font-mono text-blue-400 font-bold">₹${parseFloat(s.default_onsite_manday_rate || 950).toFixed(2)}/d</td>
                      <td class="px-3 py-3 font-mono text-indigo-400 font-bold">₹${parseFloat(s.default_inhouse_manday_rate || 850).toFixed(2)}/d</td>
                      <td class="px-3 py-3 font-mono text-purple-400 font-bold">₹${parseFloat(s.default_ot_rate || 160).toFixed(2)}/h</td>
                      <td class="px-3 py-3 font-mono text-slate-300">${s.standard_shift_hours || 8}h</td>
                      <td class="px-3 py-3">
                        ${isBlocked ? `
                          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            <i data-lucide="ban" class="w-3 h-3"></i> BLOCKED
                          </span>
                        ` : `
                          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <i data-lucide="check" class="w-3 h-3"></i> Active
                          </span>
                        `}
                      </td>
                      <td class="px-3 py-3 whitespace-nowrap">
                        <div class="flex items-center gap-1.5">
                          <button type="button" onclick="MastersModule.selectSupplierForRoster('${s.id}')" class="px-2.5 py-1 text-xs rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700'}">
                            View Roster
                          </button>
                          <button type="button" onclick="MastersModule.toggleSupplierBlock('${s.id}', ${!isBlocked})" class="px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${isBlocked ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40'}">
                            ${isBlocked ? 'Unblock Supplier' : 'Block Supplier'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
    }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Supplier Manpower Roster (With Employee Blocking & Specific Rates/Rules) -->
        <div class="glass-panel rounded-2xl p-5 shadow-lg border border-slate-700/50">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold">${currentSup ? currentSup.code : ''}</span>
                <h3 class="text-base font-bold text-white">
                  ${currentSup ? currentSup.name : 'Supplier'} - Individual Manpower Roster & Rules
                </h3>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                Configure employee-specific Onsite/Inhouse rates, individual OT shift rules, and Employee Blocking.
              </p>
            </div>
            <button type="button" onclick="MastersModule.openAddEmployeeModal('${currentSup ? currentSup.id : ''}')" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md">
              <i data-lucide="user-plus" class="w-4 h-4"></i> Add Manpower Worker
            </button>
          </div>

          <div class="overflow-x-auto mt-4">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-slate-900/80 text-slate-300 uppercase text-[11px] font-semibold">
                <tr>
                  <th class="px-3 py-2.5 rounded-l-lg">Emp Code</th>
                  <th class="px-3 py-2.5">Worker Name</th>
                  <th class="px-3 py-2.5">Trade</th>
                  <th class="px-3 py-2.5">Onsite Rate</th>
                  <th class="px-3 py-2.5">Inhouse Rate</th>
                  <th class="px-3 py-2.5">OT Rate</th>
                  <th class="px-3 py-2.5">Shift Rule</th>
                  <th class="px-3 py-2.5">Employee Status</th>
                  <th class="px-3 py-2.5 rounded-r-lg">Blocking & Visibility Controls</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800 text-slate-200">
                ${employees.length === 0 ? `
                  <tr><td colspan="9" class="px-4 py-8 text-center text-slate-500">No workers enrolled for this supplier yet.</td></tr>
                ` : employees.map(emp => {
      const isBlocked = emp.is_blocked === true;
      const isEnabled = emp.is_enabled !== false;

      return `
                    <tr class="hover:bg-slate-800/40 transition-colors ${isBlocked ? 'bg-red-950/20' : (!isEnabled ? 'opacity-60' : '')}">
                      <td class="px-3 py-3 font-mono text-slate-400">${emp.employee_code || '--'}</td>
                      <td class="px-3 py-3 font-bold text-white flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full ${isBlocked ? 'bg-red-500' : (isEnabled ? 'bg-emerald-400' : 'bg-slate-500')}"></span>
                        ${emp.name}
                      </td>
                      <td class="px-3 py-3">
                        <span class="px-2 py-0.5 rounded text-xs bg-slate-800 border border-slate-700 font-mono text-slate-300">${emp.trade}</span>
                      </td>
                      <td class="px-3 py-3 font-mono font-bold text-blue-400">₹${parseFloat(emp.onsite_manday_rate).toFixed(2)}</td>
                      <td class="px-3 py-3 font-mono font-bold text-indigo-400">₹${parseFloat(emp.inhouse_manday_rate).toFixed(2)}</td>
                      <td class="px-3 py-3 font-mono font-bold text-purple-400">₹${parseFloat(emp.ot_rate).toFixed(2)}/h</td>
                      <td class="px-3 py-3 font-mono text-xs text-slate-400">
                        Shift: ${emp.standard_shift_hours || 8}h | Grace: ${emp.ot_grace_minutes || 15}m
                      </td>
                      <td class="px-3 py-3">
                        ${isBlocked ? `
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            <i data-lucide="ban" class="w-3 h-3"></i> BLOCKED
                          </span>
                        ` : (isEnabled ? `
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <i data-lucide="check" class="w-3 h-3"></i> Active
                          </span>
                        ` : `
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400">
                            Disabled
                          </span>
                        `)}
                      </td>
                      <td class="px-3 py-3 whitespace-nowrap">
                        <div class="flex items-center gap-1.5">
                          <!-- Block / Unblock Employee Button -->
                          <button type="button" onclick="MastersModule.toggleEmployeeBlock('${emp.id}', ${!isBlocked})" class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${isBlocked ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'}">
                            ${isBlocked ? 'Unblock' : 'Block Worker'}
                          </button>
                          <!-- Enable / Disable Toggle -->
                          <button type="button" onclick="MastersModule.handleToggleEmployee('${emp.id}', ${!isEnabled})" class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
                            ${isEnabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
    }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  selectSupplierForRoster(supId) {
    this.selectedSupplierForManpower = supId;
    this.switchSubTab('suppliers');
  },

  async toggleSupplierBlock(supplierId, shouldBlock) {
    try {
      App.showLoading(true);
      await FaithStore.toggleBlockSupplier(supplierId, shouldBlock);
      App.showToast(`Supplier ${shouldBlock ? 'BLOCKED' : 'UNBLOCKED'} successfully!`, shouldBlock ? 'warning' : 'success');
      this.switchSubTab('suppliers');
    } catch (err) {
      App.showToast(err.message, 'error');
    } finally {
      App.showLoading(false);
    }
  },

  async toggleEmployeeBlock(employeeId, shouldBlock) {
    try {
      App.showLoading(true);
      await FaithStore.toggleBlockEmployee(employeeId, shouldBlock);
      App.showToast(`Worker ${shouldBlock ? 'BLOCKED' : 'UNBLOCKED'} successfully!`, shouldBlock ? 'warning' : 'success');
      this.switchSubTab('suppliers');
    } catch (err) {
      App.showToast(err.message, 'error');
    } finally {
      App.showLoading(false);
    }
  },

  async handleToggleEmployee(empId, shouldEnable) {
    try {
      App.showLoading(true);
      await FaithStore.toggleEmployeeStatus(empId, shouldEnable);
      App.showToast(`Worker ${shouldEnable ? 'ENABLED' : 'DISABLED'} successfully!`, 'success');
      this.switchSubTab('suppliers');
    } catch (err) {
      App.showToast(err.message, 'error');
    } finally {
      App.showLoading(false);
    }
  },

  // ============================================================================
  // SUB-TAB 2: PROJECT MASTER & STATUS (COMPLETED PROJECTS HIDDEN)
  // ============================================================================
  renderProjectsMaster() {
    const projects = FaithStore.state.projects;

    return `
      <div class="glass-panel rounded-2xl p-5 shadow-lg border border-slate-700/50">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="folder-kanban" class="w-5 h-5 text-blue-400"></i>
              Projects Master & Lifecycle Status
            </h3>
            <p class="text-xs text-slate-400">Completed projects are automatically hidden from supervisors when booking attendance.</p>
          </div>
          <button type="button" onclick="MastersModule.openAddProjectModal()" class="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md">
            <i data-lucide="plus" class="w-4 h-4"></i> Add New Project
          </button>
        </div>

        <div class="overflow-x-auto mt-4">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-900/80 text-slate-300 uppercase text-[11px] font-semibold">
              <tr>
                <th class="px-3 py-2.5 rounded-l-lg">Project Code</th>
                <th class="px-3 py-2.5">Project Title</th>
                <th class="px-3 py-2.5">Customer</th>
                <th class="px-3 py-2.5">Site Location</th>
                <th class="px-3 py-2.5">Current Status</th>
                <th class="px-3 py-2.5">Supervisor Attendance Booking</th>
                <th class="px-3 py-2.5 rounded-r-lg">Lifecycle Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-200">
              ${projects.map(p => {
      const isActive = p.status === 'Active';
      return `
                  <tr class="hover:bg-slate-800/40 transition-colors ${!isActive ? 'opacity-70 bg-slate-950/40' : ''}">
                    <td class="px-3 py-3 font-mono font-bold text-blue-400">${p.code}</td>
                    <td class="px-3 py-3 font-semibold text-white">${p.title}</td>
                    <td class="px-3 py-3 text-slate-300">${p.customer}</td>
                    <td class="px-3 py-3 text-slate-400 text-xs">${p.location || 'Pune'}</td>
                    <td class="px-3 py-3">
                      <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-300'}">
                        ${p.status}
                      </span>
                    </td>
                    <td class="px-3 py-3">
                      ${isActive ? `
                        <span class="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <i data-lucide="check" class="w-3.5 h-3.5"></i> Visible to Supervisors
                        </span>
                      ` : `
                        <span class="text-xs text-slate-500 italic flex items-center gap-1">
                          <i data-lucide="eye-off" class="w-3.5 h-3.5"></i> Hidden from Booking
                        </span>
                      `}
                    </td>
                    <td class="px-3 py-3">
                      <button type="button" onclick="MastersModule.toggleProjectStatus('${p.code}', '${isActive ? 'Completed' : 'Active'}')" class="text-xs px-3 py-1 rounded-lg font-bold transition-all ${isActive ? 'bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 border border-purple-700/50' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}">
                        ${isActive ? 'Mark as Completed' : 'Reactivate Project'}
                      </button>
                    </td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async toggleProjectStatus(code, newStatus) {
    try {
      App.showLoading(true);
      await FaithStore.updateProject(code, { status: newStatus });
      App.showToast(`Project ${code} marked as ${newStatus}!`, 'success');
      this.switchSubTab('projects');
    } catch (err) {
      App.showToast(err.message, 'error');
    } finally {
      App.showLoading(false);
    }
  },

  // ============================================================================
  // SUB-TAB 3: USER MASTER & AUTHORISATION MATRIX
  // ============================================================================
  renderUsersMaster() {
    const users = FaithStore.state.users;

    return `
      <div class="glass-panel rounded-2xl p-5 shadow-lg border border-slate-700/50">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <i data-lucide="shield-alert" class="w-5 h-5 text-purple-400"></i>
              User Master & Authorisation Matrix
            </h3>
            <p class="text-xs text-slate-400">Control supervisor activation/deactivation and granular functional authorizations.</p>
          </div>
          <button type="button" onclick="MastersModule.openAddUserModal()" class="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md">
            <i data-lucide="user-plus" class="w-4 h-4"></i> Create User Account
          </button>
        </div>

        <div class="overflow-x-auto mt-4">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-900/80 text-slate-300 uppercase text-[11px] font-semibold">
              <tr>
                <th class="px-3 py-2.5 rounded-l-lg">User Code</th>
                <th class="px-3 py-2.5">Full Name</th>
                <th class="px-3 py-2.5">Login Email</th>
                <th class="px-3 py-2.5">Role</th>
                <th class="px-3 py-2.5">Account Status</th>
                <th class="px-3 py-2.5">Authorised Capabilities</th>
                <th class="px-3 py-2.5 rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-200">
              ${users.map(u => {
      const isActive = u.is_active !== false;
      const p = u.permissions || {};
      const activePermsCount = Object.values(p).filter(Boolean).length;

      return `
                  <tr class="hover:bg-slate-800/40 transition-colors ${!isActive ? 'bg-red-950/20 opacity-70' : ''}">
                    <td class="px-3 py-3 font-mono text-purple-400 font-bold">${u.employee_code || '--'}</td>
                    <td class="px-3 py-3 font-bold text-white">${u.full_name}</td>
                    <td class="px-3 py-3 font-mono text-xs text-slate-300">${u.email}</td>
                    <td class="px-3 py-3">
                      <span class="px-2 py-0.5 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}">
                        ${u.role.toUpperCase()}
                      </span>
                    </td>
                    <td class="px-3 py-3">
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}">
                        ${isActive ? 'Active' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td class="px-3 py-3">
                      <button type="button" onclick="MastersModule.openPermissionsModal('${u.id}')" class="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 flex items-center gap-1 font-medium">
                        <i data-lucide="sliders" class="w-3 h-3"></i> Matrix (${activePermsCount} granted)
                      </button>
                    </td>
                    <td class="px-3 py-3 whitespace-nowrap">
                      <div class="flex items-center gap-1.5">
                        <!-- User Activation / Deactivation Toggle -->
                        <button type="button" onclick="MastersModule.toggleUserActivation('${u.id}', ${!isActive})" class="px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${isActive ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}">
                          ${isActive ? 'Deactivate' : 'Activate User'}
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async toggleUserActivation(userId, shouldActivate) {
    try {
      App.showLoading(true);
      await FaithStore.toggleUserActivation(userId, shouldActivate);
      App.showToast(`User account ${shouldActivate ? 'ACTIVATED' : 'DEACTIVATED'} successfully!`, 'success');
      this.switchSubTab('users');
    } catch (err) {
      App.showToast(err.message, 'error');
    } finally {
      App.showLoading(false);
    }
  },

  openPermissionsModal(userId) {
    const user = FaithStore.state.users.find(u => u.id === userId);
    if (!user) return;
    const p = user.permissions || {};

    App.showModal(`
      <div class="space-y-4">
        <div class="flex items-center gap-2 pb-3 border-b border-slate-800">
          <div class="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
            <i data-lucide="sliders" class="w-4 h-4"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Authorisation Matrix: ${user.full_name}</h3>
            <p class="text-xs text-slate-400">Configure functional permissions for ${user.email}.</p>
          </div>
        </div>

        <div class="space-y-2.5 max-h-72 overflow-y-auto pr-1 text-xs">
          <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
            <span class="text-white font-medium">Mark Daily Attendance (In/Out)</span>
            <input type="checkbox" id="perm-att" class="w-4 h-4 text-blue-600 rounded" ${p.can_mark_attendance ? 'checked' : ''}>
          </label>
          <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
            <span class="text-white font-medium">View Monitoring Dashboard</span>
            <input type="checkbox" id="perm-dash" class="w-4 h-4 text-blue-600 rounded" ${p.can_view_dashboard ? 'checked' : ''}>
          </label>
          <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
            <span class="text-white font-medium">View Analytics & Billing Reports</span>
            <input type="checkbox" id="perm-rep" class="w-4 h-4 text-blue-600 rounded" ${p.can_view_reports ? 'checked' : ''}>
          </label>
          <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
            <span class="text-white font-medium">Export Reports to Excel (.xlsx) / CSV</span>
            <input type="checkbox" id="perm-exp" class="w-4 h-4 text-blue-600 rounded" ${p.can_export_reports ? 'checked' : ''}>
          </label>
          <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
            <span class="text-white font-medium">Manage Supplier Master & Blocking</span>
            <input type="checkbox" id="perm-sup" class="w-4 h-4 text-blue-600 rounded" ${p.can_manage_suppliers ? 'checked' : ''}>
          </label>
          <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
            <span class="text-white font-medium">Manage Project Master & Completion Status</span>
            <input type="checkbox" id="perm-proj" class="w-4 h-4 text-blue-600 rounded" ${p.can_manage_projects ? 'checked' : ''}>
          </label>
          <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
            <span class="text-white font-medium">Manage User Accounts & Matrix</span>
            <input type="checkbox" id="perm-usr" class="w-4 h-4 text-blue-600 rounded" ${p.can_manage_users ? 'checked' : ''}>
          </label>
          <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
            <span class="text-amber-300 font-medium">Approve Past-Date / Retroactive Attendance</span>
            <input type="checkbox" id="perm-appr" class="w-4 h-4 text-amber-500 rounded" ${p.can_approve_backdated ? 'checked' : ''}>
          </label>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 text-xs text-slate-400 hover:text-white">Cancel</button>
          <button type="button" onclick="MastersModule.saveUserPermissions('${user.id}')" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg">Save Matrix</button>
        </div>
      </div>
    `);
  },

  async saveUserPermissions(userId) {
    try {
      const perms = {
        can_mark_attendance: document.getElementById('perm-att').checked,
        can_view_dashboard: document.getElementById('perm-dash').checked,
        can_view_reports: document.getElementById('perm-rep').checked,
        can_export_reports: document.getElementById('perm-exp').checked,
        can_manage_suppliers: document.getElementById('perm-sup').checked,
        can_manage_projects: document.getElementById('perm-proj').checked,
        can_manage_users: document.getElementById('perm-usr').checked,
        can_approve_backdated: document.getElementById('perm-appr').checked
      };

    App.showLoading(true);
    await FaithStore.updateUserPermissions(userId, perms);
    App.closeModal();
    App.showToast('✅ Authorisation matrix updated!', 'success');
    this.switchSubTab('users');
  } catch(err) {
    App.showToast(err.message, 'error');
  } finally {
    App.showLoading(false);
  }
},

  // ============================================================================
  // SUB-TAB 4: SHIFT & OT POLICIES
  // ============================================================================
  renderCalculationRules() {
    const rules = FaithStore.state.rules;

    return `
      <div class="glass-panel rounded-2xl p-5 shadow-lg border border-slate-700/50 max-w-2xl">
        <div class="pb-4 border-b border-slate-800 mb-5">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <i data-lucide="calculator" class="w-5 h-5 text-emerald-400"></i>
            Manday Calculation and OT Calculation Rules
          </h3>
          <p class="text-xs text-slate-400 mt-1">
            Global default rules. Note that each supplier and employee can also have their own specific shift hours & OT rates configured.
          </p>
        </div>

        <form id="calculation-rules-form" onsubmit="MastersModule.handleSaveRules(event)" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <label class="block text-xs font-semibold text-slate-300 mb-1">Standard Shift Hours (1.0 Manday)</label>
              <div class="flex items-center gap-2">
                <input type="number" step="0.5" min="4" max="12" id="rule-shift-hours" value="${rules.standard_shift_hours}" class="w-full bg-slate-950 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 font-mono font-bold">
                <span class="text-xs text-slate-400">hours</span>
              </div>
            </div>

            <div class="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <label class="block text-xs font-semibold text-slate-300 mb-1">Half Day Minimum Hours (0.5 Manday)</label>
              <div class="flex items-center gap-2">
                <input type="number" step="0.5" min="2" max="6" id="rule-half-hours" value="${rules.half_day_min_hours}" class="w-full bg-slate-950 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 font-mono font-bold">
                <span class="text-xs text-slate-400">hours</span>
              </div>
            </div>

            <div class="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <label class="block text-xs font-semibold text-slate-300 mb-1">OT Grace Buffer (Minutes)</label>
              <div class="flex items-center gap-2">
                <input type="number" min="0" max="60" id="rule-ot-grace" value="${rules.ot_grace_minutes}" class="w-full bg-slate-950 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 font-mono font-bold">
                <span class="text-xs text-slate-400">mins</span>
              </div>
            </div>

            <div class="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <label class="block text-xs font-semibold text-slate-300 mb-1">OT Rounding Interval</label>
              <select id="rule-ot-rounding" class="w-full bg-slate-950 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 font-medium">
                <option value="30" ${rules.ot_rounding_minutes === 30 ? 'selected' : ''}>Round to nearest 30 Mins (0.5 hr)</option>
                <option value="15" ${rules.ot_rounding_minutes === 15 ? 'selected' : ''}>Round to nearest 15 Mins (0.25 hr)</option>
                <option value="60" ${rules.ot_rounding_minutes === 60 ? 'selected' : ''}>Round to nearest 60 Mins (1.0 hr)</option>
                <option value="0" ${rules.ot_rounding_minutes === 0 ? 'selected' : ''}>Exact decimal calculation (no rounding)</option>
              </select>
            </div>
          </div>

          <button type="submit" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md">
            <i data-lucide="save" class="w-4 h-4"></i> Save Global Calculation Rules
          </button>
        </form>
      </div>
    `;
  },

    async handleSaveRules(e) {
  e.preventDefault();
  try {
    const shiftHours = parseFloat(document.getElementById('rule-shift-hours').value) || 8.0;
    const halfHours = parseFloat(document.getElementById('rule-half-hours').value) || 4.0;
    const otGrace = parseInt(document.getElementById('rule-ot-grace').value) || 15;
    const otRounding = parseInt(document.getElementById('rule-ot-rounding').value) || 30;

    App.showLoading(true);
    await FaithStore.updateRules({
      standard_shift_hours: shiftHours,
      half_day_min_hours: halfHours,
      ot_grace_minutes: otGrace,
      ot_rounding_minutes: otRounding
    });

    App.showToast('✅ Calculation Rules updated successfully!', 'success');
    this.switchSubTab('rules');
  } catch (err) {
    App.showToast(err.message, 'error');
  } finally {
    App.showLoading(false);
  }
},

// ============================================================================
// MODALS FOR CREATING RECORDS (WITH SEPARATE RATES & RULES)
// ============================================================================

openAddSupplierModal() {
  App.showModal(`
      <div class="space-y-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <i data-lucide="building-2" class="w-5 h-5 text-amber-400"></i> Add New Supplier Agency
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-300 mb-1">Supplier Code</label>
            <input type="text" id="modal-sup-code" placeholder="e.g. SUP-05" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">Agency Name <span class="text-red-400">*</span></label>
            <input type="text" id="modal-sup-name" placeholder="Agency Name" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-300 mb-1">Contact Person</label>
            <input type="text" id="modal-sup-contact" placeholder="Contact Name" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">Phone Number</label>
            <input type="text" id="modal-sup-phone" placeholder="+91 ..." class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
          </div>
        </div>
        
        <!-- SEPARATE ONSITE & INHOUSE RATES -->
        <div class="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div>
            <label class="block text-xs font-semibold text-blue-300 mb-1">Default On-site Rate (₹/day)</label>
            <input type="number" id="modal-sup-onsite" value="950.00" class="w-full bg-slate-950 text-white rounded-lg p-2 text-sm border border-slate-700 font-mono font-bold">
          </div>
          <div>
            <label class="block text-xs font-semibold text-indigo-300 mb-1">Default In-house Rate (₹/day)</label>
            <input type="number" id="modal-sup-inhouse" value="850.00" class="w-full bg-slate-950 text-white rounded-lg p-2 text-sm border border-slate-700 font-mono font-bold">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-300 mb-1">Default OT Rate (₹/hr)</label>
            <input type="number" id="modal-sup-ot" value="160.00" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700 font-mono font-bold">
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">Standard Shift Hours</label>
            <input type="number" step="0.5" id="modal-sup-shift" value="8.0" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700 font-mono">
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 text-xs text-slate-400 hover:text-white">Cancel</button>
          <button type="button" onclick="MastersModule.submitAddSupplier()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg">Save Supplier</button>
        </div>
      </div>
    `);
},

  async submitAddSupplier() {
  try {
    const code = document.getElementById('modal-sup-code').value;
    const name = document.getElementById('modal-sup-name').value;
    const contact = document.getElementById('modal-sup-contact').value;
    const phone = document.getElementById('modal-sup-phone').value;
    const onsite = document.getElementById('modal-sup-onsite').value;
    const inhouse = document.getElementById('modal-sup-inhouse').value;
    const ot = document.getElementById('modal-sup-ot').value;
    const shift = document.getElementById('modal-sup-shift').value;

    App.showLoading(true);
    await FaithStore.addSupplier({
      code,
      name,
      contact_person: contact,
      phone,
      default_onsite_manday_rate: onsite,
      default_inhouse_manday_rate: inhouse,
      default_ot_rate: ot,
      standard_shift_hours: shift
    });

    App.closeModal();
    App.showToast('✅ Supplier added with separate Onsite & Inhouse rates!', 'success');
    this.switchSubTab('suppliers');
  } catch (err) {
    App.showToast(err.message, 'error');
  } finally {
    App.showLoading(false);
  }
},

openAddEmployeeModal(defaultSupplierId) {
  const suppliers = FaithStore.state.suppliers;
  App.showModal(`
      <div class="space-y-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <i data-lucide="user-plus" class="w-5 h-5 text-emerald-400"></i> Add Manpower Worker (With Specific Rates & Rules)
        </h3>
        <div>
          <label class="block text-xs text-slate-300 mb-1">Supplier Agency <span class="text-red-400">*</span></label>
          <select id="modal-emp-supplier" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
            ${suppliers.map(s => `
              <option value="${s.id}" ${s.id === defaultSupplierId ? 'selected' : ''}>${s.code} - ${s.name}</option>
            `).join('')}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-300 mb-1">Employee Code</label>
            <input type="text" id="modal-emp-code" placeholder="e.g. JBB-W05" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">Trade / Skill <span class="text-red-400">*</span></label>
            <select id="modal-emp-trade" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
              <option value="Wireman">Wireman</option>
              <option value="Fitter">Fitter</option>
              <option value="Welder">Welder</option>
              <option value="Helper">Helper</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Controls Tech">Controls Tech</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-xs text-slate-300 mb-1">Worker Full Name <span class="text-red-400">*</span></label>
          <input type="text" id="modal-emp-name" placeholder="Worker Full Name" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
        </div>

        <!-- EMPLOYEE SPECIFIC RATES (ONSITE & INHOUSE) -->
        <div class="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div>
            <label class="block text-xs font-semibold text-blue-300 mb-1">Employee On-site Rate (₹/day)</label>
            <input type="number" id="modal-emp-onsite" value="950.00" class="w-full bg-slate-950 text-white rounded-lg p-2 text-sm border border-slate-700 font-mono font-bold">
          </div>
          <div>
            <label class="block text-xs font-semibold text-indigo-300 mb-1">Employee In-house Rate (₹/day)</label>
            <input type="number" id="modal-emp-inhouse" value="850.00" class="w-full bg-slate-950 text-white rounded-lg p-2 text-sm border border-slate-700 font-mono font-bold">
          </div>
        </div>

        <!-- EMPLOYEE SPECIFIC OT & SHIFT RULES -->
        <div class="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div>
            <label class="block text-xs font-semibold text-purple-300 mb-1">Employee OT Rate (₹/hr)</label>
            <input type="number" id="modal-emp-ot" value="160.00" class="w-full bg-slate-950 text-white rounded-lg p-2 text-sm border border-slate-700 font-mono font-bold">
          </div>
          <div>
            <label class="block text-xs font-semibold text-emerald-300 mb-1">Shift Duration Rule</label>
            <div class="flex items-center gap-1">
              <input type="number" step="0.5" id="modal-emp-shift" value="8.0" class="w-full bg-slate-950 text-white rounded-lg p-2 text-sm border border-slate-700 font-mono">
              <span class="text-xs text-slate-400">h</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 text-xs text-slate-400 hover:text-white">Cancel</button>
          <button type="button" onclick="MastersModule.submitAddEmployee()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg">Save Worker</button>
        </div>
      </div>
    `);
},

  async submitAddEmployee() {
  try {
    const supplierId = document.getElementById('modal-emp-supplier').value;
    const code = document.getElementById('modal-emp-code').value;
    const trade = document.getElementById('modal-emp-trade').value;
    const name = document.getElementById('modal-emp-name').value;
    const onsite = document.getElementById('modal-emp-onsite').value;
    const inhouse = document.getElementById('modal-emp-inhouse').value;
    const ot = document.getElementById('modal-emp-ot').value;
    const shift = document.getElementById('modal-emp-shift').value;

    App.showLoading(true);
    await FaithStore.addEmployee({
      supplier_id: supplierId,
      employee_code: code,
      trade,
      name,
      onsite_manday_rate: onsite,
      inhouse_manday_rate: inhouse,
      ot_rate: ot,
      standard_shift_hours: shift,
      is_blocked: false,
      is_enabled: true
    });

    App.closeModal();
    App.showToast('✅ Worker added with individual rates & OT rules!', 'success');
    this.selectedSupplierForManpower = supplierId;
    this.switchSubTab('suppliers');
  } catch (err) {
    App.showToast(err.message, 'error');
  } finally {
    App.showLoading(false);
  }
},

openAddProjectModal() {
  App.showModal(`
      <div class="space-y-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <i data-lucide="folder-kanban" class="w-5 h-5 text-blue-400"></i> Add New Project
        </h3>
        <div>
          <label class="block text-xs text-slate-300 mb-1">Project Code <span class="text-red-400">*</span></label>
          <input type="text" id="modal-proj-code" placeholder="e.g. FA-310" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
        </div>
        <div>
          <label class="block text-xs text-slate-300 mb-1">Project Title <span class="text-red-400">*</span></label>
          <input type="text" id="modal-proj-title" placeholder="Description or station line" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
        </div>
        <div>
          <label class="block text-xs text-slate-300 mb-1">Customer <span class="text-red-400">*</span></label>
          <input type="text" id="modal-proj-customer" placeholder="e.g. Tata Motors" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
        </div>
        <div>
          <label class="block text-xs text-slate-300 mb-1">Location</label>
          <input type="text" id="modal-proj-location" placeholder="e.g. Pune Plant / Inhouse" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 text-xs text-slate-400 hover:text-white">Cancel</button>
          <button type="button" onclick="MastersModule.submitAddProject()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg">Save Project</button>
        </div>
      </div>
    `);
},

  async submitAddProject() {
  try {
    const code = document.getElementById('modal-proj-code').value;
    const title = document.getElementById('modal-proj-title').value;
    const customer = document.getElementById('modal-proj-customer').value;
    const location = document.getElementById('modal-proj-location').value;

    App.showLoading(true);
    await FaithStore.addProject({
      code,
      title,
      customer,
      location,
      status: 'Active'
    });

    App.closeModal();
    App.showToast('✅ Project created successfully!', 'success');
    this.switchSubTab('projects');
  } catch (err) {
    App.showToast(err.message, 'error');
  } finally {
    App.showLoading(false);
  }
},

openAddUserModal() {
  App.showModal(`
      <div class="space-y-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <i data-lucide="user-plus" class="w-5 h-5 text-purple-400"></i> Create User Account
        </h3>
        <div>
          <label class="block text-xs text-slate-300 mb-1">Full Name <span class="text-red-400">*</span></label>
          <input type="text" id="modal-user-name" placeholder="Supervisor Name" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
        </div>
        <div>
          <label class="block text-xs text-slate-300 mb-1">Email / Login ID <span class="text-red-400">*</span></label>
          <input type="email" id="modal-user-email" placeholder="supervisor@faithengineers.com" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-300 mb-1">Role <span class="text-red-400">*</span></label>
            <select id="modal-user-role" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
              <option value="supervisor">Site Supervisor</option>
              <option value="admin">App Admin / Management</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">Employee Code</label>
            <input type="text" id="modal-user-code" placeholder="FE-SUP-05" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-300 mb-1">Login Password <span class="text-red-400">*</span></label>
            <input type="password" id="modal-user-pass" value="pass123" class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
          </div>
          <div>
            <label class="block text-xs text-slate-300 mb-1">Phone</label>
            <input type="text" id="modal-user-phone" placeholder="+91 ..." class="w-full bg-slate-900 text-white rounded-lg p-2.5 text-sm border border-slate-700">
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 text-xs text-slate-400 hover:text-white">Cancel</button>
          <button type="button" onclick="MastersModule.submitAddUser()" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg">Create Account</button>
        </div>
      </div>
    `);
},

  async submitAddUser() {
  try {
    const name = document.getElementById('modal-user-name').value;
    const email = document.getElementById('modal-user-email').value;
    const role = document.getElementById('modal-user-role').value;
    const code = document.getElementById('modal-user-code').value;
    const pass = document.getElementById('modal-user-pass').value;
    const phone = document.getElementById('modal-user-phone').value;

    App.showLoading(true);
    await FaithStore.addUser({
      full_name: name,
      email,
      role,
      employee_code: code,
      password: pass,
      phone,
      is_active: true
    });

    App.closeModal();
    App.showToast(`✅ Supervisor account created for ${name}! Share credentials with them.`, 'success');
    this.switchSubTab('users');
  } catch (err) {
    App.showToast(err.message, 'error');
  } finally {
    App.showLoading(false);
  }
}
};

window.MastersModule = MastersModule;
