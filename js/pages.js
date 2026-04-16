/* ============================================================
   pages.js — Page Renderers (Dashboard, Tasks, Calendar, etc.)
   ============================================================ */

/* ──────────────────────────────────────────────
   NAVIGATION
────────────────────────────────────────────── */

function navigate(page) {
  if (page === 'settings' && state.isGuest) {
    if (typeof handleAddTaskClick === 'function') {
      handleAddTaskClick();
      return;
    }
  }
  state.currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById('nav-' + page);
  if (el) el.classList.add('active');
  renderPage();
}

function renderPage() {
  // Destroy any existing Chart.js instances before re-rendering
  Chart.helpers?.each(Chart.instances, c => c.destroy());

  // Update top login button
  const topBtn = document.getElementById('gcal-top-btn');
  if (topBtn) {
    topBtn.style.display = state.gcalConnected ? 'none' : 'flex';
    if (!state.gcalConnected && state.gcalToken) {
      topBtn.textContent = '📅 Sync Calendar';
    } else {
      topBtn.textContent = '🔑 Login';
    }
  }

  const c = document.getElementById('page-content');
  switch (state.currentPage) {
    case 'dashboard': c.innerHTML = renderDashboard(); postRenderDashboard(); break;
    case 'tasks': c.innerHTML = renderTasksPage(); break;
    case 'calendar': c.innerHTML = renderCalendar(); break;
    case 'analytics': c.innerHTML = renderAnalytics(); postRenderAnalytics(); break;
    case 'goals': c.innerHTML = renderGoals(); break;
    case 'history': c.innerHTML = renderHistory(); break;
    case 'settings': c.innerHTML = renderSettings(); break;
  }
}

/* ──────────────────────────────────────────────
   DASHBOARD
────────────────────────────────────────────── */

function generateInsights() {
  const insights = [];
  const tt = todayTasks();

  const highPending = tt.filter(t => !t.completed && t.priority === 'high');
  if (highPending.length > 0)
    insights.push({
      type: 'warn', title: '⚡ High Priority Pending',
      text: `${highPending.length} high-priority task(s) need your attention today.`
    });

  const freqResched = state.tasks.filter(t => t.rescheduled > 1);
  if (freqResched.length > 2)
    insights.push({
      type: 'danger', title: '🔄 Frequent Rescheduling',
      text: `${freqResched.length} tasks rescheduled multiple times. Consider breaking them down.`
    });

  const score = productivityScore();
  if (score >= 80)
    insights.push({
      type: 'success', title: '🌟 Great Work!',
      text: 'Your productivity score is excellent today. Keep it up!'
    });
  else if (score < 40 && tt.length > 0)
    insights.push({
      type: 'warn', title: '📉 Low Score',
      text: 'Score below 40%. Focus on high-priority tasks first.'
    });

  if (insights.length === 0)
    insights.push({
      type: '', title: '💡 Tip of the Day',
      text: 'Break large tasks into smaller subtasks to improve completion rates.'
    });

  return insights.slice(0, 3);
}

