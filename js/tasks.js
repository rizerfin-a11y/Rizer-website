/* ============================================================
   tasks.js — Task CRUD Operations & Modal Forms
   ============================================================ */

/* ──────────────────────────────────────────────
   TASK ITEM RENDERER
────────────────────────────────────────────── */

/**
 * Render a single task as HTML.
 * @param {object} task  - Task object
 * @param {boolean} mini - If true, hide description and action buttons
 */
/**
 * Render a single task as HTML.
 */
function to24h(h, m, p) {
  let hrs = parseInt(h);
  if (p === 'PM' && hrs < 12) hrs += 12;
  if (p === 'AM' && hrs === 12) hrs = 0;
  return `${String(hrs).padStart(2, '0')}:${m}`;
}

function from24h(timeStr) {
  if (!timeStr) return { h: '12', m: '00', p: 'PM' };
  const [hrs, min] = timeStr.split(':').map(x => parseInt(x));
  const p = hrs >= 12 ? 'PM' : 'AM';
  const h = hrs % 12 || 12;
  return { h: String(h), m: String(min).padStart(2, '0'), p };
}

function renderTaskItem(task, mini = false) {
  const isOverdue = !task.completed && task.deadline && task.deadline < today();

  return `
<div class="task-item ${task.completed ? 'completed' : ''}" id="task-${task.id}">
  <div class="task-header">
    <!-- Completion checkbox -->
    <div class="task-check ${task.completed ? 'done' : ''}"
         onclick="toggleTask('${task.id}')">
      ${task.completed ? '✓' : ''}
    </div>

    <div style="flex:1">
      <div class="task-title">${escHtml(task.title)}</div>
      ${!mini && task.desc
      ? `<div style="font-size:12px;color:var(--text2);margin-top:3px">${escHtml(task.desc)}</div>`
      : ''}
    </div>

    <!-- Action buttons (full view only) -->
    ${!mini ? `
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-sm" onclick="openEditTask('${task.id}')">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="rescheduleTask('${task.id}')" title="Reschedule to next day">🔄</button>
        <button class="btn btn-danger btn-sm" onclick="deleteTask('${task.id}')">🗑️</button>
      </div>` : ''}
  </div>

  <!-- Meta row -->
  <div class="task-meta">
    ${priorityBadge(task.priority)}
    ${isOverdue ? `<span class="badge badge-overdue">Overdue</span>` : ''}
    ${task.deadline ? `<span class="task-time">📅 ${formatTimeRange(task.deadline, task.endTime)}</span>` : ''}
    ${task.estTime ? `<span class="task-time">⏱ ${task.estTime}m</span>` : ''}
    ${(task.tags || []).map(tag => `<span class="badge badge-tag">${escHtml(tag)}</span>`).join('')}
    ${task.rescheduled > 0 ? `<span style="font-size:11px;color:var(--text3)">↩️ ${task.rescheduled}×</span>` : ''}
    ${task.gcalEventId ? `<span style="font-size:11px;color:#1a73e8">📅 GCal</span>` : ''}
  </div>

  <!-- Progress bar (only if in-progress) -->
  ${task.progress > 0 && task.progress < 100 ? `
    <div class="progress-bar">
      <div class="progress-fill" style="width:${task.progress}%"></div>
    </div>` : ''}
</div>`;
}

/* ──────────────────────────────────────────────
   ADD TASK MODAL
────────────────────────────────────────────── */

