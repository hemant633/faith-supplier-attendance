// ==============================================================================
// FAITH ENGINEERS - ATTENDANCE MARKING MODULE (v2.1)
// With Past Date Selection & Manager Approval Workflow
// ==============================================================================

const AttendanceModule = {
  selectedProject: '',
  selectedLocation: 'Onsite',
  selectedSupplier: '',
  selectedDate: '', // Defaults to current date, supports selecting past dates
  selectedInWorkers: new Set(),
  selectedOutWorkers: new Set(),

  init() {
    if (!this.selectedDate) {
      this.selectedDate = this.getTodayDateString();
    }
    this.renderAttendanceView();
  },

  getCurrentTimeString() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  getTodayDateString() {
    return new Date().toISOString().split('T')[0];
  },

  renderAttendanceView() {
    const container = document.getElementById('tab-attendance');
    if (!container) return;

    const user = FaithAuth.getCurrentUser();
    if (!user) {
      container.innerHTML = `<div class="p-8 text-center text-slate-400">Please log in to mark attendance.</div>`;
      return;
    }

    const todayStr = this.getTodayDateString();
    if (!this.selectedDate) {
      this.selectedDate = todayStr;
    }
    const isBackdated = this.selectedDate < todayStr;

    // Filter Active projects only (Completed projects hidden)
    const activeProjects = FaithStore.state.projects.filter(p => p.status === 'Active');

    // Filter Unblocked suppliers only
    const unblockedSuppliers = FaithStore.state.suppliers.filter(s => s.is_blocked !== true && s.is_active !== false);

    // Default selection
    if ((!this.selectedProject || !activeProjects.some(p => p.code === this.selectedProject)) && activeProjects.length > 0) {
      this.selectedProject = activeProjects[0].code;
    }
    if ((!this.selectedSupplier || !unblockedSuppliers.some(s => s.id === this.selectedSupplier)) && unblockedSuppliers.length > 0) {
      this.selectedSupplier = unblockedSuppliers[0].id;
    }

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Top Supervisor Header Card -->
        <div class="glass-panel rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
          <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Supervisor Portal
                </span>
                <span class="text-xs text-slate-400">Live Operating Date: <strong class="text-white">${new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
              </div>
              <h2 class="text-xl sm:text-2xl font-bold text-white mt-1">Daily Supplier Attendance Marking</h2>
              <p class="text-sm text-slate-400">Mark daily check-in (In Time) & check-out (Out Time) with mandatory work activity log.</p>
            </div>

            <div class="flex items-center gap-3">
              <div class="text-right">
                <p class="text-xs text-slate-400">Supervisor On Duty</p>
                <p class="text-sm font-semibold text-white">${user.full_name}</p>
                <span class="text-xs text-emerald-400 font-mono">${user.employee_code || user.role.toUpperCase()}</span>
              </div>
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                ${user.full_name.charAt(0)}
              </div>
            </div>
          </div>
        </div>

        <!-- DATE SELECTION BAR & RETROACTIVE NOTICE -->
        <div class="glass-panel rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-700/60">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <label class="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <i data-lucide="calendar" class="w-4 h-4 text-emerald-400"></i>
                Shift Attendance Date <span class="text-red-400">*</span>
              </label>
              <p class="text-xs text-slate-400">Defaults to current date. Supervisors can select past dates to backfill missed attendance.</p>
            </div>

            <!-- Date Selector with Quick Buttons -->
            <div class="flex items-center gap-2">
              <input type="date" id="attendance-date-select" max="${todayStr}" value="${this.selectedDate}" class="bg-slate-900 text-white rounded-xl px-3 py-2 text-sm border border-slate-700 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <button type="button" id="btn-date-today" class="px-3 py-2 text-xs font-semibold rounded-xl transition-all ${this.selectedDate === todayStr ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}">
                Today
              </button>
              <button type="button" id="btn-date-yesterday" class="px-3 py-2 text-xs font-semibold rounded-xl transition-all ${this.selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0] ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}">
                Yesterday
              </button>
            </div>
          </div>

          <!-- Retroactive / Manager Approval Alert Banner (Shown if date is in the past) -->
          <div id="backdated-notice-banner" class="${isBackdated ? 'flex' : 'hidden'} items-center gap-3 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
            <i data-lucide="clock-alert" class="w-5 h-5 text-amber-400 shrink-0"></i>
            <div>
              <strong class="font-bold text-amber-300">Retroactive Attendance Warning:</strong>
              You are marking attendance for past date <strong class="underline">${this.selectedDate}</strong>. 
              As per company policy, this attendance will be submitted for <strong>Manager Approval</strong> before approval for billing.
            </div>
          </div>
        </div>

        <!-- Project, Location & Supplier Selectors -->
        <div class="glass-panel rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-700/50">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <!-- 1. Active Project Code Dropdown -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  <i data-lucide="folder-kanban" class="inline w-3.5 h-3.5 mr-1 text-blue-400"></i>
                  1. Active Project <span class="text-red-400">*</span>
                </label>
                <span class="text-[10px] text-emerald-400 font-semibold">(Active Only)</span>
              </div>
              <select id="attendance-project-select" class="w-full bg-slate-900 text-white rounded-xl px-3.5 py-2.5 text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium">
                ${activeProjects.length === 0 ? `
                  <option value="">No Active Projects Available</option>
                ` : activeProjects.map(p => `
                  <option value="${p.code}" ${p.code === this.selectedProject ? 'selected' : ''}>
                    ${p.code} - ${p.title} (${p.customer})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- 2. Location (Onsite or Inhouse) -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  <i data-lucide="map-pin" class="inline w-3.5 h-3.5 mr-1 text-emerald-400"></i>
                  2. Deployment Location <span class="text-red-400">*</span>
                </label>
                <span id="rate-mode-badge" class="text-[10px] text-blue-400 font-mono">Applying ${this.selectedLocation} Rates</span>
              </div>
              <div class="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-700">
                <button type="button" id="loc-btn-onsite" class="location-btn py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${this.selectedLocation === 'Onsite' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
                  <i data-lucide="hard-hat" class="inline w-3.5 h-3.5 mr-1"></i> Onsite (Plant)
                </button>
                <button type="button" id="loc-btn-inhouse" class="location-btn py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${this.selectedLocation === 'Inhouse' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}">
                  <i data-lucide="factory" class="inline w-3.5 h-3.5 mr-1"></i> Inhouse (Bay)
                </button>
              </div>
            </div>

            <!-- 3. Supplier Dropdown (Unblocked only) -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  <i data-lucide="building-2" class="inline w-3.5 h-3.5 mr-1 text-amber-400"></i>
                  3. Supplier Agency <span class="text-red-400">*</span>
                </label>
                <span class="text-[10px] text-slate-400">(Unblocked)</span>
              </div>
              <select id="attendance-supplier-select" class="w-full bg-slate-900 text-white rounded-xl px-3.5 py-2.5 text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium">
                ${unblockedSuppliers.length === 0 ? `
                  <option value="">No Unblocked Suppliers Available</option>
                ` : unblockedSuppliers.map(s => `
                  <option value="${s.id}" ${s.id === this.selectedSupplier ? 'selected' : ''}>
                    ${s.code} - ${s.name} (${s.contact_person || 'Active'})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- FORGOTTEN / UNCLOSED OUT-PUNCHES IDENTIFIER WIDGET -->
        ${this.renderForgottenOutPunchesBanner()}

        <!-- Attendance Operation Columns (Mark IN vs Mark OUT) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- LEFT COLUMN: STEP 4 - MARK IN TIME -->
          <div class="glass-panel rounded-2xl p-5 shadow-lg border border-slate-700/60 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
                <div class="flex items-center gap-2">
                  <span class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">4</span>
                  <div>
                    <h3 class="font-bold text-white text-base">Mark IN Time (Shift Start)</h3>
                    <p class="text-xs text-slate-400">For Date: <strong class="text-emerald-400 font-mono">${this.selectedDate}</strong></p>
                  </div>
                </div>
                <div class="flex items-center gap-1.5">
                  <input type="time" id="mark-in-time" value="${this.getCurrentTimeString()}" class="bg-slate-900 border border-slate-700 text-emerald-400 font-mono text-sm font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500">
                  <button type="button" id="btn-now-in" class="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700">Now</button>
                </div>
              </div>

              <!-- Supplier Employee Selection Header -->
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-slate-300">Supplier Employees Roster:</span>
                <div class="flex items-center gap-2">
                  <button type="button" id="btn-select-all-in" class="text-xs text-blue-400 hover:text-blue-300 underline font-medium">Select All</button>
                  <span class="text-slate-600">|</span>
                  <button type="button" id="btn-clear-all-in" class="text-xs text-slate-400 hover:text-white underline font-medium">Clear</button>
                </div>
              </div>

              <div id="supplier-employees-roster" class="space-y-2 max-h-72 overflow-y-auto pr-1">
                <!-- Dynamically populated -->
              </div>
            </div>

            <div class="pt-4 border-t border-slate-700/60 mt-4">
              <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Selected: <strong id="selected-in-count" class="text-emerald-400 font-bold">0</strong> workers</span>
                <span class="text-slate-400">${isBackdated ? 'Requires Manager Approval' : 'Auto-Approved on-time'}</span>
              </div>
              <button type="button" id="btn-submit-mark-in" class="w-full touch-target bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all">
                <i data-lucide="log-in" class="w-4 h-4"></i>
                Confirm Mark IN Time (${this.selectedDate})
              </button>
            </div>
          </div>

          <!-- RIGHT COLUMN: STEP 5 - MARK OUT TIME & MANDATORY ACTIVITY -->
          <div class="glass-panel rounded-2xl p-5 shadow-lg border border-slate-700/60 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
                <div class="flex items-center gap-2">
                  <span class="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">5</span>
                  <div>
                    <h3 class="font-bold text-white text-base">Mark OUT Time (Work Finish)</h3>
                    <p class="text-xs text-slate-400">Record departure & mandatory activity</p>
                  </div>
                </div>
                <div class="flex items-center gap-1.5">
                  <input type="time" id="mark-out-time" value="${this.getCurrentTimeString()}" class="bg-slate-900 border border-slate-700 text-blue-400 font-mono text-sm font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500">
                  <button type="button" id="btn-now-out" class="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700">Now</button>
                </div>
              </div>

              <!-- Currently Working Workers List for selected date -->
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-slate-300">Currently Working for ${this.selectedDate}:</span>
                <div class="flex items-center gap-2">
                  <button type="button" id="btn-select-all-out" class="text-xs text-blue-400 hover:text-blue-300 underline font-medium">Select All</button>
                  <span class="text-slate-600">|</span>
                  <button type="button" id="btn-clear-all-out" class="text-xs text-slate-400 hover:text-white underline font-medium">Clear</button>
                </div>
              </div>

              <div id="currently-working-roster" class="space-y-2 max-h-48 overflow-y-auto pr-1">
                <!-- Dynamically populated -->
              </div>

              <!-- MANDATORY ACTIVITY FIELD -->
              <div class="mt-4 pt-3 border-t border-slate-700/60">
                <div class="flex items-center justify-between mb-1.5">
                  <label for="manpower-activity-input" class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <i data-lucide="clipboard-pen" class="w-3.5 h-3.5 text-amber-400"></i>
                    Manpower Activity Performed
                  </label>
                  <span class="badge-mandatory">
                    <i data-lucide="alert-circle" class="w-3 h-3"></i> MANDATORY FIELD
                  </span>
                </div>
                <textarea id="manpower-activity-input" rows="2" placeholder="e.g. Completed fixture wiring on Jig #2, route cable trays, sensor mounting and pneumatic testing..." class="w-full bg-slate-900 text-white rounded-xl p-3 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"></textarea>
                <p class="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
                  <i data-lucide="info" class="w-3 h-3"></i> Mandatory field. Cannot submit shift without describing activity.
                </p>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-700/60 mt-4">
              <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Selected: <strong id="selected-out-count" class="text-blue-400 font-bold">0</strong> workers</span>
                <span class="text-slate-400">Auto Manday & OT Calculation applied</span>
              </div>
              <button type="button" id="btn-submit-mark-out" class="w-full touch-target bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all">
                <i data-lucide="log-out" class="w-4 h-4"></i>
                Confirm Mark OUT & Save Activity
              </button>
            </div>
          </div>
        </div>

        <!-- Attendance Register Table (Shows Approval Status) -->
        <div class="glass-panel rounded-2xl p-5 shadow-lg border border-slate-700/50">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i data-lucide="calendar-check-2" class="w-5 h-5 text-emerald-400"></i>
                Attendance Register for Date: <span class="font-mono text-emerald-400">${this.selectedDate}</span>
              </h3>
              <p class="text-xs text-slate-400">Real-time attendance register including Approval Status for retroactive punches.</p>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" id="btn-refresh-today-sheet" class="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1.5">
                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Refresh
              </button>
            </div>
          </div>

          <div class="overflow-x-auto mt-4">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-slate-900/80 text-slate-300 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th class="px-3 py-2.5 rounded-l-lg">Status</th>
                  <th class="px-3 py-2.5">Approval Status</th>
                  <th class="px-3 py-2.5">Worker Name</th>
                  <th class="px-3 py-2.5">Trade</th>
                  <th class="px-3 py-2.5">Supplier</th>
                  <th class="px-3 py-2.5">Project</th>
                  <th class="px-3 py-2.5">Location</th>
                  <th class="px-3 py-2.5">In Time</th>
                  <th class="px-3 py-2.5">Out Time</th>
                  <th class="px-3 py-2.5">Hours</th>
                  <th class="px-3 py-2.5">Mandays</th>
                  <th class="px-3 py-2.5">OT (Hrs)</th>
                  <th class="px-3 py-2.5 rounded-r-lg">Activity Description</th>
                </tr>
              </thead>
              <tbody id="today-attendance-tbody" class="divide-y divide-slate-800 text-slate-200">
                <!-- Dynamically loaded rows -->
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this.bindEvents();
    this.refreshEmployeeRoster();
    this.refreshCurrentlyWorkingRoster();
    this.renderTodayAttendanceTable();
  },

  bindEvents() {
    // Date selection change
    const dateInput = document.getElementById('attendance-date-select');
    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        this.selectedDate = e.target.value;
        this.selectedInWorkers.clear();
        this.selectedOutWorkers.clear();
        this.renderAttendanceView();
      });
    }

    // Quick Date Buttons
    const btnDateToday = document.getElementById('btn-date-today');
    if (btnDateToday) {
      btnDateToday.addEventListener('click', () => {
        this.selectedDate = this.getTodayDateString();
        this.renderAttendanceView();
      });
    }

    const btnDateYesterday = document.getElementById('btn-date-yesterday');
    if (btnDateYesterday) {
      btnDateYesterday.addEventListener('click', () => {
        const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        this.selectedDate = yest;
        this.renderAttendanceView();
      });
    }

    // Project selection
    const projSelect = document.getElementById('attendance-project-select');
    if (projSelect) {
      projSelect.addEventListener('change', (e) => {
        this.selectedProject = e.target.value;
        this.refreshCurrentlyWorkingRoster();
      });
    }

    // Location selection
    const btnOnsite = document.getElementById('loc-btn-onsite');
    const btnInhouse = document.getElementById('loc-btn-inhouse');
    const badgeRate = document.getElementById('rate-mode-badge');

    if (btnOnsite && btnInhouse) {
      btnOnsite.addEventListener('click', () => {
        this.selectedLocation = 'Onsite';
        btnOnsite.className = 'location-btn py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all bg-blue-600 text-white shadow-md';
        btnInhouse.className = 'location-btn py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-slate-400 hover:text-white';
        if (badgeRate) badgeRate.innerText = 'Applying Onsite Rates';
        this.refreshEmployeeRoster();
      });
      btnInhouse.addEventListener('click', () => {
        this.selectedLocation = 'Inhouse';
        btnInhouse.className = 'location-btn py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all bg-indigo-600 text-white shadow-md';
        btnOnsite.className = 'location-btn py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-slate-400 hover:text-white';
        if (badgeRate) badgeRate.innerText = 'Applying Inhouse Rates';
        this.refreshEmployeeRoster();
      });
    }

    // Supplier selection
    const supSelect = document.getElementById('attendance-supplier-select');
    if (supSelect) {
      supSelect.addEventListener('change', (e) => {
        this.selectedSupplier = e.target.value;
        this.selectedInWorkers.clear();
        this.refreshEmployeeRoster();
        this.refreshCurrentlyWorkingRoster();
      });
    }

    // Quick Time
    const btnNowIn = document.getElementById('btn-now-in');
    if (btnNowIn) btnNowIn.addEventListener('click', () => {
      document.getElementById('mark-in-time').value = this.getCurrentTimeString();
    });

    const btnNowOut = document.getElementById('btn-now-out');
    if (btnNowOut) btnNowOut.addEventListener('click', () => {
      document.getElementById('mark-out-time').value = this.getCurrentTimeString();
    });

    // Mark IN Selection Controls
    const btnSelectAllIn = document.getElementById('btn-select-all-in');
    if (btnSelectAllIn) {
      btnSelectAllIn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.in-worker-cb:not(:disabled)');
        checkboxes.forEach(cb => {
          cb.checked = true;
          this.selectedInWorkers.add(cb.value);
          const card = document.getElementById(`in-card-${cb.value}`);
          if (card) card.classList.add('selected');
        });
        this.updateInCount();
      });
    }

    const btnClearAllIn = document.getElementById('btn-clear-all-in');
    if (btnClearAllIn) {
      btnClearAllIn.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.in-worker-cb');
        checkboxes.forEach(cb => {
          cb.checked = false;
          const card = document.getElementById(`in-card-${cb.value}`);
          if (card) card.classList.remove('selected');
        });
        this.selectedInWorkers.clear();
        this.updateInCount();
      });
    }

    // Mark OUT Selection Controls
    const btnSelectAllOut = document.getElementById('btn-select-all-out');
    if (btnSelectAllOut) {
      btnSelectAllOut.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.out-worker-cb');
        checkboxes.forEach(cb => {
          cb.checked = true;
          this.selectedOutWorkers.add(cb.value);
          const card = document.getElementById(`out-card-${cb.value}`);
          if (card) card.classList.add('selected');
        });
        this.updateOutCount();
      });
    }

    const btnClearAllOut = document.getElementById('btn-clear-all-out');
    if (btnClearAllOut) {
      btnClearAllOut.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.out-worker-cb');
        checkboxes.forEach(cb => {
          cb.checked = false;
          const card = document.getElementById(`out-card-${cb.value}`);
          if (card) card.classList.remove('selected');
        });
        this.selectedOutWorkers.clear();
        this.updateOutCount();
      });
    }

    // Submissions
    const btnSubmitIn = document.getElementById('btn-submit-mark-in');
    if (btnSubmitIn) btnSubmitIn.addEventListener('click', async () => this.handleMarkInSubmit());

    const btnSubmitOut = document.getElementById('btn-submit-mark-out');
    if (btnSubmitOut) btnSubmitOut.addEventListener('click', async () => this.handleMarkOutSubmit());

    const btnRefresh = document.getElementById('btn-refresh-today-sheet');
    if (btnRefresh) btnRefresh.addEventListener('click', () => {
      this.renderTodayAttendanceTable();
      this.refreshCurrentlyWorkingRoster();
    });
  },

  refreshEmployeeRoster() {
    const container = document.getElementById('supplier-employees-roster');
    if (!container) return;

    if (!this.selectedSupplier) {
      container.innerHTML = `<p class="text-xs text-slate-500 py-4 text-center">Please select a supplier first.</p>`;
      return;
    }

    const supplier = FaithStore.state.suppliers.find(s => s.id === this.selectedSupplier);
    if (supplier && supplier.is_blocked) {
      container.innerHTML = `
        <div class="p-4 text-center text-xs text-red-400 bg-red-950/20 rounded-xl border border-red-500/30">
          <i data-lucide="ban" class="w-6 h-6 mx-auto mb-1 text-red-400"></i>
          <strong>SUPPLIER BLOCKED BY MANAGEMENT</strong><br>
          <span class="text-slate-400">Attendance marking is not permitted for ${supplier.name}.</span>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const targetDate = this.selectedDate;

    const employees = FaithStore.state.employees.filter(e =>
      e.supplier_id === this.selectedSupplier &&
      e.is_enabled !== false
    );

    if (employees.length === 0) {
      container.innerHTML = `
        <div class="p-4 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
          <i data-lucide="user-x" class="w-6 h-6 mx-auto mb-1 text-slate-500"></i>
          No active employees enrolled for this supplier.<br>
          <span class="text-slate-500">Enable workers or add them in Supplier Master.</span>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = employees.map(emp => {
      const isBlocked = emp.is_blocked === true;

      // Check if already checked in or completed on selectedDate
      const existingRecord = FaithStore.state.attendance.find(a =>
        a.date === targetDate &&
        a.employee_id === emp.id
      );

      const isWorking = existingRecord && existingRecord.status === 'WORKING';
      const isCompleted = existingRecord && existingRecord.status === 'COMPLETED';
      const hasAttendanceToday = !!existingRecord;

      // RESTRICTION: Disable if blocked OR already marked for attendance on this date
      const isDisabled = isBlocked || hasAttendanceToday;
      const isChecked = this.selectedInWorkers.has(emp.id) && !isDisabled;

      const applicableRate = this.selectedLocation === 'Onsite' ?
        (emp.onsite_manday_rate || supplier.default_onsite_manday_rate) :
        (emp.inhouse_manday_rate || supplier.default_inhouse_manday_rate);

      let badgeHtml = '';
      if (isBlocked) {
        badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
          <i data-lucide="ban" class="w-3 h-3"></i> BLOCKED
        </span>`;
      } else if (isWorking) {
        badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> In (${existingRecord.in_time}) - Working
        </span>`;
      } else if (isCompleted) {
        badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
          <i data-lucide="shield-alert" class="w-3 h-3"></i> Shift Done (${existingRecord.hours_worked}h) - Double Attendance Restricted
        </span>`;
      } else {
        badgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">Available</span>`;
      }

      return `
        <div id="in-card-${emp.id}" class="worker-card p-3 rounded-xl bg-slate-900/80 border border-slate-700/70 flex items-center justify-between gap-3 ${isChecked ? 'selected' : ''} ${isDisabled ? 'already-in opacity-60 cursor-not-allowed' : 'cursor-pointer'}" onclick="AttendanceModule.toggleInWorkerSelection('${emp.id}', ${isDisabled}, ${hasAttendanceToday}, '${emp.name.replace(/'/g, "\\'")}')">
          <div class="flex items-center gap-3">
            <input type="checkbox" value="${emp.id}" class="in-worker-cb w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-600 focus:ring-emerald-500 pointer-events-none" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-white">${emp.name}</span>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">${emp.trade}</span>
                ${isBlocked ? '<span class="text-[10px] text-red-400 font-bold">(Blocked)</span>' : ''}
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5">
                <span class="text-emerald-400 font-bold">${this.selectedLocation}: ₹${applicableRate}/day</span> | OT: ₹${emp.ot_rate}/hr | Shift: ${emp.standard_shift_hours || 8}h
              </div>
            </div>
          </div>
          <div>
            ${badgeHtml}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
    this.updateInCount();
  },

    toggleInWorkerSelection(empId, isDisabled, hasAttendanceToday = false, empName = 'Worker') {
      if (isDisabled) {
        if (hasAttendanceToday) {
          App.showToast(`🚫 Restriction: "${empName}" already has an attendance record on this date. Double attendance is prohibited.`, 'warning');
        }
        return;
      }
      const card = document.getElementById(`in-card-${empId}`);
      const cb = card ? card.querySelector('.in-worker-cb') : null;

      if (this.selectedInWorkers.has(empId)) {
        this.selectedInWorkers.delete(empId);
        if (card) card.classList.remove('selected');
        if (cb) cb.checked = false;
      } else {
        this.selectedInWorkers.add(empId);
        if (card) card.classList.add('selected');
        if (cb) cb.checked = true;
      }
      this.updateInCount();
    },

    updateInCount() {
      const el = document.getElementById('selected-in-count');
      if (el) el.innerText = this.selectedInWorkers.size;
    },

    refreshCurrentlyWorkingRoster() {
      const container = document.getElementById('currently-working-roster');
      if (!container) return;

      const targetDate = this.selectedDate;

      // Filter working records for the selectedDate
      const workingRecords = FaithStore.state.attendance.filter(a =>
        a.date === targetDate &&
        a.status === 'WORKING' &&
        (!this.selectedProject || a.project_code === this.selectedProject)
      );

      if (workingRecords.length === 0) {
        container.innerHTML = `
        <div class="p-4 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
          <i data-lucide="check-circle" class="w-6 h-6 mx-auto mb-1 text-slate-500"></i>
          No open shifts currently pending for ${this.selectedDate} on Project ${this.selectedProject || 'selected'}.<br>
          <span class="text-slate-500">Mark workers IN first using Step 4.</span>
        </div>
      `;
        if (window.lucide) window.lucide.createIcons();
        this.updateOutCount();
        return;
      }

      container.innerHTML = workingRecords.map(rec => {
        const isChecked = this.selectedOutWorkers.has(rec.id);
        return `
        <div id="out-card-${rec.id}" class="worker-card p-3 rounded-xl bg-slate-900/80 border border-slate-700/70 flex items-center justify-between gap-3 ${isChecked ? 'selected' : ''}" onclick="AttendanceModule.toggleOutWorkerSelection('${rec.id}')">
          <div class="flex items-center gap-3">
            <input type="checkbox" value="${rec.id}" class="out-worker-cb w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-600 focus:ring-blue-500 cursor-pointer pointer-events-none" ${isChecked ? 'checked' : ''}>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-white">${rec.employee_name}</span>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">${rec.trade}</span>
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5">
                ${rec.supplier_name} | <span class="text-emerald-400 font-mono">IN: ${rec.in_time}</span> (${rec.location_type})
              </div>
            </div>
          </div>
          <div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Working
            </span>
          </div>
        </div>
      `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();
      this.updateOutCount();
    },

    toggleOutWorkerSelection(recordId) {
      const card = document.getElementById(`out-card-${recordId}`);
      const cb = card ? card.querySelector('.out-worker-cb') : null;

      if (this.selectedOutWorkers.has(recordId)) {
        this.selectedOutWorkers.delete(recordId);
        if (card) card.classList.remove('selected');
        if (cb) cb.checked = false;
      } else {
        this.selectedOutWorkers.add(recordId);
        if (card) card.classList.add('selected');
        if (cb) cb.checked = true;
      }
      this.updateOutCount();
    },

    updateOutCount() {
      const el = document.getElementById('selected-out-count');
      if (el) el.innerText = this.selectedOutWorkers.size;
    },

  async handleMarkInSubmit() {
      try {
        const inTime = document.getElementById('mark-in-time').value;
        const user = FaithAuth.getCurrentUser();
        const empIds = Array.from(this.selectedInWorkers);

        if (empIds.length === 0) {
          App.showToast('Please select at least one employee from the roster.', 'warning');
          return;
        }

        App.showLoading(true);
        const result = await FaithStore.markInAttendance({
          projectCode: this.selectedProject,
          locationType: this.selectedLocation,
          supplierId: this.selectedSupplier,
          employeeIds: empIds,
          inTime: inTime,
          supervisorName: user ? user.full_name : 'Supervisor',
          attendanceDate: this.selectedDate
        });

        this.selectedInWorkers.clear();
        this.refreshEmployeeRoster();
        this.refreshCurrentlyWorkingRoster();
        this.renderTodayAttendanceTable();

        if (result.isBackdated) {
          App.showToast(`⚠️ Marked IN for past date (${this.selectedDate}). Shift submitted for Manager Approval.`, 'warning');
        } else {
          App.showToast(`✅ Successfully marked IN time (${inTime}) on ${this.selectedDate}!`, 'success');
        }
      } catch (err) {
        App.showToast(err.message, 'error');
      } finally {
        App.showLoading(false);
      }
    },

  async handleMarkOutSubmit() {
      try {
        const outTime = document.getElementById('mark-out-time').value;
        const activityInput = document.getElementById('manpower-activity-input');
        const activity = activityInput ? activityInput.value.trim() : '';
        const user = FaithAuth.getCurrentUser();
        const attIds = Array.from(this.selectedOutWorkers);

        if (attIds.length === 0) {
          App.showToast('Please select at least one currently working employee to mark Out time.', 'warning');
          return;
        }

        if (!activity || activity.length < 5) {
          if (activityInput) activityInput.focus();
          App.showToast('⚠️ MANDATORY REQUIREMENT: Please enter the manpower activity performed (min 5 characters).', 'error');
          return;
        }

        App.showLoading(true);
        const results = await FaithStore.markOutAttendance({
          attendanceIds: attIds,
          outTime: outTime,
          activityDescription: activity,
          supervisorName: user ? user.full_name : 'Supervisor'
        });

        this.selectedOutWorkers.clear();
        if (activityInput) activityInput.value = '';

        this.refreshEmployeeRoster();
        this.refreshCurrentlyWorkingRoster();
        this.renderTodayAttendanceTable();

        const longShifts = (results || []).filter(r => r.hours_worked > 14.0);
        if (longShifts.length > 0) {
          App.showToast(`⚠️ Alert: Shift duration (${longShifts[0].hours_worked}h) exceeds 14.0 hours limit for ${longShifts.length} worker(s). Marked COMPLETED and submitted to Plant Manager for safety authorization.`, 'warning');
        } else {
          App.showToast(`✅ Successfully marked OUT time (${outTime}) & recorded activity!`, 'success');
        }
      } catch (err) {
        App.showToast(err.message, 'error');
      } finally {
        App.showLoading(false);
      }
    },

    renderTodayAttendanceTable() {
      const tbody = document.getElementById('today-attendance-tbody');
      if (!tbody) return;

      const targetDate = this.selectedDate;
      const dateLogs = FaithStore.state.attendance.filter(a => a.date === targetDate);

      if (dateLogs.length === 0) {
        tbody.innerHTML = `
        <tr>
          <td colspan="13" class="px-4 py-8 text-center text-slate-500">
            No attendance recorded for date ${targetDate}. Select project, supplier, and mark workers IN above.
          </td>
        </tr>
      `;
        return;
      }

      const canApprove = FaithAuth.isAdmin() || FaithAuth.hasPermission('can_approve_backdated');

      tbody.innerHTML = dateLogs.map(log => {
        const isWorking = log.status === 'WORKING';
        const isPendingApproval = log.approval_status === 'PENDING_APPROVAL';
        const isRejected = log.approval_status === 'REJECTED';

        let approvalBadge = '';
        if (isPendingApproval) {
          approvalBadge = `
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-1.5">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <i data-lucide="clock" class="w-3 h-3"></i> Pending Approval
              </span>
              ${canApprove ? `
                <button type="button" onclick="AttendanceModule.quickApprove('${log.id}')" title="Approve Shift" class="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold">
                  Approve
                </button>
              ` : ''}
            </div>
            ${log.overtime_exceeded_14h || (parseFloat(log.hours_worked) > 14.0) ? `
              <span class="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                &gt; 14h Working Limit
              </span>
            ` : ''}
            ${log.forgotten_outpunch_resolved ? `
              <span class="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Resolved Forgotten Punch
              </span>
            ` : ''}
          </div>
        `;
        } else if (isRejected) {
          approvalBadge = `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
            <i data-lucide="x-circle" class="w-3 h-3"></i> Rejected
          </span>
        `;
        } else {
          approvalBadge = `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <i data-lucide="check-circle" class="w-3 h-3"></i> Approved
          </span>
        `;
        }

        return `
        <tr class="hover:bg-slate-800/40 transition-colors">
          <td class="px-3 py-3 whitespace-nowrap">
            ${isWorking ? `
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> WORKING
              </span>
            ` : `
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <i data-lucide="check" class="w-3 h-3"></i> COMPLETED
              </span>
            `}
          </td>
          <td class="px-3 py-3 whitespace-nowrap">
            ${approvalBadge}
          </td>
          <td class="px-3 py-3 font-semibold text-white whitespace-nowrap">${log.employee_name}</td>
          <td class="px-3 py-3 whitespace-nowrap text-slate-300">
            <span class="px-2 py-0.5 rounded text-xs bg-slate-800 border border-slate-700 font-mono">${log.trade}</span>
          </td>
          <td class="px-3 py-3 text-slate-300 text-xs whitespace-nowrap">${log.supplier_name}</td>
          <td class="px-3 py-3 text-slate-300 font-mono text-xs whitespace-nowrap">${log.project_code}</td>
          <td class="px-3 py-3 whitespace-nowrap">
            <span class="px-2 py-0.5 rounded text-xs ${log.location_type === 'Onsite' ? 'bg-blue-500/20 text-blue-300' : 'bg-indigo-500/20 text-indigo-300'} font-semibold">
              ${log.location_type}
            </span>
          </td>
          <td class="px-3 py-3 text-emerald-400 font-mono font-semibold whitespace-nowrap">${log.in_time}</td>
          <td class="px-3 py-3 text-blue-400 font-mono font-semibold whitespace-nowrap">${log.out_time || '<span class="text-slate-500">--:--</span>'}</td>
          <td class="px-3 py-3 font-mono font-semibold text-white whitespace-nowrap">${log.hours_worked ? log.hours_worked + ' h' : '--'}</td>
          <td class="px-3 py-3 font-mono font-bold text-amber-400 whitespace-nowrap">${log.mandays ? log.mandays : '--'}</td>
          <td class="px-3 py-3 font-mono font-bold text-purple-400 whitespace-nowrap">${log.ot_hours ? log.ot_hours + ' h' : '0 h'}</td>
          <td class="px-3 py-3 text-xs text-slate-300 max-w-xs truncate" title="${log.activity_description || 'None'}">
            ${log.activity_description || '<span class="text-slate-500 italic">Shift ongoing...</span>'}
          </td>
        </tr>
      `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();
    },

  async quickApprove(logId) {
      try {
        const user = FaithAuth.getCurrentUser();
        App.showLoading(true);
        await FaithStore.approveBackdatedAttendance(logId, user ? user.full_name : 'Manager', 'Approved via Attendance Register');
        App.showToast('✅ Retroactive shift APPROVED!', 'success');
        this.renderTodayAttendanceTable();
      } catch (err) {
        App.showToast(err.message, 'error');
      } finally {
        App.showLoading(false);
      }
    },

    // ============================================================================
    // FORGOTTEN OUT-PUNCHES BANNER & RESOLUTION MODAL
    // ============================================================================

    renderForgottenOutPunchesBanner() {
      const forgotten = FaithStore.getForgottenOutPunches ? FaithStore.getForgottenOutPunches() : [];
      if (forgotten.length === 0) return '';

      return `
      <div class="glass-panel rounded-2xl p-5 border border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 shadow-2xl animate-fadeIn mb-2">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-lg shrink-0">
              <i data-lucide="alert-triangle" class="w-5 h-5 text-rose-400"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                Forgotten / Unclosed Out-Punches Identified
                <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                  ${forgotten.length} Pending Resolution
                </span>
              </h3>
              <p class="text-xs text-slate-400">Workers marked IN on prior dates or exceeding shift hours without an OUT-punch. Must be resolved to prevent payroll gaps.</p>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto mt-3">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th class="px-3 py-2 rounded-l-lg">Shift Date</th>
                <th class="px-3 py-2">Worker</th>
                <th class="px-3 py-2">Trade</th>
                <th class="px-3 py-2">Supplier Agency</th>
                <th class="px-3 py-2">Project</th>
                <th class="px-3 py-2">In-Time</th>
                <th class="px-3 py-2">Elapsed Unclosed</th>
                <th class="px-3 py-2">Supervisor</th>
                <th class="px-3 py-2 rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-200">
              ${forgotten.map(log => `
                <tr class="hover:bg-slate-800/40 transition-colors">
                  <td class="px-3 py-2.5 font-mono font-bold text-amber-400 whitespace-nowrap">${log.date}</td>
                  <td class="px-3 py-2.5 font-bold text-white whitespace-nowrap">${log.employee_name}</td>
                  <td class="px-3 py-2.5 text-slate-400 whitespace-nowrap">${log.trade}</td>
                  <td class="px-3 py-2.5 text-slate-300 whitespace-nowrap text-[11px]">${log.supplier_name}</td>
                  <td class="px-3 py-2.5 font-mono text-[11px] text-blue-300 whitespace-nowrap">${log.project_code}</td>
                  <td class="px-3 py-2.5 font-mono text-emerald-400 font-bold whitespace-nowrap">${log.in_time}</td>
                  <td class="px-3 py-2.5 whitespace-nowrap">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      ${log.elapsed_hours}h unclosed
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-slate-400 whitespace-nowrap text-[11px]">${log.marked_by_supervisor}</td>
                  <td class="px-3 py-2.5 whitespace-nowrap">
                    <button type="button" onclick="AttendanceModule.openResolveForgottenModal('${log.id}')" class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all">
                      <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Resolve Out-Punch
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    },

    openResolveForgottenModal(attendanceId) {
      const record = FaithStore.state.attendance.find(a => a.id === attendanceId);
      if (!record) return;

      App.showModal(`
      <div class="space-y-4">
        <div class="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg">
            <i data-lucide="log-out" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Resolve Forgotten Out-Punch</h3>
            <p class="text-xs text-slate-400">Force close open shift for <strong class="text-white">${record.employee_name}</strong>.</p>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
          <div class="flex justify-between"><span class="text-slate-400">Worker & Trade:</span> <span class="font-bold text-white">${record.employee_name} (${record.trade})</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Supplier:</span> <span class="text-slate-300">${record.supplier_name}</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Project & Loc:</span> <span class="text-blue-300 font-mono">${record.project_code} (${record.location_type})</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Punch-In Details:</span> <span class="text-emerald-400 font-mono font-bold">${record.date} at ${record.in_time}</span></div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Actual Out-Time (Work Finished) <span class="text-red-400">*</span>
          </label>
          <input type="time" id="modal-resolve-outtime" value="18:30" class="w-full bg-slate-900 text-white rounded-xl p-3 text-sm border border-slate-700 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500">
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Manpower Activity Performed <span class="text-red-400">*</span>
            </label>
            <span class="badge-mandatory">MANDATORY</span>
          </div>
          <textarea id="modal-resolve-activity" rows="3" placeholder="Provide accurate details of work completed during this shift (e.g. Completed fixture wiring on Jig #2, route cable trays, sensor mounting and pneumatic testing)..." class="w-full bg-slate-900 text-white rounded-xl p-3 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"></textarea>
          <p class="text-[11px] text-amber-400 mt-1">Note: This shift will be closed and submitted for Manager Approval.</p>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 text-xs text-slate-400 hover:text-white">Cancel</button>
          <button type="button" onclick="AttendanceModule.submitResolveForgotten('${record.id}')" class="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all">
            Confirm & Close Shift
          </button>
        </div>
      </div>
    `);
      if (window.lucide) window.lucide.createIcons();
    },

  async submitResolveForgotten(attendanceId) {
      try {
        const outTime = document.getElementById('modal-resolve-outtime').value;
        const activity = document.getElementById('modal-resolve-activity').value;
        const user = FaithAuth.getCurrentUser();

        if (!outTime) {
          App.showToast('Please specify the actual Out-Time.', 'warning');
          return;
        }
        if (!activity || activity.trim().length < 5) {
          App.showToast('MANDATORY: Please describe the manpower activity performed (min 5 characters).', 'error');
          return;
        }

        App.showLoading(true);
        await FaithStore.resolveForgottenOutPunch({
          attendanceId,
          outTime,
          activityDescription: activity.trim(),
          resolvedBy: user ? user.full_name : 'Supervisor'
        });

        App.closeModal();
        App.showToast('✅ Forgotten out-punch resolved successfully!', 'success');
        this.renderAttendanceView();
      } catch (err) {
        App.showToast(err.message, 'error');
      } finally {
        App.showLoading(false);
      }
    }
  };

  window.AttendanceModule = AttendanceModule;