function renderDashboard() {
  const tt = todayTasks();
  const wt = weekTasks();
  const score = productivityScore();
  const streak = calcStreak();
  const overdue = overdueTasks();
  const scoreColor = score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
  const insights = generateInsights();

  return `
<h2 style="color:var(--text2);font-weight:400;font-size:13px;margin-bottom:4px">
  Good ${getGreeting()}
</h2>
<h1 style="font-size:24px;font-weight:700;margin-bottom:24px">Your Productivity Hub</h1>

${!state.gcalConnected ? `
<div class="card gcal-promo" style="background: linear-gradient(135deg, #4285f4, #34a853); color: white; border: none; margin-bottom: 24px;">
  <div style="display:flex; align-items:center; justify-content: space-between; gap: 20px;">
    <div>
      <h3 style="margin-bottom: 6px;">Sync with Google Calendar</h3>
      <p style="font-size: 13px; opacity: 0.9;">Automatically add your tasks to Google Calendar and stay organized across devices.</p>
    </div>
    <button class="btn" style="background: white; color: #4285f4; font-weight: 600;" onclick="loginWithGoogle()">
      Connect Now
    </button>
  </div>
</div>` : `
<div class="gcal-banner">
  <div class="gcal-dot"></div>
  <span style="font-size:13px;color:var(--text2)">
    <strong>Google Calendar</strong> connected — tasks sync automatically
  </span>
</div>`}

<!-- Metric cards -->
<div class="grid-4" style="margin-bottom:20px">
  <div class="metric-card">
    <div class="metric-accent">🎯</div>
    <div class="metric-label">Productivity Score</div>
    <div class="metric-value" style="color:${scoreColor}">${score}<span style="font-size:14px;color:var(--text3)">%</span></div>
    <div class="metric-sub">Today</div>
  </div>
  <div class="metric-card">
    <div class="metric-accent">✅</div>
    <div class="metric-label">Completed Today</div>
    <div class="metric-value">${tt.filter(t => t.completed).length}<span style="font-size:14px;color:var(--text3)">/${tt.length}</span></div>
    <div class="metric-sub">${completionRate(tt)}% completion rate</div>
  </div>
  <div class="metric-card">
    <div class="metric-accent">🔥</div>
    <div class="metric-label">Current Streak</div>
    <div class="metric-value" style="color:var(--amber)">${streak}<span style="font-size:14px;color:var(--text3)"> days</span></div>
    <div class="metric-sub">Consecutive productive days</div>
  </div>
  <div class="metric-card">
    <div class="metric-accent">⚠️</div>
    <div class="metric-label">Overdue Tasks</div>
    <div class="metric-value" style="color:var(--red)">${overdue.length}</div>
    <div class="metric-sub">${overdue.length > 0 ? 'Needs attention' : 'All clear!'}</div>
  </div>
</div>

<!-- Today's tasks + Insights -->
<div class="grid-2" style="margin-bottom:20px">
  <div class="card">
    <div class="section-header">
      <div class="section-title">Today's Tasks</div>
      <button class="btn btn-ghost btn-sm" onclick="navigate('tasks')">View all</button>
    </div>
    ${tt.length === 0
      ? `<div class="empty-state">
           <div class="empty-icon">📋</div>
           <p>No tasks for today</p>
           <button class="btn btn-primary btn-sm" onclick="handleAddTaskClick()" style="margin-top:8px">Add task</button>
         </div>`
      : tt.slice(0, 4).map(t => renderTaskItem(t, true)).join('')}
  </div>
  <div class="card">
    <div class="section-header"><div class="section-title">Smart Insights</div></div>
    ${insights.map(i => `
      <div class="insight-card ${i.type}">
        <div class="insight-title">${i.title}</div>
        <div class="insight-text">${i.text}</div>
      </div>`).join('')}
    ${overdue.length > 0 ? `
      <div class="insight-card danger">
        <div class="insight-title">⚠️ ${overdue.length} Overdue Task${overdue.length > 1 ? 's' : ''}</div>
        <div class="insight-text">${overdue.map(t => escHtml(t.title)).join(', ')}</div>
      </div>` : ''}
  </div>
</div>

<!-- Weekly chart -->
<div class="card" style="margin-bottom:20px">
  <div class="section-header">
    <div class="section-title">Weekly Progress</div>
    <span style="font-size:12px;color:var(--text3)">${completionRate(wt)}% this week</span>
  </div>
  <div class="chart-wrap chart-wrap-sm">
    <canvas id="weekChart" role="img" aria-label="Weekly task completion bar chart">
      Weekly planned vs completed bar chart.
    </canvas>
  </div>
</div>

<!-- Heatmap + Pie -->
<div class="grid-2">
  <div class="card">
    <div class="section-header"><div class="section-title">Activity Heatmap</div></div>
    <div class="heatmap" id="heatmap-mini"></div>
  </div>
  <div class="card">
    <div class="section-header"><div class="section-title">Task Distribution</div></div>
    <div class="chart-wrap chart-wrap-sm">
      <canvas id="pieChart" role="img" aria-label="Task priority distribution pie chart">
        Priority distribution: high, medium, low tasks.
      </canvas>
    </div>
  </div>
</div>`;
}

/* ──────────────────────────────────────────────
   TASKS PAGE
────────────────────────────────────────────── */