function openAddTask(dateOverride) {
  const dt = dateOverride || today();
  showModal(`
<div class="modal-header">
  <div class="modal-title">✨ Add New Task</div>
  <button class="close-btn" onclick="closeModal()">×</button>
</div>

<div class="form-group">
  <label class="form-label">Title *</label>
  <input class="form-input" id="t-title" placeholder="What needs to be done?">
</div>

<div class="form-group">
  <label class="form-label">Description</label>
  <textarea class="form-textarea" id="t-desc" placeholder="More details..."></textarea>
</div>

<div class="form-row">
  <div class="form-group">
    <label class="form-label">Priority</label>
    <select class="form-select" id="t-priority">
      <option value="high">🔴 High</option>
      <option value="medium" selected>🟡 Medium</option>
      <option value="low">🟢 Low</option>
    </select>
  </div>
  <div class="form-group">
    <label class="form-label">Estimated Time (min)</label>
    <input class="form-input" id="t-time" type="number" placeholder="60">
  </div>
</div>

<div class="form-row">
  <div class="form-group">
    <label class="form-label">Task Date</label>
    <input class="form-input" id="t-date" type="date" value="${dt}">
  </div>
  <div class="form-group">
    <label class="form-label">End Date (optional)</label>
    <input class="form-input" id="t-end-date" type="date" value="${dt}">
  </div>
</div>

<div class="form-group">
  <label class="form-label">Start Time</label>
  <div style="display:flex; gap:8px;">
    <select class="form-select" id="t-start-h" style="flex:1">
      ${[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => `<option value="${h}" ${h === 12 ? 'selected' : ''}>${h}</option>`).join('')}
    </select>
    <select class="form-select" id="t-start-m" style="flex:1">
      ${['00', '15', '30', '45'].map(m => `<option value="${m}">${m}</option>`).join('')}
    </select>
    <select class="form-select" id="t-start-p" style="width:80px">
      <option value="AM">AM</option>
      <option value="PM" selected>PM</option>
    </select>
  </div>
</div>

<div class="form-group">
  <label class="form-label">End Time (optional)</label>
  <div style="display:flex; gap:8px;">
    <select class="form-select" id="t-end-h" style="flex:1">
      <option value="">None</option>
      ${[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => `<option value="${h}">${h}</option>`).join('')}
    </select>
    <select class="form-select" id="t-end-m" style="flex:1">
      ${['00', '15', '30', '45'].map(m => `<option value="${m}">${m}</option>`).join('')}
    </select>
    <select class="form-select" id="t-end-p" style="width:80px">
      <option value="AM">AM</option>
      <option value="PM" selected>PM</option>
    </select>
  </div>
</div>

<div class="form-group">
  <label class="form-label">Tags (comma separated)</label>
  <input class="form-input" id="t-tags" placeholder="work, urgent, research">
</div>

${state.gcalConnected ? `
<label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text2);margin-bottom:14px;cursor:pointer">
  <input type="checkbox" id="t-gcal" checked>
  Add to Google Calendar
</label>` : ''}

<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px">
  <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
  <button class="btn btn-primary" onclick="saveTask()">Save Task</button>
</div>`);
}

/* ──────────────────────────────────────────────
   EDIT TASK MODAL
────────────────────────────────────────────── */

