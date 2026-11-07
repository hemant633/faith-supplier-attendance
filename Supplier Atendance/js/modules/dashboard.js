// ==============================================================================
// FAITH ENGINEERS - MONITORING DASHBOARD MODULE (v2.1)
// With Manager Approvals Queue for Retroactive / Backdated Attendance
// ==============================================================================

const DashboardModule = {
  charts: {},

  init() {
    this.renderDashboardView();
  },

  renderDashboardView() {
    const container = document.getElementById('tab-dashboard');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const logs = FaithStore.state.attendance;
    const todayLogs = logs.filter(a => a.date === today);

    // KPI Metrics Calculations
    const totalWorkersToday = todayLogs.length;
    const workingNow = todayLogs.filter(a => a.status === 'WORKING').length;
    const completedToday = todayLogs.filter(a => a.status === 'COMPLETED').length;
    const onsiteCount = todayLogs.filter(a => a.location_type === 'Onsite').length;
    const inhouseCount = todayLogs.filter(a => a.location_type === 'Inhouse').length;

    const totalMandaysToday = todayLogs.reduce((sum, a) => sum + (parseFloat(a.mandays) || 0), 0);
    const totalOtHoursToday = todayLogs.reduce((sum, a) => sum + (parseFloat(a.ot_hours) || 0), 0);
    const totalCostToday = todayLogs.reduce((sum, a) => sum + (parseFloat(a.total_cost) || 0), 0);

    // Month to date metrics
    const currentMonthPrefix = today.slice(0, 7);
    const mtdLogs = logs.filter(a => a.date && a.date.startsWith(currentMonthPrefix));
    const mtdMandays = mtdLogs.reduce((sum, a) => sum + (parseFloat(a.mandays) || 0), 0);
    const mtdCost = mtdLogs.reduce((sum, a) => sum + (parseFloat(a.total_cost) || 0), 0);

    // Pending Approvals Queue (Backdated logs requiring manager review)
    const pendingApprovals = logs.filter(a => a.approval_status === 'PENDING_APPROVAL');
    const forgottenShifts = FaithStore.getForgottenOutPunches ? FaithStore.getForgottenOutPunches() : [];

    const activeSuppliersToday = new Set(todayLogs.map(a => a.supplier_name)).size;
    const activeProjectsToday = new Set(todayLogs.map(a => a.project_code)).size;

    const canApprove = FaithAuth.isAdmin() || FaithAuth.hasPermission('can_approve_backdated');

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Top Operational Overview Bar -->
        <div class="glass-panel rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Realtime Operations
              </span>
              <span class="text-xs text-slate-400">Faith Engineers Manufacturing & Site Execution</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-bold text-white">Daily Manpower & Supplier Monitoring</h2>
            <p class="text-xs sm:text-sm text-slate-400">Live operational overview for <strong class="text-white">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" onclick="App.switchTab('attendance')" class="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-900/30">
              <i data-lucide="scan-line" class="w-4 h-4"></i> Mark Attendance
            </button>
            <button type="button" onclick="App.switchTab('reports')" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700">
              <i data-lucide="bar-chart-3" class="w-4 h-4"></i> Reports
            </button>
          </div>
        </div>

        <!-- MANAGER APPROVAL QUEUE BANNER (IF PENDING BACKDATED ATTENDANCE EXISTS) -->
        ${pendingApprovals.length > 0 ? `
          <div class="glass-panel rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 shadow-xl">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-lg">
                  <i data-lucide="clock" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-base font-bold text-white flex items-center gap-2">
                    Plant Manager Approvals Queue (>14h Shifts & Retroactive Logs)
                    <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                      ${pendingApprovals.length} Pending
                    </span>
                  </h3>
                  <p class="text-xs text-slate-400">Shifts exceeding 14 hours limit, backdated supervisor punches, and resolved forgotten out-punches awaiting managerial authorization.</p>
                </div>
              </div>

              ${canApprove ? `
                <button type="button" onclick="DashboardModule.handleBulkApprove()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all self-start sm:self-center">
                  <i data-lucide="check-check" class="w-4 h-4"></i> Approve All (${pendingApprovals.length})
                </button>
              ` : `
                <span class="text-xs text-slate-400 italic bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  Login as Plant Manager (<code class="text-amber-400 font-mono">manager@faithengineers.com</code>) to approve
                </span>
              `}
            </div>

            <!-- Pending Approvals Table -->
            <div class="overflow-x-auto mt-3">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold">
                  <tr>
                    <th class="px-3 py-2 rounded-l-lg">Punch Date</th>
                    <th class="px-3 py-2">Worker</th>
                    <th class="px-3 py-2">Trade</th>
                    <th class="px-3 py-2">Supplier</th>
                    <th class="px-3 py-2">Project & Loc</th>
                    <th class="px-3 py-2">Approval Reason</th>
                    <th class="px-3 py-2">Time (In &rarr; Out)</th>
                    <th class="px-3 py-2">Hours / Manday</th>
                    <th class="px-3 py-2">Reported Activity</th>
                    <th class="px-3 py-2">Supervisor</th>
                    <th class="px-3 py-2 rounded-r-lg">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800 text-slate-200">
                  ${pendingApprovals.map(log => {
      let reasonTag = '';
      if (log.overtime_exceeded_14h || parseFloat(log.hours_worked) > 14.0) {
        reasonTag = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">&gt; 14h Limit (${log.hours_worked}h)</span>`;
      } else if (log.forgotten_outpunch_resolved) {
        reasonTag = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">Resolved Forgotten</span>`;
      } else if (log.is_backdated) {
        reasonTag = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">Retroactive Date</span>`;
      } else {
        reasonTag = `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">Manager Review</span>`;
      }

      return `
                    <tr class="hover:bg-slate-800/40">
                      <td class="px-3 py-2.5 font-mono font-bold text-amber-400 whitespace-nowrap">${log.date}</td>
                      <td class="px-3 py-2.5 font-bold text-white whitespace-nowrap">${log.employee_name}</td>
                      <td class="px-3 py-2.5 whitespace-nowrap text-slate-400">${log.trade}</td>
                      <td class="px-3 py-2.5 whitespace-nowrap text-slate-300 text-[11px]">${log.supplier_name}</td>
                      <td class="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-blue-300">${log.project_code} (${log.location_type})</td>
                      <td class="px-3 py-2.5 whitespace-nowrap">${reasonTag}</td>
                      <td class="px-3 py-2.5 font-mono whitespace-nowrap">${log.in_time} &rarr; ${log.out_time || 'Working'}</td>
                      <td class="px-3 py-2.5 font-mono whitespace-nowrap font-bold text-emerald-400">${log.mandays ? log.mandays + ' md' : '--'} ${log.ot_hours ? '(' + log.ot_hours + 'h OT)' : ''}</td>
                      <td class="px-3 py-2.5 text-[11px] text-slate-300 max-w-xs truncate" title="${log.activity_description}">${log.activity_description || 'Work ongoing'}</td>
                      <td class="px-3 py-2.5 text-[11px] text-slate-400 whitespace-nowrap">${log.marked_by_supervisor}</td>
                      <td class="px-3 py-2.5 whitespace-nowrap">
                        ${canApprove ? `
                          <div class="flex items-center gap-1">
                            <button type="button" onclick="DashboardModule.handleApproveSingle('${log.id}')" class="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]">
                              Approve
                            </button>
                            <button type="button" onclick="DashboardModule.handleRejectSingle('${log.id}')" class="px-2 py-1 rounded bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 font-bold text-[11px]">
                              Reject
                            </button>
                          </div>
                        ` : `<span class="text-amber-400 font-semibold text-[11px]">Awaiting Manager</span>`
    }
                      </td >
                    </tr >
                  `;
                  }).join('')}
                </tbody >
              </table >
            </div >
          </div >
  ` : ''}

        <!-- FORGOTTEN OUT-PUNCHES NOTIFICATION BANNER -->
        ${forgottenShifts.length > 0 ? `
          <div class="glass-panel rounded-2xl p-4 border border-rose-500/30 bg-gradient-to-r from-rose-950/30 to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg animate-fadeIn">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-lg shrink-0">
                <i data-lucide="alert-triangle" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="text-sm font-bold text-white flex items-center gap-2">
                  ${forgottenShifts.length} Forgotten / Unclosed Out-Punches Detected
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">Action Required</span>
                </h4>
                <p class="text-xs text-slate-400">Workers were clocked IN but no OUT punch was registered. Open shifts cause payroll and billing discrepancies.</p>
              </div>
            </div>
            <button type="button" onclick="App.switchTab('attendance')" class="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-all shadow-md">
              <i data-lucide="arrow-right" class="w-4 h-4"></i> Resolve in Attendance
            </button>
          </div>
        ` : ''}

        <!-- 6 Main Executive KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          <div class="glass-panel rounded-2xl p-4 border border-slate-700/60 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Total Deployed</span>
              <div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <i data-lucide="users" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-white">${totalWorkersToday}</div>
            <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span class="text-blue-400 font-bold">${onsiteCount} Onsite</span> &bull; 
              <span class="text-indigo-400 font-bold">${inhouseCount} Inhouse</span>
            </div>
          </div>

          <div class="glass-panel rounded-2xl p-4 border border-slate-700/60 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Working Now</span>
              <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <i data-lucide="activity" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-emerald-400">${workingNow}</div>
            <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span class="text-slate-400">${completedToday} shift(s) closed</span>
            </div>
          </div>

          <div class="glass-panel rounded-2xl p-4 border border-slate-700/60 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Today Mandays</span>
              <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <i data-lucide="calendar" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-amber-400">${totalMandaysToday.toFixed(1)}</div>
            <div class="text-[11px] text-slate-400 mt-1">
              MTD: <strong class="text-white">${mtdMandays.toFixed(1)}</strong> mandays
            </div>
          </div>

          <div class="glass-panel rounded-2xl p-4 border border-slate-700/60 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Today OT</span>
              <div class="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <i data-lucide="clock" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-purple-400">${totalOtHoursToday.toFixed(1)} <span class="text-xs text-slate-400">hrs</span></div>
            <div class="text-[11px] text-slate-400 mt-1">
              Beyond 8-hr shifts
            </div>
          </div>

          <div class="glass-panel rounded-2xl p-4 border border-slate-700/60 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Suppliers Active</span>
              <div class="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <i data-lucide="building-2" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="text-2xl sm:text-3xl font-extrabold text-white">${activeSuppliersToday}</div>
            <div class="text-[11px] text-slate-400 mt-1">
              Across ${activeProjectsToday} project(s)
            </div>
          </div>

          <div class="glass-panel rounded-2xl p-4 border border-slate-700/60 shadow-lg">
            <div class="flex items-center justify-between text-slate-400 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Estimated Cost</span>
              <div class="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <i data-lucide="indian-rupee" class="w-4 h-4"></i>
              </div>
            </div>
            <div class="text-xl sm:text-2xl font-extrabold text-teal-400">₹${Math.round(totalCostToday).toLocaleString('en-IN')}</div>
            <div class="text-[11px] text-slate-400 mt-1">
              MTD: <strong class="text-white">₹${Math.round(mtdCost).toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        <!-- Charts Grid (Project Consumption & Supplier Utilisation) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="glass-panel rounded-2xl p-5 shadow-lg border border-slate-700/50">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <i data-lucide="folder-kanban" class="w-4 h-4 text-blue-400"></i>
                  Project-wise Manpower Consumption
                </h3>
                <p class="text-xs text-slate-400">Cumulative mandays consumed per active project</p>
              </div>
            </div>
            <div class="h-64 relative">
              <canvas id="chart-project-consumption"></canvas>
            </div>
          </div>

          <div class="glass-panel rounded-2xl p-5 shadow-lg border border-slate-700/50">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                  <i data-lucide="building-2" class="w-4 h-4 text-amber-400"></i>
                  Supplier-wise Manpower Utilisation
                </h3>
                <p class="text-xs text-slate-400">Mandays & Overtime breakdown by supplier contractor</p>
              </div>
            </div>
            <div class="h-64 relative">
              <canvas id="chart-supplier-utilisation"></canvas>
            </div>
          </div>
        </div>

      </div>
    `;

