/* ============================================================
   gcal.js — Google Calendar API Integration
   
   HOW TO SET UP:
   1. Go to https://console.cloud.google.com
   2. Create a project → Enable "Google Calendar API"
   3. Create an API Key (restrict to Google Calendar API)
   4. Paste the key in Settings inside the app
   
   WHAT IT DOES:
   - When you add a task with "Add to Google Calendar" checked,
     it creates a Calendar event on the task's date.
   - When you mark a task complete, it renames the event
     with a ✓ prefix (visual strike-through in Calendar).
   - Uses the public REST API — no OAuth required for
     primary calendar writes when using API key + CORS proxy.
   
   NOTE: For production use, switch to OAuth 2.0 so users
   can authenticate with their own Google account securely.
   ============================================================ */

/**
 * Save GCal settings and update state.
 */
function saveGCalSettings() {
  const clientId = (document.getElementById('gapi-key') || {}).value?.trim();
  const calId = (document.getElementById('gcal-id') || {}).value?.trim() || 'primary';

  if (!clientId) { notify('Please enter a Google Client ID', 'warn'); return; }

  state.gcalClientId = clientId;
  state.gcalId = calId;
  save();
  notify('Settings saved!', 'info');
  renderPage();
}

/** 
 * OAuth2 Token Flow using Google Identity Services (GIS)
 */
let tokenClient;
function initGCal() {
  if (!state.gcalClientId || typeof google === 'undefined') return;

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: state.gcalClientId,
    scope: 'https://www.googleapis.com/auth/calendar.events',
    callback: (response) => {
      if (response.access_token) {
        state.gcalToken = response.access_token;
        state.gcalConnected = true;
        state.isGuest = false; // User is now authenticated

        // Start 24hr session if not already started
        if (!state.sessionStartTime) {
          state.sessionStartTime = Date.now();
        }

        save();
        notify('Success! Welcome to Rizer ✨', 'success');

        // Close modal if open and refresh
        closeModal();

        // If they were on the landing page, enter the app
        const landing = document.getElementById('landing-page');
        if (landing && landing.style.display !== 'none') {
          enterApp(false);
        } else {
          renderPage();
        }
      }
    },
  });
}

function authorizeGCal() {
  if (!tokenClient) initGCal();
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    notify('Identity Client not ready. Check Client ID.', 'danger');
  }
}

function disconnectGCal() {
  state.gcalConnected = false;
  state.gcalToken = '';
  save();
  notify('Google Calendar disconnected', 'info');
  renderPage();
}

/**
 * Add a task as a Google Calendar event.
 */
async function addToGCal(task) {
  if (!state.gcalToken) {
    if (state.gcalClientId) notify('Click "Authorize" in settings first', 'warn');
    return;
  }

  const colorMap = { high: '11', medium: '5', low: '2' };
  const dateStr = task.deadline || task.date;
  const hasTime = dateStr.includes('T');

  const start = hasTime ? { dateTime: `${dateStr}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone } : { date: dateStr };

  // End time is user-defined OR start time + 1 hour
  let end;
  if (task.endTime && task.endTime.includes('T')) {
    end = { dateTime: `${task.endTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  } else if (hasTime) {
    const endDt = new Date(dateStr);
    endDt.setHours(endDt.getHours() + 1);
    end = { dateTime: endDt.toISOString().replace('.000Z', 'Z'), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  } else {
    end = { date: dateStr };
  }

  const body = {
    summary: task.title,
    description: `[Rizer]\n${task.desc || ''}\nPriority: ${task.priority}`,
    start,
    end,
    colorId: colorMap[task.priority] || '2'
  };

  try {
    const calId = encodeURIComponent(state.gcalId || 'primary');
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.gcalToken}`
        },
        body: JSON.stringify(body)
      }
    );
    const data = await res.json();

    if (data.id) {
      task.gcalEventId = data.id;
      save();
      notify('Added to Google Calendar ✅', 'success');
    } else if (data.error?.code === 401) {
      notify('Session expired. Please Re-authorize.', 'warn');
      state.gcalToken = '';
      save();
    } else {
      notify('GCal error: ' + (data.error?.message || 'Unknown'), 'warn');
    }
  } catch (err) {
    console.error('GCal fetch error:', err);
  }
}

/**
 * Update/Patch event
 */
async function updateGCalEvent(task) {
  if (!state.gcalToken || !task.gcalEventId) return;

  const hasTime = task.deadline?.includes('T');
  const start = hasTime ? { dateTime: `${task.deadline}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone } : { date: (task.deadline || task.date) };

  let end;
  if (task.endTime && task.endTime.includes('T')) {
    end = { dateTime: `${task.endTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  } else if (hasTime) {
    const endDt = new Date(task.deadline);
    endDt.setHours(endDt.getHours() + 1);
    end = { dateTime: endDt.toISOString().replace('.000Z', 'Z'), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  } else {
    end = { date: (task.deadline || task.date) };
  }

  const patch = {
    summary: task.completed ? `✓ ${task.title}` : task.title,
    status: task.completed ? 'cancelled' : 'confirmed',
    start,
    end
  };

  try {
    const calId = encodeURIComponent(state.gcalId || 'primary');
    const eventId = encodeURIComponent(task.gcalEventId);
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.gcalToken}`
        },
        body: JSON.stringify(patch)
      }
    );
  } catch (err) {
    console.warn('GCal update failed:', err.message);
  }
}

async function deleteGCalEvent(task) {
  if (!state.gcalToken || !task.gcalEventId) return;

  try {
    const calId = encodeURIComponent(state.gcalId || 'primary');
    const eventId = encodeURIComponent(task.gcalEventId);
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${state.gcalToken}` }
      }
    );
  } catch (err) {
    console.warn('GCal delete failed:', err.message);
  }
}

/**
 * Sync all untracked tasks.
 */
async function syncAllToGCal() {
  if (!state.gcalToken) {
    notify('Please Authorize in Settings first', 'warn');
    return;
  }

  const unsynced = state.tasks.filter(t => !t.gcalEventId);
  if (unsynced.length === 0) {
    notify('All tasks are already synced!', 'info');
    return;
  }

  notify(`Syncing ${unsynced.length} tasks...`, 'info');

  let successCount = 0;
  for (const task of unsynced) {
    await new Promise(r => setTimeout(r, 200));
    try {
      await addToGCal(task);
      if (task.gcalEventId) successCount++;
    } catch (e) {
      console.error('Sync failed for:', task.title, e);
    }
  }

  notify(`Complete! ${successCount} tasks added to GCal.`, 'success');
  renderPage();
}
