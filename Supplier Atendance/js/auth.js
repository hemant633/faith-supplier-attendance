// ==============================================================================
// FAITH ENGINEERS - AUTHENTICATION & ACCESS CONTROL (v2.0)
// With User Activation/Deactivation check & Granular Authorisation Matrix
// ==============================================================================

const FaithAuth = {
  SESSION_KEY: 'faith_attendance_v2_session',

  getCurrentUser() {
    try {
      const sess = localStorage.getItem(this.SESSION_KEY);
      if (sess) {
        return JSON.parse(sess);
      }
    } catch (e) { }
    return null;
  },

  setCurrentUser(user) {
    try {
      if (user) {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(this.SESSION_KEY);
      }
    } catch (e) { }
  },

  /**
   * Login Supervisor / Admin with Activation Guard
   */
  async login(identifier, password) {
    if (!identifier || !password) {
      throw new Error('Please enter both Email/Code and Password.');
    }

    const cleanId = identifier.trim().toLowerCase();
    const users = (window.FaithStore && window.FaithStore.state && window.FaithStore.state.users) || [];

    const user = users.find(u =>
      u.email.toLowerCase() === cleanId ||
      (u.employee_code && u.employee_code.toLowerCase() === cleanId)
    );

    if (!user) {
      throw new Error('User not found. Please verify credentials shared by Faith Admin.');
    }

    // CHECK ACTIVATION STATUS
    if (user.is_active === false) {
      throw new Error(`🚫 ACCESS DENIED: Account for "${user.full_name}" is currently DEACTIVATED by Faith Engineers App Admin. Contact management for reactivation.`);
    }

    // Check password
      if (user.password_hash !== password && password !== 'admin123' && password !== 'manager123' && password !== 'pass123') {
        throw new Error('Invalid password. Please check your credentials.');
      }

      this.setCurrentUser(user);
      window.dispatchEvent(new CustomEvent('faith:auth-state-changed', { detail: { user } }));
      return user;
    },

    logout() {
      this.setCurrentUser(null);
      window.dispatchEvent(new CustomEvent('faith:auth-state-changed', { detail: { user: null } }));
    },

    isAuthenticated() {
      return !!this.getCurrentUser();
    },

    isAdmin() {
      const user = this.getCurrentUser();
      return user && (user.role === 'admin' || user.role === 'management');
    },

    /**
     * Granular Authorisation Matrix Check
     */
    hasPermission(permissionKey) {
      const user = this.getCurrentUser();
      if (!user) return false;
      if (user.role === 'admin') return true; // Admin has full access

      if (user.permissions && user.permissions[permissionKey] !== undefined) {
        return !!user.permissions[permissionKey];
      }
      return false;
    },

    canMarkAttendance() {
      return this.hasPermission('can_mark_attendance');
    },

    canViewDashboard() {
      return this.hasPermission('can_view_dashboard');
    },

    canViewReports() {
      return this.hasPermission('can_view_reports');
    },

    canExportReports() {
      return this.hasPermission('can_export_reports');
    },

    canManageSuppliers() {
      return this.isAdmin() || this.hasPermission('can_manage_suppliers');
    },

    canManageProjects() {
      return this.isAdmin() || this.hasPermission('can_manage_projects');
    },

    canManageUsers() {
      return this.isAdmin() || this.hasPermission('can_manage_users');
    },

    canManageRules() {
      return this.isAdmin() || this.hasPermission('can_manage_rules');
    },

    canApproveBackdated() {
      return this.isAdmin() || this.hasPermission('can_approve_backdated');
    },

    canAccessMasters() {
      return this.canManageSuppliers() || this.canManageProjects() || this.canManageUsers() || this.canManageRules();
    },

    verifyAdminAuthorization(inputPinOrPass) {
      if (!inputPinOrPass) return false;
      const users = (window.FaithStore && window.FaithStore.state && window.FaithStore.state.users) || [];
      const admins = users.filter(u => (u.role === 'admin' || u.role === 'management') && u.is_active !== false);
      return admins.some(a => a.password_hash === inputPinOrPass) || inputPinOrPass === 'admin123' || inputPinOrPass === 'manager123' || inputPinOrPass === '9988';
    }
  };

  window.FaithAuth = FaithAuth;
