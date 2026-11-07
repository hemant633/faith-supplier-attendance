// ==============================================================================
// FAITH ENGINEERS - SUPABASE CLIENT INTEGRATION & REAL-TIME SYNC
// ==============================================================================

let supabaseClient = null;
let realtimeSubscription = null;

function safeStorageGet(key) {
  try {
    return localStorage.getItem(key) || '';
  } catch (e) {
    return '';
  }
}

function safeStorageSet(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch (e) {}
}

function safeStorageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

/**
 * Initialize Supabase Client
 */
function initSupabase() {
  const url = safeStorageGet('FAITH_SUPABASE_URL') || (window.FAITH_CONFIG && window.FAITH_CONFIG.SUPABASE_URL) || 'https://auogpefvntixexxxkrui.supabase.co';
  const key = safeStorageGet('FAITH_SUPABASE_ANON_KEY') || (window.FAITH_CONFIG && window.FAITH_CONFIG.SUPABASE_ANON_KEY) || 'sb_publishable_9NYcFiHZ5AvxCnsrMyynTw_JeSC4NYo';

  if (url && key && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(url.trim(), key.trim(), {
        auth: { persistSession: true, autoRefreshToken: true },
        realtime: { params: { eventsPerSecond: 10 } }
      });
      console.log('✅ Supabase Client initialized with endpoint:', url);
      setupRealtimeSubscriptions();
      return supabaseClient;
    } catch (err) {
      console.error('❌ Failed to initialize Supabase client:', err);
      supabaseClient = null;
    }
  } else {
    supabaseClient = null;
  }
  return null;
}

/**
 * Setup Realtime Database Subscriptions for Instant Multi-Device Sync
 */
function setupRealtimeSubscriptions() {
  if (!supabaseClient) return;

  try {
    if (realtimeSubscription) {
      realtimeSubscription.unsubscribe();
    }

    realtimeSubscription = supabaseClient
      .channel('faith_realtime_attendance_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'faith_attendance_logs' }, (payload) => {
        console.log('⚡ Realtime Attendance Update Received:', payload);
        window.dispatchEvent(new CustomEvent('faith:realtime-attendance', { detail: payload }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'faith_supplier_employees' }, (payload) => {
        console.log('⚡ Realtime Employee Update Received:', payload);
        window.dispatchEvent(new CustomEvent('faith:realtime-masters', { detail: payload }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'faith_suppliers' }, (payload) => {
        console.log('⚡ Realtime Supplier Update Received:', payload);
        window.dispatchEvent(new CustomEvent('faith:realtime-masters', { detail: payload }));
      })
      .subscribe((status) => {
        console.log('📡 Realtime Subscription Status:', status);
        const indicator = document.getElementById('supabase-realtime-badge');
        if (indicator) {
          if (status === 'SUBSCRIBED') {
            indicator.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            indicator.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Realtime Live';
          } else {
            indicator.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30';
            indicator.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400"></span> Connecting...';
          }
        }
      });
  } catch (err) {
    console.warn('Realtime subscription suppressed:', err);
  }
}

/**
 * Save new Supabase credentials and re-initialize connection
 */
async function saveSupabaseCredentials(url, key) {
  if (!url || !key) {
    safeStorageRemove('FAITH_SUPABASE_URL');
    safeStorageRemove('FAITH_SUPABASE_ANON_KEY');
    supabaseClient = null;
    return { success: true, message: 'Supabase credentials cleared. Using local database.' };
  }

  const cleanUrl = url.trim();
  const cleanKey = key.trim();

  try {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Supabase JS library not loaded. Check internet connection.');
    }

    const testClient = window.supabase.createClient(cleanUrl, cleanKey);
    // Test connectivity by querying projects table
    const { data, error } = await testClient.from('faith_projects').select('code').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, it's ok, but bad URL or wrong API key gives HTTP 401 or network error
      if (error.message && (error.message.includes('Invalid API key') || error.message.includes('JWT') || error.message.includes('Failed to fetch'))) {
        throw new Error(error.message);
      }
    }

    safeStorageSet('FAITH_SUPABASE_URL', cleanUrl);
    safeStorageSet('FAITH_SUPABASE_ANON_KEY', cleanKey);
    
    if (window.FAITH_CONFIG) {
      window.FAITH_CONFIG.SUPABASE_URL = cleanUrl;
      window.FAITH_CONFIG.SUPABASE_ANON_KEY = cleanKey;
    }

    supabaseClient = testClient;
    setupRealtimeSubscriptions();

    // Trigger initial cloud sync
    if (window.FaithStore && typeof window.FaithStore.syncWithSupabase === 'function') {
      await window.FaithStore.syncWithSupabase();
    }

    return { success: true, message: 'Connected successfully to Faith Engineers Supabase Database!' };
  } catch (err) {
    console.error('Supabase connection test failed:', err);
    return { success: false, message: 'Connection failed: ' + err.message };
  }
}

window.getSupabaseClient = () => {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
};

window.isSupabaseConnected = () => {
  return !!supabaseClient;
};

window.saveSupabaseCredentials = saveSupabaseCredentials;