if (window.lucide) window.lucide.createIcons();
this.renderCharts();
  },

  async handleApproveSingle(id) {
  try {
    const user = FaithAuth.getCurrentUser();
    App.showLoading(true);
    await FaithStore.approveBackdatedAttendance(id, user ? user.full_name : 'Manager', 'Approved via Dashboard');
    App.showToast('✅ Retroactive shift APPROVED!', 'success');
    this.renderDashboardView();
  } catch (e) {
    App.showToast(e.message, 'error');
  } finally {
    App.showLoading(false);
  }
},

  async handleRejectSingle(id) {
  try {
    const user = FaithAuth.getCurrentUser();
    App.showLoading(true);
    await FaithStore.rejectBackdatedAttendance(id, user ? user.full_name : 'Manager', 'Rejected by Manager');
    App.showToast('Shift attendance REJECTED.', 'info');
    this.renderDashboardView();
  } catch (e) {
    App.showToast(e.message, 'error');
  } finally {
    App.showLoading(false);
  }
},

  async handleBulkApprove() {
  try {
    const user = FaithAuth.getCurrentUser();
    const pending = FaithStore.state.attendance.filter(a => a.approval_status === 'PENDING_APPROVAL');
    App.showLoading(true);
    await FaithStore.bulkApproveAttendance(pending.map(p => p.id), user ? user.full_name : 'Manager');
    App.showToast(`✅ Approved ${pending.length} retroactive attendance entries!`, 'success');
    this.renderDashboardView();
  } catch (e) {
    App.showToast(e.message, 'error');
  } finally {
    App.showLoading(false);
  }
},