function renderTasksPage() {
  const activeTab = window._taskTab || 'today';
  const tabs = ['today', 'week', 'month', 'all'];
  const tabLabels = ['Today', 'This Week', 'This Month', 'All'];

  let filtered;
  const td = today();
  if (activeTab === 'today') filtered = state.tasks.filter(t => t.date === td);
  else if (activeTab === 'week') filtered = weekTasks();
  else if (activeTab === 'month') {
    const m = td.substr(0, 7);
    filtered = state.tasks.filter(t => t.date.startsWith(m));
  } else filtered = [...state.tasks];

  // Sort: pending first, then by priority
  const po = { high: 0, medium: 1, low: 2 };
  filtered.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (po[a.priority] || 1) - (po[b.priority] || 1);
  });

  return `
<div class="section-header">
  <h1 style="font-size:22px;font-weight:700">Tasks</h1>
  <button class="btn btn-primary btn-sm" onclick="handleAddTaskClick()">+ Add Task</button>
</div>

<div class="tabs" style="margin-bottom:20px;width:fit-content">
  ${tabs.map((t, i) => `
    <button class="tab ${activeTab === t ? 'active' : ''}"
            onclick="setTaskTab('${t}')">${tabLabels[i]}</button>`).join('')}
</div>

<div style="display:flex;gap:10px;margin-bottom:16px">
  <input class="form-input" style="max-width:240px" placeholder="🔍 Search tasks..."
         oninput="filterTaskSearch(this.value)" id="task-search">
  <select class="form-select" style="max-width:140px"
          onchange="filterTaskPriority(this.value)" id="task-priority-filter">
    <option value="">All priorities</option>
    <option value="high">High</option>
    <option value="medium">Medium</option>
    <option value="low">Low</option>
  </select>
</div>

<div id="task-list">
  ${filtered.length === 0
      ? `<div class="empty-state">
         <div class="empty-icon">📋</div>
         <p>No tasks here</p>
         <button class="btn btn-primary btn-sm" onclick="handleAddTaskClick()" style="margin-top:8px">+ Add Task</button>
       </div>`
      : filtered.map(t => renderTaskItem(t, false)).join('')}
</div>`;
}

function setTaskTab(tab) { window._taskTab = tab; navigate('tasks'); }

function filterTaskSearch(val) {
  document.querySelectorAll('.task-item').forEach(el => {
    const title = el.querySelector('.task-title')?.textContent.toLowerCase() || '';
    el.style.display = title.includes(val.toLowerCase()) ? '' : 'none';
  });
}

function filterTaskPriority(val) {
  document.querySelectorAll('.task-item').forEach(el => {
    el.style.display = (!val || el.innerHTML.includes(`badge-${val}`)) ? '' : 'none';
  });
}

/* ──────────────────────────────────────────────
   CALENDAR PAGE
────────────────────────────────────────────── */