function openEditTask(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;

  showModal(`
<div class="modal-header">
  <div class="modal-title">✏️ Edit Task</div>
  <button class="close-btn" onclick="closeModal()">×</button>
</div>

<div class="form-group">
  <label class="form-label">Title</label>
  <input class="form-input" id="t-title" value="${escHtml(t.title)}">
</div>

<div class="form-group">
  <label class="form-label">Description</label>
  <textarea class="form-textarea" id="t-desc">${escHtml(t.desc || '')}</textarea>
</div>

<div class="form-row">
  <div class="form-group">
    <label class="form-label">Priority</label>
    <select class="form-select" id="t-priority">
      <option value="high"   ${t.priority === 'high' ? 'selected' : ''}>🔴 High</option>
      <option value="medium" ${t.priority === 'medium' ? 'selected' : ''}>🟡 Medium</option>
      <option value="low"    ${t.priority === 'low' ? 'selected' : ''}>🟢 Low</option>
    </select>
  </div>
  <div class="form-group">
    <label class="form-label">Estimated Time (min)</label>
    <input class="form-input" id="t-time" type="number" value="${t.estTime || ''}">
  </div>
</div>

<div class="form-row">
  <div class="form-group">
    <label class="form-label">Task Date</label>
    <input class="form-input" id="t-date" type="date" value="${t.date}">
  </div>
  <div class="form-group">
    <label class="form-label">End Date</label>
    <input class="form-input" id="t-end-date" type="date" value="${t.endTime ? t.endTime.split('T')[0] : t.date}">
  </div>
</div>

<div class="form-group">
  <label class="form-label">Start Time</label>
  <div style="display:flex; gap:8px;">
    <select class="form-select" id="t-start-h" style="flex:1">
      ${[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => `<option value="${h}" ${from24h(t.deadline.split('T')[1]).h == h ? 'selected' : ''}>${h}</option>`).join('')}
    </select>
    <select class="form-select" id="t-start-m" style="flex:1">
      ${['00', '15', '30', '45'].map(m => `<option value="${m}" ${from24h(t.deadline.split('T')[1]).m == m ? 'selected' : ''}>${m}</option>`).join('')}
    </select>
    <select class="form-select" id="t-start-p" style="width:80px">
      <option value="AM" ${from24h(t.deadline.split('T')[1]).p === 'AM' ? 'selected' : ''}>AM</option>
      <option value="PM" ${from24h(t.deadline.split('T')[1]).p === 'PM' ? 'selected' : ''}>PM</option>
    </select>
  </div>
</div>

<div class="form-group">
  <label class="form-label">End Time</label>
  <div style="display:flex; gap:8px;">
    <select class="form-select" id="t-end-h" style="flex:1">
      <option value="" ${!t.endTime ? 'selected' : ''}>None</option>
      ${[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => `<option value="${h}" ${t.endTime && from24h(t.endTime.split('T')[1]).h == h ? 'selected' : ''}>${h}</option>`).join('')}
    </select>
    <select class="form-select" id="t-end-m" style="flex:1">
      ${['00', '15', '30', '45'].map(m => `<option value="${m}" ${t.endTime && from24h(t.endTime.split('T')[1]).m == m ? 'selected' : ''}>${m}</option>`).join('')}
    </select>
    <select class="form-select" id="t-end-p" style="width:80px">
      <option value="AM" ${t.endTime && from24h(t.endTime.split('T')[1]).p === 'AM' ? 'selected' : ''}>AM</option>
      <option value="PM" ${t.endTime && from24h(t.endTime.split('T')[1]).p === 'PM' ? 'selected' : ''}>PM</option>
    </select>
  </div>
</div>

<div class="form-group">
  <label class="form-label">Progress: <span id="prog-val">${t.progress || 0}</span>%</label>
  <input type="range" min="0" max="100" value="${t.progress || 0}" step="5"
         oninput="document.getElementById('prog-val').textContent = this.value"
         id="t-progress" style="width:100%;margin-top:6px">
</div>

<div class="form-group">
  <label class="form-label">Tags (comma separated)</label>
  <input class="form-input" id="t-tags" value="${(t.tags || []).join(', ')}">
</div>

<div class="form-group">
  <label class="form-label">Notes</label>
  <textarea class="form-textarea" id="t-notes">${escHtml(t.notes || '')}</textarea>
</div>

<div style="display:flex;gap:10px;justify-content:flex-end">
  <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
  <button class="btn btn-primary" onclick="saveTask('${id}')">Update Task</button>
</div>`);
}

/* ──────────────────────────────────────────────
   SAVE / UPDATE TASK
────────────────────────────────────────────── */

/** Helper to prevent guests from writing data */
function checkGuest(action = 'perform this action') {
  if (state.isGuest) {
    if (typeof handleAddTaskClick === 'function') {
      handleAddTaskClick();
    } else {
      notify('Please login to ' + action, 'warn');
    }
    return true;
  }
  return false;
}

