/* ============================================================
   helpers.js — Utility / Pure-Function Helpers
   ============================================================ */

/** Generate a short unique ID */
function uid() { return Math.random().toString(36).substr(2, 9); }

/** Return today's date string YYYY-MM-DD */
function today() { return new Date().toISOString().split('T')[0]; }

/** Return date ± n days as YYYY-MM-DD */
function dateDelta(n) {
  return new Date(Date.now() + n * 86_400_000).toISOString().split('T')[0];
}

/** Tasks for today */
function todayTasks() { return state.tasks.filter(t => t.date === today()); }

/** Tasks within the current calendar week (Sun–Sat) */
function weekTasks() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  const start = d.toISOString().split('T')[0];
  const end = new Date(d.getTime() + 6 * 86_400_000).toISOString().split('T')[0];
  return state.tasks.filter(t => t.date >= start && t.date <= end);
}

/** Tasks that are past their deadline and not completed */
function overdueTasks() {
  return state.tasks.filter(t => !t.completed && t.deadline && t.deadline < today());
}

/** % of tasks completed within a given array */
function completionRate(tasks) {
  if (!tasks.length) return 0;
  return Math.round(tasks.filter(t => t.completed).length / tasks.length * 100);
}

/** Daily productivity score (0–100) */
function productivityScore() {
  const t = todayTasks();
  if (!t.length) return 0;
  const comp = completionRate(t);
  const highTotal = t.filter(x => x.priority === 'high').length;
  const highDone = t.filter(x => x.completed && x.priority === 'high').length;
  const highBonus = highTotal ? (highDone / highTotal) * 20 : 0;
  return Math.min(100, Math.round(comp * 0.8 + highBonus));
}

/** Count consecutive days with ≥50% completion */
function calcStreak() {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const dt = dateDelta(-i);
    const tasks = state.tasks.filter(t => t.date === dt);
    if (!tasks.length && i > 0) break;
    if (tasks.length && completionRate(tasks) >= 50) streak++;
    else if (tasks.length) break;
  }
  return streak;
}

/** Return array of n date strings ending today, oldest first */
function getPastDates(n) {
  return Array.from({ length: n }, (_, i) => dateDelta(-(n - 1 - i)));
}

/** Human-readable date e.g. "Apr 11, 2026" */
function formatDate(d) {
  const hasTime = d.includes('T');
  const dateObj = new Date(hasTime ? d : d + 'T00:00:00');

  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  if (hasTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return dateObj.toLocaleDateString('en-US', options);
}

/** Format a time range e.g. "Apr 11, 12:00 PM – 1:00 PM" */
function formatTimeRange(start, end) {
  if (!start) return '';
  const hasStartT = start.includes('T');
  const hasEndT = end && end.includes('T');

  if (!hasStartT) return formatDate(start);

  const startDt = new Date(start);
  const dateStr = startDt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const startStr = startDt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (hasEndT) {
    const endDt = new Date(end);
    const endStr = endDt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr}, ${startStr} – ${endStr}`;
  }

  return `${dateStr}, ${startStr}`;
}

/** Priority badge HTML */
function priorityBadge(p) {
  return `<span class="badge badge-${p}">${p}</span>`;
}

/** Greeting based on time of day */
function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

/** Escape HTML to prevent XSS in dynamic content */
function escHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Show a toast notification */
function notify(msg, type = 'info') {
  const colors = { success: '#10b981', warn: '#f59e0b', info: '#6366f1', danger: '#ef4444' };
  const n = document.createElement('div');
  n.className = 'notif';
  n.style.borderLeft = `3px solid ${colors[type] || colors.info}`;
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3500);
}

/** Show / hide modal */
function showModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal').style.display = 'flex';
}
function closeModal() { document.getElementById('modal').style.display = 'none'; }

/** Export all tasks as a CSV file download */
function exportCSV() {
  const headers = ['Title', 'Description', 'Priority', 'Date', 'Deadline', 'Status', 'Progress', 'Tags', 'Rescheduled', 'EstTime(min)'];
  const rows = state.tasks.map(t => [
    `"${t.title}"`, `"${t.desc || ''}"`, t.priority, t.date,
    t.deadline || '', t.completed ? 'Completed' : 'Pending',
    t.progress + '%', `"${(t.tags || []).join(', ')}"`,
    t.rescheduled || 0, t.estTime || 0
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `smart-planner-${today()}.csv`;
  a.click();
  notify('CSV exported!', 'success');
}

/** Wipe all tasks and goals */
function clearData() {
  if (!confirm('Clear ALL tasks and goals? This cannot be undone.')) return;
  state.tasks = [];
  state.goals = [];
  save();
  notify('All data cleared', 'warn');
  renderPage();
}