function renderCalendar() {
  const selDate = state.selectedDate;
  const selTasks = state.tasks.filter(t => t.date === selDate);
  const d = new Date(selDate + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let cells = [];
  for (let i = 0; i < firstDay; i++)
    cells.push(`<div class="date-cell other-month"></div>`);

  for (let i = 1; i <= daysInMonth; i++) {
    const dt = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const hasTasks = state.tasks.some(t => t.date === dt);
    const isTd = dt === today();
    const isSel = dt === selDate;
    cells.push(`
      <div class="date-cell ${isTd ? 'today' : ''} ${isSel ? 'selected' : ''} ${hasTasks ? 'has-tasks' : ''}"
           onclick="selectDate('${dt}')">${i}</div>`);
  }

  return `
<div class="section-header">
  <h1 style="font-size:22px;font-weight:700">Calendar Planner</h1>
  <button class="btn btn-primary btn-sm" onclick="handleAddTaskClick()">
    + Plan ${formatDate(selDate)}
  </button>
</div>

${state.gcalConnected ? `
<div class="gcal-banner">
  <div class="gcal-dot"></div>
  <span style="font-size:13px;color:var(--text2)">
    <strong>Google Calendar Sync</strong> active — tasks you add appear in your Google Calendar
  </span>
</div>` : ''}

<div class="grid-2">
  <!-- Calendar -->
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <button class="btn btn-ghost btn-sm" onclick="prevMonth()">‹ Prev</button>
      <span style="font-weight:600">${monthNames[month]} ${year}</span>
      <button class="btn btn-ghost btn-sm" onclick="nextMonth()">Next ›</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:6px">
      ${['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d =>
    `<div style="text-align:center;font-size:11px;color:var(--text3);font-weight:600;padding:4px">${d}</div>`
  ).join('')}
    </div>
    <div class="date-grid">${cells.join('')}</div>
    <div style="display:flex;gap:12px;margin-top:12px;font-size:11px;color:var(--text3)">
      <span style="display:flex;align-items:center;gap:4px">
        <span style="width:8px;height:8px;border-radius:50%;background:var(--green);display:inline-block"></span>
        Has tasks
      </span>
      <span style="display:flex;align-items:center;gap:4px">
        <span style="width:8px;height:8px;border-radius:4px;background:var(--accent);display:inline-block"></span>
        Selected
      </span>
    </div>
  </div>

  <!-- Day detail -->
  <div class="card">
    <div class="section-header">
      <div class="section-title">📅 ${formatDate(selDate)}</div>
      <span style="font-size:12px;color:var(--text3)">${selTasks.length} task${selTasks.length !== 1 ? 's' : ''}</span>
    </div>
    ${selTasks.length === 0
      ? `<div class="empty-state">
           <div class="empty-icon">📋</div>
           <p>No tasks for this day</p>
           <button class="btn btn-primary btn-sm" onclick="handleAddTaskClick()" style="margin-top:8px">
             Plan this day
           </button>
         </div>`
      : selTasks.map(t => renderTaskItem(t, false)).join('')}
  </div>
</div>`;
}

function selectDate(dt) { state.selectedDate = dt; save(); navigate('calendar'); }

function prevMonth() {
  const d = new Date(state.selectedDate + 'T00:00:00');
  d.setMonth(d.getMonth() - 1);
  state.selectedDate = d.toISOString().split('T')[0];
  navigate('calendar');
}

function nextMonth() {
  const d = new Date(state.selectedDate + 'T00:00:00');
  d.setMonth(d.getMonth() + 1);
  state.selectedDate = d.toISOString().split('T')[0];
  navigate('calendar');
}

/* ──────────────────────────────────────────────
   ANALYTICS PAGE
────────────────────────────────────────────── */

function renderLagAnalysis() {
  const issues = [];
  const highOverdue = overdueTasks().filter(t => t.priority === 'high');
  if (highOverdue.length > 0)
    issues.push({
      type: 'danger', icon: '🚨',
      title: `${highOverdue.length} high-priority overdue`,
      text: 'Critical tasks are being delayed. Reschedule and prioritize them now.'
    });

  const freqResched = state.tasks.filter(t => t.rescheduled >= 2);
  if (freqResched.length > 0)
    issues.push({
      type: 'warn', icon: '🔄',
      title: `${freqResched.length} tasks rescheduled 2+ times`,
      text: 'Delayed tasks: ' + freqResched.map(t => t.title).slice(0, 2).join(', ')
    });

  const midWeekDates = getPastDates(7).filter(d => [2, 3].includes(new Date(d + 'T00:00:00').getDay()));
  const midWeekRate = midWeekDates.length
    ? Math.round(midWeekDates.reduce((a, d) =>
      a + completionRate(state.tasks.filter(t => t.date === d)), 0) / midWeekDates.length)
    : 100;
  if (midWeekRate < 50)
    issues.push({
      type: 'warn', icon: '📉',
      title: 'Mid-week productivity drop',
      text: `Wed/Thu completion rate is ${midWeekRate}%. Schedule lighter tasks mid-week.`
    });

  if (issues.length === 0)
    issues.push({
      type: 'success', icon: '✅',
      title: 'No lag detected!', text: 'Your productivity patterns look healthy. Keep it up!'
    });

  return issues.map(i => `
    <div class="insight-card ${i.type}" style="margin-bottom:8px">
      <div class="insight-title">${i.icon} ${i.title}</div>
      <div class="insight-text">${i.text}</div>
    </div>`).join('');
}

function renderAnalytics() {
  const wt = weekTasks();
  const wRate = completionRate(wt);
  const allDone = state.tasks.filter(t => t.completed).length;
  const reschedRate = state.tasks.length
    ? Math.round(state.tasks.filter(t => t.rescheduled > 0).length / state.tasks.length * 100)
    : 0;

  return `
<h1 style="font-size:22px;font-weight:700;margin-bottom:24px">Analytics & Insights</h1>

<div class="grid-4" style="margin-bottom:20px">
  <div class="metric-card"><div class="metric-accent">📊</div><div class="metric-label">Completion Rate</div><div class="metric-value">${completionRate(state.tasks)}<span style="font-size:14px;color:var(--text3)">%</span></div><div class="metric-sub">All time</div></div>
  <div class="metric-card"><div class="metric-accent">🔄</div><div class="metric-label">Reschedule Rate</div><div class="metric-value" style="color:var(--amber)">${reschedRate}<span style="font-size:14px;color:var(--text3)">%</span></div><div class="metric-sub">Tasks moved</div></div>
  <div class="metric-card"><div class="metric-accent">📅</div><div class="metric-label">Weekly Rate</div><div class="metric-value" style="color:var(--green)">${wRate}<span style="font-size:14px;color:var(--text3)">%</span></div><div class="metric-sub">This week</div></div>
  <div class="metric-card"><div class="metric-accent">🎯</div><div class="metric-label">Focus Score</div><div class="metric-value" style="color:var(--accent)">${Math.min(100, Math.round(allDone * 10))}<span style="font-size:14px;color:var(--text3)">/100</span></div><div class="metric-sub">Cumulative</div></div>
</div>

<div class="grid-2" style="margin-bottom:20px">
  <div class="card">
    <div class="section-title" style="margin-bottom:14px">📈 14-Day Completion Trend</div>
    <div class="chart-wrap">
      <canvas id="trendChart" role="img" aria-label="14-day completion trend line chart">Completion trend over 14 days.</canvas>
    </div>
  </div>
  <div class="card">
    <div class="section-title" style="margin-bottom:14px">📊 Planned vs Completed</div>
    <div class="chart-wrap">
      <canvas id="pvcChart" role="img" aria-label="Planned vs completed bar chart">Planned versus completed tasks per day.</canvas>
    </div>
  </div>
</div>

<div class="grid-2" style="margin-bottom:20px">
  <div class="card">
    <div class="section-title" style="margin-bottom:14px">🥧 Priority Distribution</div>
    <div class="chart-wrap">
      <canvas id="priChart" role="img" aria-label="Priority distribution doughnut chart">Task priority breakdown.</canvas>
    </div>
  </div>
  <div class="card">
    <div class="section-title" style="margin-bottom:14px">🌡️ Activity Heatmap (28 days)</div>
    <div class="heatmap" id="heatmap-full" style="gap:4px"></div>
  </div>
</div>

<div class="card">
  <div class="section-title" style="margin-bottom:14px">🔍 Lag Analysis</div>
  ${renderLagAnalysis()}
</div>`;
}

/* ──────────────────────────────────────────────
   GOALS PAGE
────────────────────────────────────────────── */

function renderGoals() {
  const dailyGoal = state.goals.find(g => g.period === 'daily');
  const weeklyGoal = state.goals.find(g => g.period === 'weekly');
  const todayCount = todayTasks().filter(t => t.completed).length;
  const weekRate = completionRate(weekTasks());

  function goalBar(current, target, unit = '') {
    const pct = Math.min(100, Math.round(current / target * 100));
    const color = pct >= 100 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)';
    return `
      <div style="margin-top:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);margin-bottom:6px">
          <span>${current}${unit} / ${target}${unit}</span>
          <span style="color:${color}">${pct}%</span>
        </div>
        <div class="progress-bar" style="margin:0;height:6px;border-radius:3px">
          <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>`;
  }

  const consistencyPct = Math.round(
    getPastDates(14).filter(d => completionRate(state.tasks.filter(t => t.date === d)) >= 50).length / 14 * 100
  );

  return `
<div class="section-header">
  <h1 style="font-size:22px;font-weight:700">Goals & Achievements</h1>
  <button class="btn btn-primary btn-sm" onclick="handleAddTaskClick()">+ Set Goal</button>
</div>

<div class="grid-2" style="margin-bottom:20px">
  <div class="card">
    <div class="section-title">🌅 Daily Goal</div>
    ${dailyGoal
      ? `<p style="color:var(--text2);font-size:13px;margin-top:8px">${escHtml(dailyGoal.title)}</p>
         ${goalBar(todayCount, dailyGoal.target, ' tasks')}`
      : `<p style="color:var(--text3);font-size:13px;margin-top:8px">No daily goal set</p>
         <button class="btn btn-ghost btn-sm" onclick="openAddGoal()" style="margin-top:8px">Set daily goal</button>`}
  </div>
  <div class="card">
    <div class="section-title">📅 Weekly Goal</div>
    ${weeklyGoal
      ? `<p style="color:var(--text2);font-size:13px;margin-top:8px">${escHtml(weeklyGoal.title)}</p>
         ${goalBar(weekRate, weeklyGoal.target, '%')}`
      : `<p style="color:var(--text3);font-size:13px;margin-top:8px">No weekly goal set</p>
         <button class="btn btn-ghost btn-sm" onclick="openAddGoal()" style="margin-top:8px">Set weekly goal</button>`}
  </div>
</div>

<div class="card">
  <div class="section-title" style="margin-bottom:16px">🏆 Performance Metrics</div>
  <div class="grid-4">
    <div class="metric-card"><div class="metric-label">Consistency</div><div class="metric-value">${consistencyPct}<span style="font-size:14px;color:var(--text3)">%</span></div><div class="metric-sub">2-week avg</div></div>
    <div class="metric-card"><div class="metric-label">Completion Rate</div><div class="metric-value">${completionRate(state.tasks)}<span style="font-size:14px;color:var(--text3)">%</span></div><div class="metric-sub">All time</div></div>
    <div class="metric-card"><div class="metric-label">Reschedule Rate</div><div class="metric-value">${state.tasks.length ? Math.round(state.tasks.filter(t => t.rescheduled > 0).length / state.tasks.length * 100) : 0}<span style="font-size:14px;color:var(--text3)">%</span></div><div class="metric-sub">Tasks moved</div></div>
    <div class="metric-card"><div class="metric-label">Streak</div><div class="metric-value" style="color:var(--amber)">${calcStreak()}<span style="font-size:14px;color:var(--text3)"> days</span></div><div class="metric-sub">Current</div></div>
  </div>
</div>`;
}

