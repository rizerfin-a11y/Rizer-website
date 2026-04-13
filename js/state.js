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
  gcalClientId: '410090649050-l381juv9ftjlc5uop9ak28fivcci6g2e.apps.googleusercontent.com',
  theme: 'dark',
  notifEnabled: true,
  currentPage: 'dashboard',
  selectedDate: new Date().toISOString().split('T')[0]
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
      // Always use the hardcoded Client ID for the live app
      state.gcalClientId = '410090649050-l381juv9ftjlc5uop9ak28fivcci6g2e.apps.googleusercontent.com';
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
