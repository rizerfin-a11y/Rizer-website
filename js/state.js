/* ============================================================
   state.js — App State & LocalStorage Persistence
   All data is saved to localStorage so it survives page reloads.
   ============================================================ */

let state = {
  tasks: [],
  goals: [],
  gcalConnected: false,
  gcalToken: '',
  gcalId: 'primary',
  gcalClientId: '668653655128-aejgdu7ok0iqruu1c3l7gs8280qtpa8v.apps.googleusercontent.com',
  gcalApiKey: 'AIzaSyDX8G5tes9BUlZWoYS_lZ-3Nvutr5p_kHo',
  theme: 'light',
  notifEnabled: true,
  currentPage: 'dashboard',
  selectedDate: new Date().toISOString().split('T')[0],
  isGuest: false,
  sessionStartTime: null,
  isPremium: false,
  gcalPermission: null // null: not asked, true: granted, false: denied
};

/** Save the entire state to localStorage */
function save() {
  localStorage.setItem('spp_data', JSON.stringify(state));
}

/** Load state from localStorage; seed sample data if first visit */
function load() {
  const raw = localStorage.getItem('spp_data');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
      // Always use the hardcoded credentials for the live app
      state.gcalClientId = '668653655128-aejgdu7ok0iqruu1c3l7gs8280qtpa8v.apps.googleusercontent.com';
      state.gcalApiKey = 'AIzaSyDX8G5tes9BUlZWoYS_lZ-3Nvutr5p_kHo';
    } catch (e) {
      console.warn('Failed to parse saved state, using defaults.');
    }
  }
  if (state.tasks.length === 0) seedData();
}

/** Seed sample tasks & goals so the app looks populated on first run */
function seedData() {
  state.tasks = [];
  state.goals = [
    { id: uid(), title: 'Complete 3 tasks per day', period: 'daily', target: 3 }
  ];
  save();
}