/* ──────────────────────────────────────────────
   HISTORY PAGE
────────────────────────────────────────────── */

function renderHistory() {
  const past = getPastDates(30).reverse();  // most recent first

  return `
<h1 style="font-size:22px;font-weight:700;margin-bottom:24px">Timeline History</h1>

<div style="display:flex;gap:10px;margin-bottom:16px">
  <input type="date" class="form-input" style="max-width:180px" id="hist-from">
  <input type="date" class="form-input" style="max-width:180px" id="hist-to">
  <select class="form-select" style="max-width:140px" id="hist-filter">
    <option value="">All</option>
    <option value="completed">Completed</option>
    <option value="rescheduled">Rescheduled</option>
    <option value="overdue">Overdue</option>
  </select>
</div>

<div id="history-list">
  ${past.map(d => {
    const tasks = state.tasks.filter(t => t.date === d);
    if (!tasks.length) return '';
    const rate = completionRate(tasks);
    const color = rate >= 80 ? 'var(--green)' : rate >= 50 ? 'var(--amber)' : 'var(--red)';
    return `
      <div class="card" style="margin-bottom:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div>
            <span style="font-weight:600;font-size:14px">${formatDate(d)}</span>
            ${d === today() ? `<span class="badge badge-tag" style="margin-left:6px">Today</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:12px;color:var(--text3)">${tasks.filter(t => t.completed).length}/${tasks.length} done</span>
            <span style="font-size:13px;font-weight:600;color:${color}">${rate}%</span>
          </div>
        </div>
        ${tasks.map(t => renderTaskItem(t, true)).join('')}
      </div>`;
  }).join('')}
