/* ============================================================
   app.js — Application Entry Point & Global UI Actions
   ============================================================ */

/** Toggle dark / light theme */
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.body.classList.toggle('light', state.theme === 'light');
  save();
}

/** Toggle in-app notification setting */
function toggleNotif(enabled) {
  state.notifEnabled = enabled;
  save();
}

/** Update the topbar date and streak badge */
function updateTopbar() {
  const now = new Date();
  document.getElementById('top-date').textContent =
    now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const streak = calcStreak();
  document.getElementById('top-streak').textContent = `🔥 ${streak} day streak`;
  document.getElementById('sidebar-streak').textContent = streak;
}

/** Bootstrap the entire application */
function init() {
  // 1. Load persisted data (or seed sample data)
  load();

  // 2. Apply saved theme
  if (state.theme === 'light') document.body.classList.add('light');

  // 3. Update topbar info
  updateTopbar();

  // 4. Close modal when clicking the overlay background
  document.getElementById('modal').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });

  // 5. Render the current page
  renderPage();

  // 6. Fire overdue notification after a short delay (if enabled)
  if (state.notifEnabled) {
    setTimeout(() => {
      const overdue = overdueTasks();
      if (overdue.length > 0) {
        notify(
          `⚠️ You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}!`,
          'warn'
        );
      }
    }, 2500);
  }
}

// Start the app once the DOM is ready
document.addEventListener('DOMContentLoaded', init);
