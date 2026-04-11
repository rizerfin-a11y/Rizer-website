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
  const td = today();
  const yesterday = dateDelta(-1);
  const tomorrow = dateDelta(+1);

  state.tasks = [
    {
      id: uid(), title: 'Review Q3 analytics report',
      desc: 'Analyse KPIs and prepare executive summary',
      priority: 'high', estTime: 90, deadline: td,
      tags: ['work', 'analytics'], progress: 70,
      completed: false, date: td, rescheduled: 0,
      notes: '', createdAt: Date.now() - 3_600_000
    },
    {
      id: uid(), title: 'Morning workout — 5 km run',
      desc: 'Cardio session before breakfast',
      priority: 'medium', estTime: 45, deadline: td,
      tags: ['health'], progress: 100,
      completed: true, date: td, rescheduled: 0,
      notes: '', createdAt: Date.now() - 7_200_000
    },
    {
      id: uid(), title: 'Team standup meeting',
      desc: 'Daily sync with the dev team',
      priority: 'high', estTime: 30, deadline: td,
      tags: ['meetings'], progress: 100,
      completed: true, date: td, rescheduled: 0,
      notes: '', createdAt: Date.now() - 5_400_000
    },
    {
      id: uid(), title: 'Write blog post draft',
      desc: 'Tech trends article for Q4 newsletter',
      priority: 'low', estTime: 120, deadline: tomorrow,
      tags: ['writing'], progress: 20,
      completed: false, date: tomorrow, rescheduled: 1,
      notes: '', createdAt: Date.now() - 86_400_000 * 2
    },
    {
      id: uid(), title: 'Client proposal — Acme Corp',
      desc: 'Prepare full proposal deck for new contract',
      priority: 'high', estTime: 180, deadline: yesterday,
      tags: ['sales', 'urgent'], progress: 50,
      completed: false, date: yesterday, rescheduled: 2,
      notes: 'Need client brief first',
      createdAt: Date.now() - 86_400_000 * 3
    }
  ];

  state.goals = [
    { id: uid(), title: 'Complete 5 tasks per day', period: 'daily', target: 5 },
    { id: uid(), title: '80% task completion rate this week', period: 'weekly', target: 80 }
  ];

  save();
}