</div>`;
}

/* ──────────────────────────────────────────────
   SETTINGS PAGE
────────────────────────────────────────────── */

function renderSettings() {
  return `
<h1 style="font-size:22px;font-weight:700;margin-bottom:24px">Settings</h1>

<!-- Appearance -->
<div class="card" style="margin-bottom:16px">
  <div class="section-title" style="margin-bottom:16px">🎨 Appearance</div>
  <div style="display:flex;align-items:center;justify-content:space-between">
    <span style="font-size:13px">Theme</span>
    <button class="btn btn-ghost btn-sm" onclick="toggleTheme()">
      Switch to ${state.theme === 'dark' ? 'Light' : 'Dark'} Mode
    </button>
  </div>
</div>

<!-- Google Calendar -->
<div class="card" style="margin-bottom:16px">
  <div class="section-title" style="margin-bottom:4px">📅 Google Calendar Integration</div>
  <p style="font-size:12px;color:var(--text3);margin-bottom:16px">
    Connect your personal Google Calendar to sync tasks and deadlines automatically.
  </p>

  ${state.gcalToken
      ? (state.gcalConnected
        ? `<div style="display:flex;align-items:center;gap:15px;margin-bottom:12px">
             <div style="display:flex;align-items:center;gap:8px;color:var(--green);font-size:13px">
               <div class="gcal-dot"></div> Connected
             </div>
             <button class="btn btn-ghost btn-sm" onclick="syncAllToGCal()">🔄 Sync All Tasks</button>
             <button class="btn btn-danger btn-sm" onclick="disconnectGCal()">Disconnect</button>
           </div>`
        : `<div style="display:flex;align-items:center;gap:15px;margin-bottom:12px">
             <div style="display:flex;align-items:center;gap:8px;color:var(--amber);font-size:13px">
               <div class="gcal-dot" style="background:var(--amber)"></div> Sync Disabled
             </div>
             <button class="btn btn-primary btn-sm" onclick="loginWithGoogle()">Enable Calendar Sync</button>
             <button class="btn btn-danger btn-sm" onclick="disconnectGCal()">Sign Out</button>
           </div>`)
      : `<button class="btn btn-primary btn-sm" onclick="loginWithGoogle()">🔑 Sign in with Google</button>`}
