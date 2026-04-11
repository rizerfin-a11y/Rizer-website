/* ============================================================
   charts.js — Chart.js Renderers
   Called after page HTML is inserted into the DOM.
   ============================================================ */

/** Render the heatmap grid into a given container element */
function renderHeatmap(elId, days) {
  const el = document.getElementById(elId);
  if (!el) return;

  const past   = getPastDates(days);
  const colors = ['var(--bg4)', '#ef444430', '#f59e0b40', '#6366f140', '#10b98150'];

  el.innerHTML = past.map(d => {
    const tasks     = state.tasks.filter(t => t.date === d);
    const rate      = completionRate(tasks);
    const intensity = tasks.length === 0 ? 0
                    : rate === 0         ? 1
                    : rate < 50          ? 2
                    : rate < 80          ? 3
                    :                      4;
    return `<div class="hm-cell"
                 style="background:${colors[intensity]}"
                 title="${d}: ${tasks.length} tasks, ${rate}% done"></div>`;
  }).join('');
}

/** Dashboard — weekly planned vs completed bar chart */
function renderWeekChart() {
  const ctx = document.getElementById('weekChart');
  if (!ctx) return;

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const week     = getPastDates(7);
  const labels   = week.map(d => dayNames[new Date(d + 'T00:00:00').getDay()]);
  const planned  = week.map(d => state.tasks.filter(t => t.date === d).length);
  const done     = week.map(d => state.tasks.filter(t => t.date === d && t.completed).length);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Planned',   data: planned, backgroundColor: '#6366f140', borderColor: '#6366f1', borderWidth: 1.5, borderRadius: 4 },
        { label: 'Completed', data: done,    backgroundColor: '#10b98140', borderColor: '#10b981', borderWidth: 1.5, borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#ffffff08' }, ticks: { color: '#9898a8', font: { size: 11 } } },
        y: { grid: { color: '#ffffff08' }, ticks: { color: '#9898a8', font: { size: 11 }, stepSize: 1 } }
      }
    }
  });
}

/** Dashboard — priority distribution doughnut */
function renderPieChart() {
  const ctx = document.getElementById('pieChart');
  if (!ctx) return;

  const high = state.tasks.filter(t => t.priority === 'high').length;
  const med  = state.tasks.filter(t => t.priority === 'medium').length;
  const low  = state.tasks.filter(t => t.priority === 'low').length;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [`High (${high})`, `Medium (${med})`, `Low (${low})`],
      datasets: [{
        data: [high, med, low],
        backgroundColor: ['#ef444445', '#f59e0b45', '#10b98145'],
        borderColor:     ['#ef4444',   '#f59e0b',   '#10b981'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#9898a8', font: { size: 11 }, padding: 12, boxWidth: 10 } }
      }
    }
  });
}

/** Analytics — 14-day trend line chart */
function renderTrendChart() {
  const ctx   = document.getElementById('trendChart');
  if (!ctx) return;

  const past14 = getPastDates(14);
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: past14.map(d => d.substr(5)),
      datasets: [{
        label: 'Completion %',
        data:  past14.map(d => completionRate(state.tasks.filter(t => t.date === d))),
        borderColor:     '#6366f1',
        backgroundColor: '#6366f115',
        tension: .4,
        fill:    true,
        pointBackgroundColor: '#6366f1',
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#9898a8', font: { size: 10 }, maxRotation: 45, autoSkip: false } },
        y: { min: 0, max: 100, ticks: { color: '#9898a8', callback: v => v + '%' } }
      }
    }
  });
}

/** Analytics — 7-day planned vs completed bar chart */
function renderPvCChart() {
  const ctx  = document.getElementById('pvcChart');
  if (!ctx) return;

  const past7    = getPastDates(7);
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: past7.map(d => dayNames[new Date(d + 'T00:00:00').getDay()]),
      datasets: [
        { label: 'Planned',   data: past7.map(d => state.tasks.filter(t => t.date === d).length),                    backgroundColor: '#6366f140', borderColor: '#6366f1', borderWidth: 1.5, borderRadius: 4 },
        { label: 'Completed', data: past7.map(d => state.tasks.filter(t => t.date === d && t.completed).length), backgroundColor: '#10b98140', borderColor: '#10b981', borderWidth: 1.5, borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#9898a8', font: { size: 11 }, padding: 10, boxWidth: 10 } } },
      scales: {
        x: { ticks: { color: '#9898a8' } },
        y: { ticks: { color: '#9898a8', stepSize: 1 } }
      }
    }
  });
}

/** Analytics — priority doughnut */
function renderPriorityChart() {
  const ctx = document.getElementById('priChart');
  if (!ctx) return;

  const h = state.tasks.filter(t => t.priority === 'high').length;
  const m = state.tasks.filter(t => t.priority === 'medium').length;
  const l = state.tasks.filter(t => t.priority === 'low').length;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [`High (${h})`, `Medium (${m})`, `Low (${l})`],
      datasets: [{
        data: [h, m, l],
        backgroundColor: ['#ef444445', '#f59e0b45', '#10b98145'],
        borderColor:     ['#ef4444',   '#f59e0b',   '#10b981'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#9898a8', font: { size: 11 }, padding: 12, boxWidth: 10 } }
      }
    }
  });
}

/** Called after dashboard HTML is inserted */
function postRenderDashboard() {
  renderHeatmap('heatmap-mini', 28);
  renderWeekChart();
  renderPieChart();
}

/** Called after analytics HTML is inserted */
function postRenderAnalytics() {
  renderHeatmap('heatmap-full', 28);
  renderTrendChart();
  renderPvCChart();
  renderPriorityChart();
}
