// ==============================================================================
// FAITH ENGINEERS - APPLICATION CONTROLLER & ROUTER
// ==============================================================================

const App = {
  currentTab: 'attendance',

  async init() {
    console.log('🚀 Initializing Faith Engineers Supplier Attendance Portal...');

    // Initialize data store
    await FaithStore.init();

    // Check auth session
    this.checkAuthState();

    // Listen to store data changes (from realtime or local actions)
    window.addEventListener('faith:data-changed', () => {
      this.refreshCurrentView();
    });

    window.addEventListener('faith:auth-state-changed', (e) => {
      this.checkAuthState();
    });

    // Update realtime badge status
    this.updateRealtimeIndicator();

    // Keyboard shortcut ESC to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  },

  checkAuthState() {
    const user = FaithAuth.getCurrentUser();
    const loginSection = document.getElementById('login-section');
    const appShell = document.getElementById('app-shell');

    if (!user) {
      if (loginSection) loginSection.classList.remove('hidden');
      if (appShell) appShell.classList.add('hidden');
      this.renderLoginForm();
    } else {
      if (loginSection) loginSection.classList.add('hidden');
      if (appShell) appShell.classList.remove('hidden');
      this.renderUserHeader(user);
      this.switchTab(this.currentTab);
    }

    if (window.lucide) window.lucide.createIcons();
  },

  renderLoginForm() {
    const container = document.getElementById('login-container');
    if (!container) return;

    container.innerHTML = `
      <div class="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-blue-500/20 max-w-md w-full mx-auto relative overflow-hidden">
        <div class="absolute -top-20 -right-20 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Logo & Title -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-blue-500/20">
            <i data-lucide="building-2" class="w-8 h-8"></i>
          </div>
          <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-widest mb-1">
            Faith Engineers
          </span>
          <h1 class="text-xl sm:text-2xl font-extrabold text-white mt-1">Daily Supplier Attendance</h1>
          <p class="text-xs text-slate-400 mt-1">Authorized site supervisor & management access portal</p>
        </div>

        <!-- Login Form -->
        <form id="login-form" onsubmit="App.handleLoginSubmit(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email or Supervisor ID
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i data-lucide="user" class="w-4 h-4"></i>
              </span>
              <input type="text" id="login-email" required placeholder="supervisor@faithengineers.com" class="w-full bg-slate-900/90 text-white pl-10 pr-4 py-3 rounded-xl text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium">
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <span class="text-[11px] text-slate-400">Shared by Admin</span>
            </div>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i data-lucide="lock" class="w-4 h-4"></i>
              </span>
              <input type="password" id="login-password" required placeholder="••••••••" class="w-full bg-slate-900/90 text-white pl-10 pr-4 py-3 rounded-xl text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono">
            </div>
          </div>

          <button type="submit" class="w-full touch-target bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 transition-all mt-2">
            <i data-lucide="log-in" class="w-4 h-4"></i> Login to Portal
          </button>
        </form>

        <!-- Quick 1-Click Role Logins -->
        <div class="mt-6 pt-5 border-t border-slate-800">
          <p class="text-[11px] text-slate-400 font-semibold mb-2">⚡ Quick 1-Click Role Logins:</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button type="button" onclick="App.fillDemoLogin('admin@faithengineers.com', 'admin123')" class="px-2.5 py-2 bg-purple-950/30 hover:bg-purple-900/40 text-purple-200 rounded-xl text-left text-xs border border-purple-500/40 transition-all">
              <div class="flex items-center gap-1 font-bold text-purple-300">
                <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> App Admin
              </div>
              <div class="text-[10px] text-slate-400 truncate">admin@faithengineers.com</div>
              <div class="text-[10px] text-purple-400 font-mono font-bold">admin123</div>
            </button>

            <button type="button" onclick="App.fillDemoLogin('manager@faithengineers.com', 'manager123')" class="px-2.5 py-2 bg-amber-950/30 hover:bg-amber-900/40 text-amber-200 rounded-xl text-left text-xs border border-amber-500/40 transition-all">
              <div class="flex items-center gap-1 font-bold text-amber-300">
                <i data-lucide="check-check" class="w-3.5 h-3.5"></i> Plant Manager
              </div>
              <div class="text-[10px] text-slate-400 truncate">manager@faithengineers.com</div>
              <div class="text-[10px] text-amber-400 font-mono font-bold">manager123</div>
            </button>

            <button type="button" onclick="App.fillDemoLogin('puttraj@faithengineers.com', 'pass123')" class="px-2.5 py-2 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-200 rounded-xl text-left text-xs border border-emerald-500/40 transition-all">
              <div class="flex items-center gap-1 font-bold text-emerald-300">
                <i data-lucide="scan-line" class="w-3.5 h-3.5"></i> Supervisor
              </div>
              <div class="text-[10px] text-slate-400 truncate">puttraj@faithengineers.com</div>
              <div class="text-[10px] text-emerald-400 font-mono font-bold">pass123</div>
            </button>
          </div>
        </div>

        <!-- Supabase Settings Link -->
        <div class="mt-4 text-center">
          <button type="button" onclick="App.openSupabaseConfigModal()" class="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium">
            <i data-lucide="database" class="w-3.5 h-3.5"></i> Configure Supabase Cloud Credentials
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  fillDemoLogin(email, pass) {
    const emailEl = document.getElementById('login-email');
    const passEl = document.getElementById('login-password');
    if (emailEl) emailEl.value = email;
    if (passEl) passEl.value = pass;
    this.handleLoginSubmit(new Event('submit'));
  },

  async handleLoginSubmit(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    try {
      this.showLoading(true);
      const user = await FaithAuth.login(email, pass);
      this.showToast(`Welcome back, ${user.full_name}!`, 'success');
      this.checkAuthState();
    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      this.showLoading(false);
    }
  },

  renderUserHeader(user) {
    const nameEl = document.getElementById('header-user-name');
    const roleEl = document.getElementById('header-user-role');
    const avatarEl = document.getElementById('header-user-avatar');

    if (nameEl) nameEl.innerText = user.full_name;
    if (roleEl) {
      if (user.role === 'admin') {
        roleEl.innerHTML = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">APP ADMIN (Full Access)</span>`;
      } else if (user.role === 'management') {
        roleEl.innerHTML = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">PLANT MANAGER (Approver)</span>`;
      } else {
        roleEl.innerHTML = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">SITE SUPERVISOR</span>`;
      }
    }
    if (avatarEl) {
      avatarEl.innerText = user.full_name.charAt(0);
      if (user.role === 'admin') {
        avatarEl.className = 'w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold text-xs';
      } else if (user.role === 'management') {
        avatarEl.className = 'w-8 h-8 rounded-xl bg-amber-600/30 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-xs';
      } else {
        avatarEl.className = 'w-8 h-8 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center justify-center font-bold text-xs';
      }
    }
  },

  /**
   * Switch between Main Portal Tabs
   */
  switchTab(tabName) {
    this.currentTab = tabName;

    // Hide all tab views
    const tabViews = document.querySelectorAll('.tab-content-view');
    tabViews.forEach(v => v.classList.add('hidden'));

    // Show selected view
    const targetView = document.getElementById(`tab-${tabName}`);
    if (targetView) targetView.classList.remove('hidden');

    // Update desktop nav styling
    const navBtns = document.querySelectorAll('.nav-tab-btn');
    navBtns.forEach(btn => {
      const target = btn.getAttribute('data-tab');
      if (target === tabName) {
        btn.classList.add('active', 'border-b-2', 'border-blue-500', 'text-blue-400');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('active', 'border-b-2', 'border-blue-500', 'text-blue-400');
        btn.classList.add('text-slate-400');
      }
    });

    // Update mobile bottom nav styling
    const mobileBtns = document.querySelectorAll('.mobile-nav-item');
    mobileBtns.forEach(btn => {
      const target = btn.getAttribute('data-tab');
      if (target === tabName) {
        btn.classList.add('active', 'text-blue-400');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('active', 'text-blue-400');
        btn.classList.add('text-slate-400');
      }
    });

    // Execute Module init/render
    if (tabName === 'attendance') {
      AttendanceModule.init();
    } else if (tabName === 'dashboard') {
      DashboardModule.init();
    } else if (tabName === 'reports') {
      ReportsModule.init();
    } else if (tabName === 'masters') {
      MastersModule.init();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.lucide) window.lucide.createIcons();
  },

  refreshCurrentView() {
    this.switchTab(this.currentTab);
  },

  updateRealtimeIndicator() {
    const badge = document.getElementById('supabase-realtime-badge');
    if (!badge) return;

    if (window.isSupabaseConnected && window.isSupabaseConnected()) {
      badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Realtime Live';
    } else {
      badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer';
      badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400"></span> Supabase Setup';
      badge.onclick = () => App.openSupabaseConfigModal();
    }
  },

  // ============================================================================
  // SUPABASE CREDENTIALS MODAL
  // ============================================================================
  openSupabaseConfigModal() {
    const currentUrl = localStorage.getItem('FAITH_SUPABASE_URL') || (window.FAITH_CONFIG && window.FAITH_CONFIG.SUPABASE_URL) || 'https://auogpefvntixexxxkrui.supabase.co';
    const currentKey = localStorage.getItem('FAITH_SUPABASE_ANON_KEY') || (window.FAITH_CONFIG && window.FAITH_CONFIG.SUPABASE_ANON_KEY) || 'sb_publishable_9NYcFiHZ5AvxCnsrMyynTw_JeSC4NYo';

    this.showModal(`
      <div class="space-y-4">
        <div class="flex items-center gap-2 pb-3 border-b border-slate-800">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <i data-lucide="database" class="w-4 h-4"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Supabase Cloud Database Settings</h3>
            <p class="text-xs text-slate-400">Connect to your Supabase PostgreSQL project for live sync.</p>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Supabase Project URL <span class="text-red-400">*</span>
          </label>
          <input type="url" id="sb-url-input" value="${currentUrl}" placeholder="https://<your-project-ref>.supabase.co" class="w-full bg-slate-900 text-white rounded-xl px-3 py-2.5 text-xs font-mono border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <p class="text-[11px] text-slate-500 mt-1">Found under Project Settings &rarr; API &rarr; Project URL</p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Supabase Anon Key (Public API Key) <span class="text-red-400">*</span>
          </label>
          <textarea id="sb-key-input" rows="3" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." class="w-full bg-slate-900 text-white rounded-xl p-3 text-xs font-mono border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">${currentKey}</textarea>
          <p class="text-[11px] text-slate-500 mt-1">Found under Project Settings &rarr; API &rarr; Project API Keys &rarr; anon public</p>
        </div>

        <div class="bg-blue-950/30 p-3 rounded-xl border border-blue-800/40 text-xs text-blue-200">
          <p class="font-semibold mb-1 flex items-center gap-1">
            <i data-lucide="info" class="w-3.5 h-3.5"></i> SQL Schema Setup:
          </p>
          <p class="text-[11px] text-slate-300">
            Make sure you have executed <code class="text-blue-400 font-mono">supabase/supabase_schema.sql</code> in your Supabase SQL Editor to create the required tables.
          </p>
        </div>

        <div class="flex items-center justify-between pt-2">
          <button type="button" onclick="App.clearSupabaseConfig()" class="text-xs text-red-400 hover:text-red-300 underline">
            Clear Credentials (Use Local)
          </button>
          <div class="flex gap-2">
            <button type="button" onclick="App.closeModal()" class="px-4 py-2 text-xs text-slate-400 hover:text-white">Cancel</button>
            <button type="button" onclick="App.saveSupabaseConfig()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md">
              Test & Connect
            </button>
          </div>
        </div>
      </div>
    `);
  },

  async saveSupabaseConfig() {
    const url = document.getElementById('sb-url-input').value;
    const key = document.getElementById('sb-key-input').value;

    this.showLoading(true);
    const result = await window.saveSupabaseCredentials(url, key);
    this.showLoading(false);

    if (result.success) {
      this.closeModal();
      this.showToast('✅ ' + result.message, 'success');
      this.updateRealtimeIndicator();
      this.refreshCurrentView();
    } else {
      this.showToast('❌ ' + result.message, 'error');
    }
  },

  async clearSupabaseConfig() {
    await window.saveSupabaseCredentials('', '');
    this.closeModal();
    this.showToast('Supabase disconnected. Using local persistent storage.', 'info');
    this.updateRealtimeIndicator();
  },

  // ============================================================================
  // UI UTILITIES: MODALS, TOASTS, LOADING
  // ============================================================================
  showModal(contentHtml) {
    const modalBackdrop = document.getElementById('app-modal');
    const modalBody = document.getElementById('app-modal-body');
    if (modalBackdrop && modalBody) {
      modalBody.innerHTML = contentHtml;
      modalBackdrop.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  },

  closeModal() {
    const modalBackdrop = document.getElementById('app-modal');
    if (modalBackdrop) modalBackdrop.classList.add('hidden');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
      error: 'bg-red-950/90 border-red-500/50 text-red-200',
      warning: 'bg-amber-950/90 border-amber-500/50 text-amber-200',
      info: 'bg-slate-900/90 border-blue-500/50 text-slate-200'
    };

    toast.className = `p-3.5 rounded-2xl shadow-2xl border backdrop-blur-md text-xs sm:text-sm font-medium flex items-center justify-between gap-3 transform transition-all duration-300 translate-y-2 opacity-0 ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <span>${message}</span>
      </div>
      <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white">&times;</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  },

  showLoading(isLoading) {
    const loader = document.getElementById('global-loader');
    if (loader) {
      if (isLoading) loader.classList.remove('hidden');
      else loader.classList.add('hidden');
    }
  }
};

window.App = App;
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});