</div>

<!-- Notifications -->
<div class="card" style="margin-bottom:16px">
  <div class="section-title" style="margin-bottom:16px">🔔 Notifications</div>
  <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13px">
    <input type="checkbox" ${state.notifEnabled ? 'checked' : ''}
           onchange="toggleNotif(this.checked)">
    In-app notifications for overdue tasks on load
  </label>
</div>

<!-- Export & Reset -->
<div class="card">
  <div class="section-title" style="margin-bottom:16px">📤 Data Management</div>
  <div style="display:flex;gap:10px;flex-wrap:wrap">
    <button class="btn btn-ghost" onclick="exportCSV()">📄 Export CSV</button>
    <button class="btn btn-danger btn-sm" onclick="clearData()">🗑️ Clear All Data</button>
  </div>
</div>`;
}

/* ──────────────────────────────────────────────
   NOTIFICATION POPUP
────────────────────────────────────────────── */

function showNotifications() {
  const overdue = overdueTasks();
  const pending = todayTasks().filter(t => !t.completed);
  const msgs = [];

  if (overdue.length > 0)
    msgs.push({ icon: '⚠️', text: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`, color: 'var(--red)' });
  if (pending.length > 0)
    msgs.push({ icon: '📋', text: `${pending.length} pending task${pending.length > 1 ? 's' : ''} today`, color: 'var(--amber)' });
  if (msgs.length === 0)
    msgs.push({ icon: '✅', text: 'All caught up! Great work.', color: 'var(--green)' });

  showModal(`
<div class="modal-header">
  <div class="modal-title">🔔 Notifications</div>
  <button class="close-btn" onclick="closeModal()">×</button>
</div>
${msgs.map(m => `
  <div style="padding:12px;background:var(--bg3);border-radius:8px;margin-bottom:8px;font-size:13px;
              display:flex;align-items:center;gap:10px;border-left:3px solid ${m.color}">
    <span style="font-size:18px">${m.icon}</span>
    <span>${m.text}</span>
  </div>`).join('')}`);
}
