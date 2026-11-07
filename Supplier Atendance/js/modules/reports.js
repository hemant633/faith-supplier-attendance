// ==============================================================================
// FAITH ENGINEERS - INDUSTRIAL REPORTS & ANALYTICS MODULE (v2.1)
// With Retroactive Approval Status Filters & Billing Verification
// ==============================================================================

const ReportsModule = {
  activeReport: 'date_wise',
  dateRange: 'this_month',
  customFromDate: '',
  customToDate: '',
  filterProject: 'ALL',
  filterSupplier: 'ALL',
  filterLocation: 'ALL',
  filterApproval: 'ALL', // 'ALL', 'APPROVED', 'PENDING_APPROVAL'

  init() {
    this.setDefaultDates();
    this.renderReportsView();
  },

  setDefaultDates() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    this.customFromDate = firstDayOfMonth;
    this.customToDate = todayStr;
  },

  renderReportsView() {
    const container = document.getElementById('tab-reports');
    if (!container) return;

    const projects = FaithStore.state.projects;
    const suppliers = FaithStore.state.suppliers;

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Top Reports Header -->
        <div class="glass-panel rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i> Management Audit & Billing Reports
              </span>
              <span class="text-xs text-slate-400">Faith Engineers Attendance Database</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-bold text-white">Manpower Analytics & Billing Statements</h2>
            <p class="text-xs sm:text-sm text-slate-400">Accurate Manday, Overtime (OT), Contractor Reconciliation & Muster Roll Registers.</p>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" onclick="ReportsModule.exportToExcel()" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all">
              <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Export to Excel (.xlsx)
            </button>
            <button type="button" onclick="ReportsModule.exportToCSV()" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all">
              <i data-lucide="download" class="w-4 h-4"></i> CSV
            </button>
            <button type="button" onclick="window.print()" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all">
              <i data-lucide="printer" class="w-4 h-4"></i> Print
            </button>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="glass-panel rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-700/60 no-print">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            <!-- 1. Date Range Filter -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Date Range</label>
              <select id="report-date-preset" onchange="ReportsModule.handleDatePresetChange(this.value)" class="w-full bg-slate-900 text-white rounded-xl px-3 py-2 text-xs border border-slate-700 font-medium">
                <option value="this_month" ${this.dateRange === 'this_month' ? 'selected' : ''}>This Month (MTD)</option>
                <option value="today" ${this.dateRange === 'today' ? 'selected' : ''}>Today Only</option>
                <option value="yesterday" ${this.dateRange === 'yesterday' ? 'selected' : ''}>Yesterday</option>
                <option value="last_7_days" ${this.dateRange === 'last_7_days' ? 'selected' : ''}>Last 7 Days</option>
                <option value="custom" ${this.dateRange === 'custom' ? 'selected' : ''}>Custom Range &rarr;</option>
              </select>
            </div>

            <!-- Custom From & To Inputs -->
            <div id="custom-date-container" class="${this.dateRange === 'custom' ? 'flex' : 'hidden'} gap-2">
              <div class="flex-1">
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">From</label>
                <input type="date" id="report-from-date" value="${this.customFromDate}" onchange="ReportsModule.handleCustomDateChange()" class="w-full bg-slate-900 text-white rounded-xl px-2.5 py-1.5 text-xs border border-slate-700">
              </div>
              <div class="flex-1">
                <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">To</label>
                <input type="date" id="report-to-date" value="${this.customToDate}" onchange="ReportsModule.handleCustomDateChange()" class="w-full bg-slate-900 text-white rounded-xl px-2.5 py-1.5 text-xs border border-slate-700">
              </div>
            </div>

            <!-- 2. Project Filter -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Project</label>
              <select id="report-project-filter" onchange="ReportsModule.handleFilterChange('filterProject', this.value)" class="w-full bg-slate-900 text-white rounded-xl px-3 py-2 text-xs border border-slate-700 font-medium">
                <option value="ALL">All Projects</option>
                ${projects.map(p => `
                  <option value="${p.code}" ${p.code === this.filterProject ? 'selected' : ''}>${p.code} - ${p.title} (${p.status})</option>
                `).join('')}
              </select>
            </div>

            <!-- 3. Supplier Filter -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Supplier</label>
              <select id="report-supplier-filter" onchange="ReportsModule.handleFilterChange('filterSupplier', this.value)" class="w-full bg-slate-900 text-white rounded-xl px-3 py-2 text-xs border border-slate-700 font-medium">
                <option value="ALL">All Suppliers</option>
                ${suppliers.map(s => `
                  <option value="${s.id}" ${s.id === this.filterSupplier ? 'selected' : ''}>${s.code} - ${s.name}</option>
                `).join('')}
              </select>
            </div>

            <!-- 4. Location Filter -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Location</label>
              <select id="report-location-filter" onchange="ReportsModule.handleFilterChange('filterLocation', this.value)" class="w-full bg-slate-900 text-white rounded-xl px-3 py-2 text-xs border border-slate-700 font-medium">
                <option value="ALL" ${this.filterLocation === 'ALL' ? 'selected' : ''}>All Locations</option>
                <option value="Onsite" ${this.filterLocation === 'Onsite' ? 'selected' : ''}>Onsite (Plant)</option>
                <option value="Inhouse" ${this.filterLocation === 'Inhouse' ? 'selected' : ''}>Inhouse (Bay)</option>
              </select>
            </div>

            <!-- 5. Manager Approval Status Filter -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Approval Status</label>
              <select id="report-approval-filter" onchange="ReportsModule.handleFilterChange('filterApproval', this.value)" class="w-full bg-slate-900 text-white rounded-xl px-3 py-2 text-xs border border-slate-700 font-medium">
                <option value="ALL" ${this.filterApproval === 'ALL' ? 'selected' : ''}>All Punches (Approved + Pending)</option>
                <option value="APPROVED" ${this.filterApproval === 'APPROVED' ? 'selected' : ''}>Approved Only</option>
                <option value="PENDING_APPROVAL" ${this.filterApproval === 'PENDING_APPROVAL' ? 'selected' : ''}>Pending Manager Approval</option>
              </select>
            </div>

          </div>
        </div>

        <!-- 6 Required Reports Navigation Pills -->
        <div class="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-print">
          <button type="button" class="report-nav-pill px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${this.activeReport === 'date_wise' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'}" onclick="ReportsModule.switchReport('date_wise')">
            1. Date-wise Consumption
          </button>
          <button type="button" class="report-nav-pill px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${this.activeReport === 'supplier_wise' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'}" onclick="ReportsModule.switchReport('supplier_wise')">
            2. Supplier Utilisation
          </button>
          <button type="button" class="report-nav-pill px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${this.activeReport === 'project_wise' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'}" onclick="ReportsModule.switchReport('project_wise')">
            3. Project Consumption
          </button>
          <button type="button" class="report-nav-pill px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${this.activeReport === 'supplier_billing' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'}" onclick="ReportsModule.switchReport('supplier_billing')">
            4. Supplier Mandays & OT Billing
          </button>
          <button type="button" class="report-nav-pill px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${this.activeReport === 'absenteeism' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'}" onclick="ReportsModule.switchReport('absenteeism')">
            5. Unused Manpower / Absenteeism
          </button>
          <button type="button" class="report-nav-pill px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${this.activeReport === 'muster_sheet' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900/60'}" onclick="ReportsModule.switchReport('muster_sheet')">
            6. Project & Day Attendance Sheet
          </button>
        </div>

        <div class="print-header hidden">
          <h1 class="text-2xl font-bold text-black">FAITH ENGINEERS</h1>
          <p class="text-sm text-gray-700">Daily Supplier Attendance & Manpower Consumption Register</p>
          <p class="text-xs text-gray-600">Generated on: ${new Date().toLocaleString('en-IN')}</p>
          <hr class="my-3 border-gray-400">
        </div>

        <div id="report-table-content" class="glass-panel rounded-2xl p-5 shadow-lg border border-slate-700/50">
          ${this.renderActiveReportTable()}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  handleDatePresetChange(val) {
    this.dateRange = val;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (val === 'today') {
      this.customFromDate = todayStr;
      this.customToDate = todayStr;
    } else if (val === 'yesterday') {
      const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      this.customFromDate = yest;
      this.customToDate = yest;
    } else if (val === 'last_7_days') {
      const past7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      this.customFromDate = past7;
      this.customToDate = todayStr;
    } else if (val === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      this.customFromDate = firstDay;
      this.customToDate = todayStr;
    }

    const customContainer = document.getElementById('custom-date-container');
    if (customContainer) {
      if (val === 'custom') {
        customContainer.className = 'flex gap-2';
      } else {
        customContainer.className = 'hidden';
      }
    }

    this.refreshReportContent();
  },

  handleCustomDateChange() {
    const fromEl = document.getElementById('report-from-date');
    const toEl = document.getElementById('report-to-date');
    if (fromEl) this.customFromDate = fromEl.value;
    if (toEl) this.customToDate = toEl.value;
    this.refreshReportContent();
  },

  handleFilterChange(prop, val) {
    this[prop] = val;
    this.refreshReportContent();
  },

  switchReport(reportKey) {
    this.activeReport = reportKey;
    const container = document.getElementById('report-table-content');
    if (container) {
      container.innerHTML = this.renderActiveReportTable();
      if (window.lucide) window.lucide.createIcons();
    }
    const pills = document.querySelectorAll('.report-nav-pill');
    pills.forEach(pill => {
      pill.className = 'report-nav-pill px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-slate-400 hover:text-white bg-slate-900/60';
    });
    if (window.event && window.event.currentTarget) {
      window.event.currentTarget.className = 'report-nav-pill px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap bg-blue-600 text-white shadow-md';
    }
  },

  refreshReportContent() {
    const container = document.getElementById('report-table-content');
    if (container) {
      container.innerHTML = this.renderActiveReportTable();
      if (window.lucide) window.lucide.createIcons();
    }
  },

  getFilteredLogs() {
    const fromDate = this.customFromDate;
    const toDate = this.customToDate;

    return FaithStore.state.attendance.filter(log => {
      if (fromDate && log.date < fromDate) return false;
      if (toDate && log.date > toDate) return false;
      if (this.filterProject !== 'ALL' && log.project_code !== this.filterProject) return false;
      if (this.filterSupplier !== 'ALL' && log.supplier_id !== this.filterSupplier) return false;
      if (this.filterLocation !== 'ALL' && log.location_type !== this.filterLocation) return false;
      
      // Approval Status filter
      if (this.filterApproval !== 'ALL') {
        const logStatus = log.approval_status || 'APPROVED';
        if (logStatus !== this.filterApproval) return false;
      }

      return true;
    });
  },

  renderActiveReportTable() {
    switch (this.activeReport) {
      case 'date_wise':
        return this.renderDateWiseReport();
      case 'supplier_wise':
        return this.renderSupplierWiseReport();
      case 'project_wise':
        return this.renderProjectWiseReport();
      case 'supplier_billing':
        return this.renderSupplierBillingReport();
      case 'absenteeism':
        return this.renderAbsenteeismReport();
      case 'muster_sheet':
        return this.renderMusterSheetReport();
      default:
        return '';
    }
  },

  renderDateWiseReport() {
    const logs = this.getFilteredLogs();
    const dateMap = {};

    logs.forEach(log => {
      const d = log.date;
      if (!dateMap[d]) {
        dateMap[d] = {
          date: d,
          totalWorkers: 0,
          onsiteCount: 0,
          inhouseCount: 0,
          totalHours: 0,
          totalMandays: 0,
          totalOtHours: 0,
          totalCost: 0
        };
      }
      dateMap[d].totalWorkers += 1;
      if (log.location_type === 'Onsite') dateMap[d].onsiteCount += 1;
      if (log.location_type === 'Inhouse') dateMap[d].inhouseCount += 1;
      dateMap[d].totalHours += parseFloat(log.hours_worked) || 0;
      dateMap[d].totalMandays += parseFloat(log.mandays) || 0;
      dateMap[d].totalOtHours += parseFloat(log.ot_hours) || 0;
      dateMap[d].totalCost += parseFloat(log.total_cost) || 0;
    });

    const rows = Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date));
    const grandWorkers = rows.reduce((s, r) => s + r.totalWorkers, 0);
    const grandMandays = rows.reduce((s, r) => s + r.totalMandays, 0);
    const grandOt = rows.reduce((s, r) => s + r.totalOtHours, 0);
    const grandCost = rows.reduce((s, r) => s + r.totalCost, 0);

    return `
      <div>
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h3 class="text-base font-bold text-white">Report 1: Date-wise Manpower Consumption</h3>
            <p class="text-xs text-slate-400">Total headcounts, split by Onsite/Inhouse, shift mandays and overtime per day.</p>
          </div>
          <span class="text-xs text-slate-400 font-mono">${rows.length} dates recorded</span>
        </div>

        <div class="overflow-x-auto">
          <table id="export-table-date-wise" class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-900/80 text-slate-300 uppercase text-[11px] font-semibold">
              <tr>
                <th class="px-3 py-2.5 rounded-l-lg">Date</th>
                <th class="px-3 py-2.5">Total Headcount</th>
                <th class="px-3 py-2.5">Onsite</th>
                <th class="px-3 py-2.5">Inhouse</th>
                <th class="px-3 py-2.5">Total Hours</th>
                <th class="px-3 py-2.5">Regular Mandays</th>
                <th class="px-3 py-2.5">OT Hours</th>
                <th class="px-3 py-2.5 rounded-r-lg">Estimated Amount (₹)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-200">
              ${rows.length === 0 ? `
                <tr><td colspan="8" class="px-4 py-8 text-center text-slate-500">No data found for selected filters.</td></tr>
              ` : rows.map(r => `
                <tr class="hover:bg-slate-800/40 transition-colors">
                  <td class="px-3 py-3 font-mono font-bold text-blue-400 whitespace-nowrap">${r.date}</td>
                  <td class="px-3 py-3 font-bold text-white">${r.totalWorkers}</td>
                  <td class="px-3 py-3 text-blue-300">${r.onsiteCount}</td>
                  <td class="px-3 py-3 text-indigo-300">${r.inhouseCount}</td>
                  <td class="px-3 py-3 font-mono">${r.totalHours.toFixed(1)} h</td>
                  <td class="px-3 py-3 font-mono font-bold text-emerald-400">${r.totalMandays.toFixed(2)}</td>
                  <td class="px-3 py-3 font-mono font-bold text-purple-400">${r.totalOtHours.toFixed(2)} h</td>
                  <td class="px-3 py-3 font-mono font-bold text-teal-400">₹${Math.round(r.totalCost).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot class="bg-slate-900/90 font-bold border-t-2 border-slate-700 text-slate-200">
              <tr>
                <td class="px-3 py-3">Total Consolidated:</td>
                <td class="px-3 py-3 text-white">${grandWorkers}</td>
                <td class="px-3 py-3">--</td>
                <td class="px-3 py-3">--</td>
                <td class="px-3 py-3 font-mono">--</td>
                <td class="px-3 py-3 font-mono text-emerald-400">${grandMandays.toFixed(2)}</td>
                <td class="px-3 py-3 font-mono text-purple-400">${grandOt.toFixed(2)} h</td>
                <td class="px-3 py-3 font-mono text-teal-400">₹${Math.round(grandCost).toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>
    `;
  },

  renderSupplierWiseReport() {
    const logs = this.getFilteredLogs();
    const supMap = {};

    FaithStore.state.suppliers.forEach(s => {
      const rosterCount = FaithStore.state.employees.filter(e => e.supplier_id === s.id && e.is_enabled !== false).length;
      supMap[s.id] = {
        supplierId: s.id,
        supplierCode: s.code,
        supplierName: s.name,
        rosterCount,
        deployedShifts: 0,
        totalMandays: 0,
        totalOtHours: 0,
        totalCost: 0
      };
    });

    logs.forEach(log => {
      const sId = log.supplier_id;
      if (!supMap[sId]) {
        supMap[sId] = {
          supplierId: sId,
          supplierCode: 'SUP',
          supplierName: log.supplier_name,
          rosterCount: 0,
          deployedShifts: 0,
          totalMandays: 0,
          totalOtHours: 0,
          totalCost: 0
        };
      }
      supMap[sId].deployedShifts += 1;
      supMap[sId].totalMandays += parseFloat(log.mandays) || 0;
      supMap[sId].totalOtHours += parseFloat(log.ot_hours) || 0;
      supMap[sId].totalCost += parseFloat(log.total_cost) || 0;
    });

    const rows = Object.values(supMap).filter(s => s.deployedShifts > 0 || s.rosterCount > 0);

    return `
      <div>
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h3 class="text-base font-bold text-white">Report 2: Supplier-wise Manpower Utilisation</h3>
            <p class="text-xs text-slate-400">Analysis of vendor agency capacity, active deployment shifts, and utilization metrics.</p>
          </div>
          <span class="text-xs text-slate-400 font-mono">${rows.length} suppliers</span>
        </div>

        <div class="overflow-x-auto">
          <table id="export-table-supplier-wise" class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-900/80 text-slate-300 uppercase text-[11px] font-semibold">
              <tr>
                <th class="px-3 py-2.5 rounded-l-lg">Code</th>
                <th class="px-3 py-2.5">Agency Name</th>
                <th class="px-3 py-2.5">Roster Count</th>
                <th class="px-3 py-2.5">Deployed Shifts</th>
                <th class="px-3 py-2.5">Total Mandays</th>
                <th class="px-3 py-2.5">Total OT Hours</th>
                <th class="px-3 py-2.5 rounded-r-lg">Total Payable (₹)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-200">
              ${rows.map(r => `
                <tr class="hover:bg-slate-800/40 transition-colors">
                  <td class="px-3 py-3 font-mono font-bold text-amber-400">${r.supplierCode}</td>
                  <td class="px-3 py-3 font-bold text-white">${r.supplierName}</td>
                  <td class="px-3 py-3 font-mono text-slate-300">${r.rosterCount} workers</td>
                  <td class="px-3 py-3 font-mono font-bold text-blue-400">${r.deployedShifts}</td>
                  <td class="px-3 py-3 font-mono font-bold text-emerald-400">${r.totalMandays.toFixed(2)}</td>
                  <td class="px-3 py-3 font-mono font-bold text-purple-400">${r.totalOtHours.toFixed(2)} h</td>
                  <td class="px-3 py-3 font-mono font-bold text-teal-400">₹${Math.round(r.totalCost).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

      </div>
    `;
  },

  renderProjectWiseReport() {
    const logs = this.getFilteredLogs();
    const projMap = {};

    logs.forEach(log => {
      const pCode = log.project_code;
      if (!projMap[pCode]) {
        projMap[pCode] = {
          projectCode: pCode,
          projectTitle: log.project_title || pCode,
          suppliersEngaged: new Set(),
          totalShifts: 0,
          totalHours: 0,
          totalMandays: 0,
          totalOtHours: 0,
          totalCost: 0
        };
      }
      projMap[pCode].suppliersEngaged.add(log.supplier_name);
      projMap[pCode].totalShifts += 1;
      projMap[pCode].totalHours += parseFloat(log.hours_worked) || 0;
      projMap[pCode].totalMandays += parseFloat(log.mandays) || 0;
      projMap[pCode].totalOtHours += parseFloat(log.ot_hours) || 0;
      projMap[pCode].totalCost += parseFloat(log.total_cost) || 0;
    });

    const rows = Object.values(projMap);

    return `
      <div>
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h3 class="text-base font-bold text-white">Report 3: Project-wise Manpower Consumption</h3>
            <p class="text-xs text-slate-400">Breakdown of supplier manpower utilization and costs charged to each project code.</p>
          </div>
          <span class="text-xs text-slate-400 font-mono">${rows.length} projects active</span>
        </div>

        <div class="overflow-x-auto">
          <table id="export-table-project-wise" class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-900/80 text-slate-300 uppercase text-[11px] font-semibold">
              <tr>
                <th class="px-3 py-2.5 rounded-l-lg">Project Code</th>
                <th class="px-3 py-2.5">Project Title</th>
                <th class="px-3 py-2.5">Suppliers Engaged</th>
                <th class="px-3 py-2.5">Total Shifts</th>
                <th class="px-3 py-2.5">Regular Mandays</th>
                <th class="px-3 py-2.5">OT Hours</th>
                <th class="px-3 py-2.5 rounded-r-lg">Manpower Cost (₹)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-200">
              ${rows.length === 0 ? `
                <tr><td colspan="7" class="px-4 py-8 text-center text-slate-500">No project attendance recorded in this period.</td></tr>
              ` : rows.map(r => `
                <tr class="hover:bg-slate-800/40 transition-colors">
                  <td class="px-3 py-3 font-mono font-bold text-blue-400">${r.projectCode}</td>
                  <td class="px-3 py-3 font-semibold text-white">${r.projectTitle}</td>
                  <td class="px-3 py-3 text-slate-300 text-xs">${Array.from(r.suppliersEngaged).join(', ')}</td>
                  <td class="px-3 py-3 font-mono text-white">${r.totalShifts}</td>
                  <td class="px-3 py-3 font-mono font-bold text-emerald-400">${r.totalMandays.toFixed(2)}</td>
                  <td class="px-3 py-3 font-mono font-bold text-purple-400">${r.totalOtHours.toFixed(2)} h</td>
                  <td class="px-3 py-3 font-mono font-bold text-teal-400">₹${Math.round(r.totalCost).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

      </div>
    `;
  },

  renderSupplierBillingReport() {
    const logs = this.getFilteredLogs();
    const supMap = {};

    logs.forEach(log => {
      const sId = log.supplier_id;
      if (!supMap[sId]) {
        supMap[sId] = {
          supplierName: log.supplier_name,
          totalMandays: 0,
          mandayCost: 0,
          totalOtHours: 0,
          otCost: 0,
          totalPayable: 0
        };
      }
      supMap[sId].totalMandays += parseFloat(log.mandays) || 0;
      supMap[sId].mandayCost += parseFloat(log.manday_cost) || 0;
      supMap[sId].totalOtHours += parseFloat(log.ot_hours) || 0;
      supMap[sId].otCost += parseFloat(log.ot_cost) || 0;
      supMap[sId].totalPayable += parseFloat(log.total_cost) || 0;
    });

    const rows = Object.values(supMap);
    const durationLabel = `${this.customFromDate} to ${this.customToDate}`;

    return `
      <div>
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h3 class="text-base font-bold text-white">Report 4: Supplier Mandays and OT Billing Calculation</h3>
            <p class="text-xs text-slate-400">Reconciliation statement for contractor invoice approval: <strong>${durationLabel}</strong>.</p>
          </div>
          <span class="text-xs text-emerald-400 font-mono font-bold">Duration: ${durationLabel}</span>
        </div>

        <div class="overflow-x-auto">
          <table id="export-table-supplier-billing" class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-900/80 text-slate-300 uppercase text-[11px] font-semibold">
              <tr>
                <th class="px-3 py-2.5 rounded-l-lg">Supplier Agency</th>
                <th class="px-3 py-2.5">Billing Duration</th>
                <th class="px-3 py-2.5">Regular Mandays</th>
                <th class="px-3 py-2.5">Manday Amount (₹)</th>
                <th class="px-3 py-2.5">OT Hours</th>
                <th class="px-3 py-2.5">OT Amount (₹)</th>
                <th class="px-3 py-2.5 rounded-r-lg">Net Payable (₹)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-200">
              ${rows.length === 0 ? `
                <tr><td colspan="7" class="px-4 py-8 text-center text-slate-500">No billable attendance found for this duration.</td></tr>
              ` : rows.map(r => `
                <tr class="hover:bg-slate-800/40 transition-colors">
                  <td class="px-3 py-3 font-bold text-white">${r.supplierName}</td>
                  <td class="px-3 py-3 font-mono text-xs text-slate-400">${durationLabel}</td>
                  <td class="px-3 py-3 font-mono font-bold text-emerald-400">${r.totalMandays.toFixed(2)}</td>
                  <td class="px-3 py-3 font-mono text-emerald-300">₹${Math.round(r.mandayCost).toLocaleString('en-IN')}</td>
                  <td class="px-3 py-3 font-mono font-bold text-purple-400">${r.totalOtHours.toFixed(2)} h</td>
                  <td class="px-3 py-3 font-mono text-purple-300">₹${Math.round(r.otCost).toLocaleString('en-IN')}</td>
                  <td class="px-3 py-3 font-mono font-bold text-teal-400 text-base">₹${Math.round(r.totalPayable).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

      </div>
    `;
  },

  renderAbsenteeismReport() {
    const today = this.customToDate || new Date().toISOString().split('T')[0];
    const logs = FaithStore.state.attendance.filter(a => a.date === today);
    const attendedEmpIds = new Set(logs.map(a => a.employee_id));

    let activeEmployees = FaithStore.state.employees.filter(e => e.is_enabled !== false && e.is_blocked !== true);
    if (this.filterSupplier !== 'ALL') {
      activeEmployees = activeEmployees.filter(e => e.supplier_id === this.filterSupplier);
    }

    const totalRoster = activeEmployees.length;
    const attendedCount = activeEmployees.filter(e => attendedEmpIds.has(e.id)).length;
    const absentEmployees = activeEmployees.filter(e => !attendedEmpIds.has(e.id));
    const absenteeismRate = totalRoster > 0 ? ((absentEmployees.length / totalRoster) * 100).toFixed(1) : 0;

    return `
      <div>
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h3 class="text-base font-bold text-white">Report 5: Unused Manpower & Absenteeism Analysis</h3>
            <p class="text-xs text-slate-400">Enrolled active contractor workers with no attendance recorded on <strong>${today}</strong>.</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold font-mono">
              Absenteeism Rate: ${absenteeismRate}%
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div class="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <p class="text-xs text-slate-400">Total Enrolled Workers</p>
            <p class="text-xl font-bold text-white mt-1">${totalRoster}</p>
          </div>
          <div class="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <p class="text-xs text-slate-400">Reported Present</p>
            <p class="text-xl font-bold text-emerald-400 mt-1">${attendedCount}</p>
          </div>
          <div class="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            <p class="text-xs text-slate-400">Unused / Absent Manpower</p>
            <p class="text-xl font-bold text-red-400 mt-1">${absentEmployees.length}</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table id="export-table-absenteeism" class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-900/80 text-slate-300 uppercase text-[11px] font-semibold">
              <tr>
                <th class="px-3 py-2.5 rounded-l-lg">Status</th>
                <th class="px-3 py-2.5">Worker Name</th>
                <th class="px-3 py-2.5">Trade</th>
                <th class="px-3 py-2.5">Supplier Agency</th>
                <th class="px-3 py-2.5">Worker Phone</th>
                <th class="px-3 py-2.5 rounded-r-lg">Date Marked Absent</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-200">
              ${absentEmployees.length === 0 ? `
                <tr><td colspan="6" class="px-4 py-8 text-center text-emerald-400 font-bold">100% Attendance! All registered manpower were deployed.</td></tr>
              ` : absentEmployees.map(emp => {
                const sup = FaithStore.state.suppliers.find(s => s.id === emp.supplier_id);
                return `
                  <tr class="hover:bg-slate-800/40 transition-colors">
                    <td class="px-3 py-3">
                      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                        <i data-lucide="user-x" class="w-3 h-3"></i> ABSENT
                      </span>
                    </td>
                    <td class="px-3 py-3 font-bold text-white">${emp.name}</td>
                    <td class="px-3 py-3">
                      <span class="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs">${emp.trade}</span>
                    </td>
                    <td class="px-3 py-3 text-slate-300">${sup ? sup.name : '--'}</td>
                    <td class="px-3 py-3 font-mono text-xs text-slate-400">${emp.phone || '--'}</td>
                    <td class="px-3 py-3 font-mono text-slate-400">${today}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- UNCLOSED / FORGOTTEN OUT-PUNCHES IN THIS PERIOD -->
        ${(() => {
          const forgotten = FaithStore.getForgottenOutPunches ? FaithStore.getForgottenOutPunches() : [];
          if (forgotten.length === 0) return '';
          return `
            <div class="mt-8 pt-6 border-t border-slate-800">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-bold text-white flex items-center gap-2">
                  <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-400"></i>
                  Unclosed / Forgotten Out-Punches Identified (${forgotten.length})
                </h4>
                <span class="text-xs text-rose-400 font-mono font-bold">Action: Force Out-Punch in Attendance</span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold">
                    <tr>
                      <th class="px-3 py-2 rounded-l-lg">Punch Date</th>
                      <th class="px-3 py-2">Worker</th>
                      <th class="px-3 py-2">Trade</th>
                      <th class="px-3 py-2">Supplier Agency</th>
                      <th class="px-3 py-2">Project</th>
                      <th class="px-3 py-2">In-Time</th>
                      <th class="px-3 py-2">Elapsed Duration</th>
                      <th class="px-3 py-2 rounded-r-lg">Supervisor</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800 text-slate-200">
                    ${forgotten.map(f => `
                      <tr class="hover:bg-slate-800/40">
                        <td class="px-3 py-2.5 font-mono text-amber-400 font-bold">${f.date}</td>
                        <td class="px-3 py-2.5 font-bold text-white">${f.employee_name}</td>
                        <td class="px-3 py-2.5 text-slate-400">${f.trade}</td>
                        <td class="px-3 py-2.5 text-slate-300 text-[11px]">${f.supplier_name}</td>
                        <td class="px-3 py-2.5 font-mono text-blue-300">${f.project_code}</td>
                        <td class="px-3 py-2.5 font-mono text-emerald-400 font-bold">${f.in_time}</td>
                        <td class="px-3 py-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">${f.elapsed_hours}h unclosed</span></td>
                        <td class="px-3 py-2.5 text-slate-400 text-[11px]">${f.marked_by_supervisor}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        })()}

      </div>
    `;
  },

  renderMusterSheetReport() {
    const logs = this.getFilteredLogs();

    return `
      <div>
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h3 class="text-base font-bold text-white">Report 6: Detailed Manpower Attendance Sheet (Project-wise & Day-wise)</h3>
            <p class="text-xs text-slate-400">Master punch register detailing In/Out times, mandatory activity log, and Manager Approval Status.</p>
          </div>
          <span class="text-xs text-slate-400 font-mono">${logs.length} punch records</span>
        </div>

        <div class="overflow-x-auto">
          <table id="export-table-muster-sheet" class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-900/80 text-slate-300 uppercase text-[11px] font-semibold">
              <tr>
                <th class="px-3 py-2.5 rounded-l-lg">Date</th>
                <th class="px-3 py-2.5">Approval</th>
                <th class="px-3 py-2.5">Project</th>
                <th class="px-3 py-2.5">Location</th>
                <th class="px-3 py-2.5">Supplier</th>
                <th class="px-3 py-2.5">Worker Name</th>
                <th class="px-3 py-2.5">Trade</th>
                <th class="px-3 py-2.5">In Time</th>
                <th class="px-3 py-2.5">Out Time</th>
                <th class="px-3 py-2.5">Hours</th>
                <th class="px-3 py-2.5">Mandays</th>
                <th class="px-3 py-2.5">OT (Hrs)</th>
                <th class="px-3 py-2.5">Activity Description</th>
                <th class="px-3 py-2.5 rounded-r-lg">Marked By</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-200">
              ${logs.length === 0 ? `
                <tr><td colspan="14" class="px-4 py-8 text-center text-slate-500">No attendance entries match your filter.</td></tr>
              ` : logs.map(log => {
                const isPending = log.approval_status === 'PENDING_APPROVAL';
                const isRejected = log.approval_status === 'REJECTED';

                return `
                  <tr class="hover:bg-slate-800/40 transition-colors">
                    <td class="px-3 py-3 font-mono text-slate-400 whitespace-nowrap">${log.date}</td>
                    <td class="px-3 py-3 whitespace-nowrap">
                      ${isPending ? `
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <i data-lucide="clock" class="w-3 h-3"></i> Pending Approval
                        </span>
                      ` : (isRejected ? `
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          Rejected
                        </span>
                      ` : `
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Approved
                        </span>
                      `)}
                    </td>
                    <td class="px-3 py-3 font-mono font-bold text-blue-400 whitespace-nowrap">${log.project_code}</td>
                    <td class="px-3 py-3 whitespace-nowrap">
                      <span class="px-2 py-0.5 rounded text-xs ${log.location_type === 'Onsite' ? 'bg-blue-500/20 text-blue-300' : 'bg-indigo-500/20 text-indigo-300'} font-semibold">
                        ${log.location_type}
                      </span>
                    </td>
                    <td class="px-3 py-3 text-slate-300 text-xs whitespace-nowrap">${log.supplier_name}</td>
                    <td class="px-3 py-3 font-bold text-white whitespace-nowrap">${log.employee_name}</td>
                    <td class="px-3 py-3 whitespace-nowrap">
                      <span class="px-2 py-0.5 rounded text-xs bg-slate-800 border border-slate-700 font-mono text-slate-300">${log.trade}</span>
                    </td>
                    <td class="px-3 py-3 text-emerald-400 font-mono font-semibold whitespace-nowrap">${log.in_time}</td>
                    <td class="px-3 py-3 text-blue-400 font-mono font-semibold whitespace-nowrap">${log.out_time || '<span class="text-slate-500">Working</span>'}</td>
                    <td class="px-3 py-3 font-mono whitespace-nowrap">${log.hours_worked ? log.hours_worked + ' h' : '--'}</td>
                    <td class="px-3 py-3 font-mono font-bold text-emerald-400 whitespace-nowrap">${log.mandays ? log.mandays : '--'}</td>
                    <td class="px-3 py-3 font-mono font-bold text-purple-400 whitespace-nowrap">${log.ot_hours ? log.ot_hours + ' h' : '0 h'}</td>
                    <td class="px-3 py-3 text-xs text-amber-200/90 max-w-xs" title="${log.activity_description || ''}">
                      ${log.activity_description || '<span class="text-slate-500 italic">Work in progress...</span>'}
                    </td>
                    <td class="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">${log.marked_by_supervisor || '--'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

      </div>
    `;
  },

  exportToExcel() {
    if (!window.XLSX) {
      App.showToast('SheetJS Excel library not ready. Trying CSV...', 'warning');
      this.exportToCSV();
      return;
    }

    try {
      const tableId = `export-table-${this.activeReport.replace(/_/g, '-')}`;
      const table = document.getElementById(tableId);

      if (!table) {
        App.showToast('No table content available to export.', 'warning');
        return;
      }

      const wb = XLSX.utils.table_to_book(table, { sheet: 'AttendanceReport' });
      const filename = `Faith_Engineers_${this.activeReport}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      App.showToast(`✅ Exported to ${filename}!`, 'success');
    } catch (err) {
      console.error('Excel export error:', err);
      App.showToast('Excel export failed: ' + err.message, 'error');
    }
  },

  exportToCSV() {
    try {
      const tableId = `export-table-${this.activeReport.replace(/_/g, '-')}`;
      const table = document.getElementById(tableId);

      if (!table) {
        App.showToast('No table content available to export.', 'warning');
        return;
      }

      const rows = Array.from(table.querySelectorAll('tr'));
      const csvContent = rows.map(r => {
        const cols = Array.from(r.querySelectorAll('th, td'));
        return cols.map(c => `"${c.innerText.replace(/"/g, '""').trim()}"`).join(',');
      }).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Faith_Engineers_${this.activeReport}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      App.showToast('✅ CSV downloaded successfully!', 'success');
    } catch (err) {
      App.showToast('CSV export failed: ' + err.message, 'error');
    }
  }
};

window.ReportsModule = ReportsModule;
