# 📊 Smart Productivity Planner

A full-featured productivity web app with Google Calendar sync, analytics, streak tracking, and more — all stored locally in your browser.

---

## 📁 Folder Structure

```
smart-productivity-planner/
├── index.html          ← Main HTML shell
├── css/
│   └── style.css       ← All styles (dark/light mode, responsive)
├── js/
│   ├── state.js        ← App state + localStorage persistence
│   ├── helpers.js      ← Utility functions, export, notifications
│   ├── gcal.js         ← Google Calendar API integration
│   ├── tasks.js        ← Task CRUD + modal forms
│   ├── pages.js        ← All page renderers (dashboard, calendar…)
│   ├── charts.js       ← Chart.js chart renderers
│   └── app.js          ← App entry point (init)
└── README.md
```

---

## 🚀 Quick Start

### Option A — Open directly (no server needed)
1. Download / unzip the folder
2. Double-click `index.html` to open in your browser
3. Everything works offline — data saves to `localStorage`

### Option B — Local development server
```bash
# Using Python
python3 -m http.server 8080

# Using Node.js (npx)
npx serve .

# Then open: http://localhost:8080
```

---

## 🗓️ Google Calendar Integration

### Setup Steps
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services → Library**
4. Search for **Google Calendar API** and enable it
5. Go to **APIs & Services → Credentials**
6. Click **Create Credentials → API Key**
7. (Recommended) Restrict the key to **Google Calendar API** only
8. Copy the key

### Connect in the App
1. Open the app → click **Settings** (⚙️) in the sidebar
2. Paste your API Key in the **Google API Key** field
3. Leave Calendar ID as `primary` (or enter a specific calendar ID)
4. Click **Save & Connect**

### How Sync Works
| Action in App | Effect in Google Calendar |
|---|---|
| Add task with "Add to GCal" checked | Creates an event on the task date |
| Mark task complete | Event title gets ✓ prefix + status → cancelled (grey) |
| Delete task | Event is deleted from GCal |

> **Note:** For production use, switch from API Key to OAuth 2.0 so users can authenticate with their own Google accounts securely.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Smart Planner** | Add tasks with title, desc, priority, time estimate, deadline, tags |
| **Task Tracking** | Mark complete, update progress %, add notes |
| **Reschedule System** | Move tasks to next day, track reschedule frequency |
| **Calendar View** | Monthly calendar, click any date to plan or view tasks |
| **Analytics Dashboard** | 14-day trend, planned vs completed, priority pie, heatmap |
| **Lag Detection** | Highlights overdue patterns, mid-week drops, frequent delays |
| **Goal Tracking** | Set daily/weekly goals, track achievement percentage |
| **Timeline History** | 30-day history of what was planned vs completed |
| **Streak Tracking** | Consecutive days with ≥50% completion |
| **Dark/Light Mode** | Toggle with button in top-right |
| **Export CSV** | Download all tasks as a CSV file |
| **Persistent Storage** | All data saved in localStorage (survives browser close) |
| **Google Calendar Sync** | Two-way sync via Google Calendar REST API |

---

## 🔧 Customisation

- **Change accent colour:** Edit `--accent` in `css/style.css`
- **Adjust streak threshold:** Edit the `>= 50` check in `helpers.js → calcStreak()`
- **Add more chart types:** Add renderers in `charts.js` and call them from `postRenderAnalytics()`
- **Connect a backend:** Replace `localStorage.setItem/getItem` in `state.js` with `fetch()` calls to your API

---

## 🌐 Deployment

### Vercel (recommended)
```bash
npm i -g vercel
cd smart-productivity-planner
vercel
```

### Netlify
Drag the entire folder onto [app.netlify.com/drop](https://app.netlify.com/drop)

### GitHub Pages
1. Push the folder to a GitHub repo
2. Settings → Pages → Source: `main` branch, `/ (root)`
3. Your app will be live at `https://<username>.github.io/<repo>`

---

## 📦 Dependencies (CDN — no install needed)

| Library | Version | Purpose |
|---|---|---|
| Chart.js | 4.4.1 | All charts (line, bar, doughnut) |
| DM Sans | Google Fonts | UI typography |
| Space Mono | Google Fonts | Numbers / mono display |

No npm, no bundler, no build step required.

---

## 🔒 Security Notes

- **Never commit your API key** to a public git repository
- Restrict your Google API Key to the Google Calendar API only
- For multi-user deployment, implement a backend with OAuth 2.0
- The app stores all data in the browser — no server-side data at rest

---

## 📄 License
MIT — free to use, modify, and distribute.