async function saveTask(editId) {
  if (checkGuest('save tasks')) return;
  const title = (document.getElementById('t-title') || {}).value?.trim();
  if (!title) { notify('Please enter a task title', 'warn'); return; }

  const existing = editId ? state.tasks.find(t => t.id === editId) : null;

  const task = {
    id: editId || uid(),
    title,
    desc: document.getElementById('t-desc')?.value.trim() || '',
    priority: document.getElementById('t-priority')?.value || 'medium',
    estTime: parseInt(document.getElementById('t-time')?.value) || 0,
    date: document.getElementById('t-date')?.value || today(),
    deadline: `${document.getElementById('t-date')?.value || today()}T${to24h(document.getElementById('t-start-h').value, document.getElementById('t-start-m').value, document.getElementById('t-start-p').value)}`,
    endTime: document.getElementById('t-end-h').value ? `${document.getElementById('t-end-date')?.value || today()}T${to24h(document.getElementById('t-end-h').value, document.getElementById('t-end-m').value, document.getElementById('t-end-p').value)}` : '',
    tags: (document.getElementById('t-tags')?.value || '')
      .split(',').map(s => s.trim()).filter(Boolean),
    progress: editId ? (parseInt(document.getElementById('t-progress')?.value) || 0) : 0,
    notes: editId ? (document.getElementById('t-notes')?.value || '') : '',
    completed: existing ? existing.completed : false,
    rescheduled: existing ? (existing.rescheduled || 0) : 0,
    gcalEventId: existing ? (existing.gcalEventId || null) : null,
    createdAt: existing ? existing.createdAt : Date.now()
  };

  if (editId) {
    state.tasks = state.tasks.map(t => t.id === editId ? task : t);
    if (state.gcalConnected && task.gcalEventId) {
      await updateGCalEvent(task);
    }
    notify('Task updated!', 'success');
  } else {
    state.tasks.push(task);
    // Optionally sync to Google Calendar
    const gcalCb = document.getElementById('t-gcal');
    if (state.gcalConnected && gcalCb?.checked) {
      await addToGCal(task);
    }
    notify('Task added!', 'success');
  }

  save();
  closeModal();
  renderPage();
}

/* ──────────────────────────────────────────────
   TOGGLE COMPLETION
────────────────────────────────────────────── */

async function toggleTask(id) {
  if (checkGuest('complete tasks')) return;
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  task.progress = task.completed ? 100 : task.progress;
  save();

  // Sync completion status to Google Calendar
  if (state.gcalConnected && task.gcalEventId) {
    await updateGCalEvent(task);
  }

  notify(task.completed ? 'Task completed! ✅' : 'Task reopened', 'info');
  renderPage();
}

/* ──────────────────────────────────────────────
   DELETE TASK
────────────────────────────────────────────── */

async function deleteTask(id) {
  if (checkGuest('delete tasks')) return;
  const task = state.tasks.find(t => t.id === id);
  if (task && state.gcalConnected && task.gcalEventId) {
    await deleteGCalEvent(task);
  }
  state.tasks = state.tasks.filter(t => t.id !== id);
  save();
  notify('Task deleted', 'warn');
  renderPage();
}

/* ──────────────────────────────────────────────
   RESCHEDULE
────────────────────────────────────────────── */

function rescheduleTask(id) {
  if (checkGuest('reschedule tasks')) return;
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  const next = new Date(task.date + 'T00:00:00');
  next.setDate(next.getDate() + 1);
  task.date = next.toISOString().split('T')[0];
  task.rescheduled = (task.rescheduled || 0) + 1;
  save();
  notify(`Rescheduled to ${formatDate(task.date)} (${task.rescheduled}× total)`, 'info');
  renderPage();
}

/* ──────────────────────────────────────────────
   GOALS MODAL
────────────────────────────────────────────── */

function openAddGoal() {
  showModal(`
<div class="modal-header">
  <div class="modal-title">🎯 Set New Goal</div>
  <button class="close-btn" onclick="closeModal()">×</button>
</div>

<div class="form-group">
  <label class="form-label">Goal Title</label>
  <input class="form-input" id="g-title" placeholder="Complete 5 tasks per day">
</div>

<div class="form-row">
  <div class="form-group">
    <label class="form-label">Period</label>
    <select class="form-select" id="g-period">
      <option value="daily">Daily</option>
      <option value="weekly">Weekly</option>
    </select>
  </div>
  <div class="form-group">
    <label class="form-label">Target (count or %)</label>
    <input class="form-input" id="g-target" type="number" placeholder="5">
  </div>
</div>

<div style="display:flex;gap:10px;justify-content:flex-end">
  <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
  <button class="btn btn-primary" onclick="saveGoal()">Set Goal</button>
</div>`);
}

function saveGoal() {
  if (checkGuest('save goals')) return;
  const title = document.getElementById('g-title')?.value.trim();
  const target = parseInt(document.getElementById('g-target')?.value);
  const period = document.getElementById('g-period')?.value;
  if (!title || !target) { notify('Please fill all fields', 'warn'); return; }
  // Replace any existing goal for the same period
  state.goals = state.goals.filter(g => g.period !== period);
  state.goals.push({ id: uid(), title, target, period });
  save();
  closeModal();
  notify('Goal set!', 'success');
  renderPage();
}
