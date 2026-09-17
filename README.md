# Chronos — Personal Schedule, Habit & Timetable Tracker

A high-performance, local-first schedule and habit tracking application designed in **GitHub's visual UI aesthetic**. At its core is a **GitHub-style contribution heatmap** (a year-round activity grid reflecting daily consistency), integrated with a **flexible recurrence engine**, **timetable management for college/school/work**, **milestone highlight tracking**, and **audible notification reminders**.

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, and **Dexie.js (IndexedDB)**.

---

## 🛠️ Tech Stack & Architectural Rationale

| Technology | Category | Why Chosen for Chronos |
| :--- | :--- | :--- |
| **React 19** | Core Framework | Concurrent rendering, fine-grained hooks (`useMemo`, `useCallback`), and declarative UI updates for responsive timeline interactions. |
| **TypeScript (v6)** | Type Safety | Enforces strict schemas across complex recurrence rules, single-occurrence overrides, and timetable exception structures. |
| **Vite (v8)** | Build Tooling | Instant HMR during development and optimized production bundling with low memory overhead. |
| **Tailwind CSS (v4)** | Styling | Custom utility classes matching GitHub's design scale (charcoal dark backgrounds, border radii, and accent tokens). |
| **Dexie.js (v4)** | Local Storage | High-performance IndexedDB wrapper with reactive live queries (`useLiveQuery`), enabling instant offline persistence without a backend server. |
| **date-fns (v4)** | Date Calculation | Lightweight date arithmetic for interval math, day-of-week parsing, and edge-case date shifting (e.g. short months). |
| **Lucide React** | Iconography | Clean, consistent vector icons matching GitHub's minimal Octicon design system. |
| **Canvas Confetti** | Celebrations | Smooth 60fps celebration particle effects on 100% daily goal completions. |
| **Vitest** | Unit Testing | Fast runner executing test suites for recurrence math, streak stats, and exception resolution. |

---

## 🌟 Core Features

### 1. GitHub-Style Contribution Heatmap
- **52-Week Activity Grid**: Visual grid reflecting task completions over 365 days.
- **Dynamic Intensity Levels**:
  - `Level 0`: No completed tasks
  - `Level 1`: 1% – 34% completion
  - `Level 2`: 35% – 66% completion
  - `Level 3`: 67% – 99% completion
  - `Level 4`: 100% daily completion
- **6 Accessible Palettes**: GitHub Classic Green, Cobalt Blue, Cyber Teal, Amethyst Purple, Flame Orange, and High-Contrast.
- **Milestone Markers**: Golden pin indicator on heatmap day-squares whenever an important/highlighted event is scheduled.
- **Interactive Day Inspector**: Hover for tooltip stats; click any day square to inspect all tasks, notes, and timetable periods.

### 2. Custom Recurrence & Exception Engine
- **Recurrence Patterns**:
  - `One-time`: Single target date.
  - `Daily`: Every day.
  - `Weekly Days`: Specific weekdays (e.g. Mon, Wed, Fri).
  - `Monthly`: Same day of month (e.g. 15th).
  - `Specific Dates`: Multi-select days of month (1–31) with automatic edge-case shifting for short months (e.g. Feb 28th handles 30/31).
  - `Custom Interval`: Every N days (e.g. every 2 or 3 days).
- **Single-Occurrence Overrides**:
  - **Skip Occurrence**: Skip a date without penalizing your streak or reducing completion percentage.
  - **Remove from Date**: Delete a single occurrence from a date without altering the parent recurring series.
  - **Date Notes & Overrides**: Add single-day custom titles or notes.

### 3. Timetable Schedule & Exception Integration
- **Configurable Types**: College, School, Work, or Custom shift schedules.
- **Weekly Schedule Template**: Set periods per day with room numbers, professors, and class types.
- **Date-Specific Exceptions**:
  - **Holidays**: Dismiss all periods for a specific date.
  - **Cancelled / Rescheduled Periods**: Cancel or modify specific period times/rooms without altering the regular weekly pattern.

### 4. Highlighted / Important Tasks & Milestones
- Mark exams, deadlines, and milestones with the **⭐ Important** flag.
- **Unified Visual Treatment**: Applied consistently across the Calendar View, Dashboard "Upcoming Highlights & Milestones" panel, Day Detail Modal, and Contribution Graph.

