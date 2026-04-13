/* ============================================================
   app.js — Application Entry Point & Global UI Actions
   ============================================================ */

/** Toggle theme - Disabled, only white/light theme allowed */
function toggleTheme() {
  notify('Rizer is optimized for a premium light experience ✨', 'info');
}

/** Toggle in-app notification setting */
function toggleNotif(enabled) {
  state.notifEnabled = enabled;
  save();
}

/** Update the topbar date and streak badge */
function updateTopbar() {
  const now = new Date();
  const dateEl = document.getElementById('top-date');
  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  const streak = calcStreak();
  const topStreak = document.getElementById('top-streak');
  const sideStreak = document.getElementById('sidebar-streak');
  if (topStreak) topStreak.textContent = `🔥 ${streak} day streak`;
  if (sideStreak) sideStreak.textContent = streak;
}

/** Bootstrap the entire application */
function init() {
  // 1. Load persisted data
  load();

  // 2. Apply white tone consistently
  document.body.classList.add('light');

  // 3. Check for expired session for free users
  if (typeof checkSession === 'function') {
    checkSession();
  }

  // 4. Update topbar info
  updateTopbar();

  // 5. Close modal when clicking the overlay background
  const modal = document.getElementById('modal');
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });
  }

  // 6. Render the current page
  renderPage();

  // 7. Fire overdue notification after a short delay (if enabled)
  if (state.notifEnabled && !state.isGuest) {
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