renderCharts() {
  if (!window.Chart) return;
  const logs = FaithStore.state.attendance;

  // 1. Project-wise data aggregation
  const projMap = {};
  FaithStore.state.projects.forEach(p => { projMap[p.code] = 0; });
  logs.forEach(a => {
    if (a.project_code) {
      projMap[a.project_code] = (projMap[a.project_code] || 0) + (parseFloat(a.mandays) || 0);
    }
  });

  const ctxProj = document.getElementById('chart-project-consumption');
  if (ctxProj) {
    if (this.charts.project) this.charts.project.destroy();
    this.charts.project = new Chart(ctxProj, {
      type: 'bar',
      data: {
        labels: Object.keys(projMap),
        datasets: [{
          label: 'Total Mandays',
          data: Object.values(projMap),
          backgroundColor: '#3b82f6',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }

  // 2. Supplier-wise data aggregation
  const supMap = {};
  FaithStore.state.suppliers.forEach(s => {
    supMap[s.name] = { mandays: 0, otHours: 0 };
  });
  logs.forEach(a => {
    if (a.supplier_name) {
      if (!supMap[a.supplier_name]) supMap[a.supplier_name] = { mandays: 0, otHours: 0 };
      supMap[a.supplier_name].mandays += parseFloat(a.mandays) || 0;
      supMap[a.supplier_name].otHours += parseFloat(a.ot_hours) || 0;
    }
  });

  const supLabels = Object.keys(supMap).map(n => n.length > 18 ? n.slice(0, 16) + '...' : n);
  const supMandays = Object.values(supMap).map(v => v.mandays);
  const supOt = Object.values(supMap).map(v => v.otHours);

  const ctxSup = document.getElementById('chart-supplier-utilisation');
  if (ctxSup) {
    if (this.charts.supplier) this.charts.supplier.destroy();
    this.charts.supplier = new Chart(ctxSup, {
      type: 'bar',
      data: {
        labels: supLabels,
        datasets: [
          { label: 'Regular Mandays', data: supMandays, backgroundColor: '#10b981', borderRadius: 6 },
          { label: 'OT Hours', data: supOt, backgroundColor: '#8b5cf6', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#cbd5e1', boxWidth: 12, font: { size: 11 } } }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }
}
};

window.DashboardModule = DashboardModule;