### 5. Notification & Sound System
- **Browser Push Reminders**: Configurable reminder offsets (At time, 5m, 10m, 15m, 30m, 1h before).
- **Audible Notification Chime**: Plays `/notification.mp3` when notifications fire, with a Web Audio API synthesizer fallback.
- **Settings Toggle**: Enable or disable audible chime independently of visual notifications.
- **Test Button**: "Send Test Push Notification 🔔" button previews both visual alert and audio chime.

### 6. Theme & PWA Capability
- **GitHub UI Themes**: Swappable Dark Theme (`#0d1117` charcoal) and Light Gradient Theme.
- **Standalone PWA**: Installable on desktop and mobile with offline Service Worker support.
- **JSON Backup & Restore**: One-click export and import of complete database backups.

---

## 🚫 Features Tried & Removed (Design Decisions)

| Feature Attempted | Why It Was Removed | Current Better Approach |
| :--- | :--- | :--- |
| **Google Calendar Bi-directional Sync** | Tried during early development, but removed due to Google OAuth2 client key complexity, quota limits, and race-condition sync conflicts with offline IndexedDB state. | **Local-First JSON Backup / Export**: Instant 1-click JSON backup export/import that operates 100% offline without API keys or OAuth setup. |
| **Achievement Card Image / PDF Export** | Attempted canvas-to-image rendering of streak cards, but removed due to font blurring, CSS gradient scaling bugs, and offscreen canvas particle glitching across high-DPI screens. | **Native Interactive Stats & Heatmap**: Crisp vector rendering with high-resolution canvas confetti celebrations directly in the DOM. |

---

## ⚠️ Known Platform Limitations

1. **Mobile Background Audio Restrictions**:
   - Modern mobile OS browsers (iOS WebKit and Android Chrome) enforce strict autoplay safety policies blocking background Web Audio / HTML5 Audio playback without an active user touch gesture.
   - **Behavior**: When the app is in the foreground, notification sounds play as expected. When backgrounded on mobile, visual push notifications are delivered reliably by the OS Notification Manager, but background audio chime is suppressed by mobile OS policy.
2. **Client-Side Notification Loop**:
   - Reminder scheduling is handled via a local browser Service Worker loop. No external server or third-party web push relay is required.

---

## 🚀 Setup & Execution Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Automated Unit Tests
```bash
npm run test
```

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
time_manager/
├── index.html                   # Entry HTML with Google Fonts (Plus Jakarta Sans, JetBrains Mono)
├── public/
│   ├── favicon.svg              # GitHub UI style logo mark
│   ├── notification.mp3         # Customizable notification chime audio file
│   ├── manifest.json            # PWA Web App Manifest
│   └── sw.js                    # Service Worker for push notifications & offline cache
├── src/
│   ├── components/
│   │   ├── calendar/            # Calendar Month/Week view with task pills & highlight styling
│   │   ├── college/             # Timetable schedule & exception manager
│   │   ├── dashboard/           # Dashboard view with KPI metrics & agenda
│   │   ├── heatmap/             # GitHub contribution graph & day detail modal
│   │   ├── highlights/          # Upcoming Milestones & Highlights countdown panel
│   │   ├── layout/              # Navbar with GitHub logo mark & settings modal
│   │   ├── notifications/       # Permission modals & banners
│   │   ├── stats/               # Analytics & streak statistics view
│   │   └── tasks/               # Agenda, task occurrence cards & modal editor
│   ├── context/
│   │   └── AppContext.tsx       # Global application state & Dexie live queries
│   ├── db/
│   │   └── index.ts             # Dexie IndexedDB schema definition
│   ├── services/
│   │   ├── notifications.ts     # Push notification dispatch & audio chime engine
│   │   ├── recurrence.ts        # Recurrence calculation engine & date math
│   │   ├── repository.ts        # Repository pattern interfaces for database access
│   │   └── stats.ts             # Streak calculation algorithms
│   ├── types/
│   │   └── index.ts             # TypeScript interface definitions
│   └── utils/
│     └── theme.ts              # Heatmap themes & color palettes
└── README.md                    # Project documentation
```
