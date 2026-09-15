# Chronos — Personal Schedule & Progress Tracker

A high-performance, local-first schedule and habit/task tracking web application. The core visual identity is a **GitHub-style contribution graph** (a year-round grid of colored squares reflecting activity and consistency over time) integrated with a **recurrence exception engine**, a **college timetable schedule**, and **milestone highlight tracking**.

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, and **Dexie.js (IndexedDB)**.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Automated Tests
```bash
npm run test
```

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 🌟 Core Features

### 1. GitHub-Style Contribution Heatmap
- **Full Year Activity Grid**: Displays 52 weeks of day-squares styled like GitHub's contribution graph.
- **Dynamic Intensity Levels**:
  - `Level 0`: No activity / no completed tasks
  - `Level 1`: 1% – 34% completion
  - `Level 2`: 35% – 66% completion
  - `Level 3`: 67% – 99% completion
  - `Level 4`: 100% completion of all scheduled tasks on that day
- **Filters**: View aggregate daily completion or filter down to a specific category (Health, Coding, Study, College) or an individual task.
- **6 Accessible Heatmap Palettes**:
  - GitHub Classic (Green)
  - Cobalt Blue
  - Cyber Teal
  - Amethyst Purple
  - Flame Orange
  - Accessible High-Contrast Emerald
- **Interactive Day Inspector**: Hover for quick stats; click any square to open the Day Detail Modal with full task checkboxes, occurrence notes, and college classes.
- **Streak Tracker**: Current streak, longest streak, total completions, and total active days.

### 2. Custom Tasks & Recurrence Engine
- **One-time Tasks**: Tied to a specific date.
- **Recurring Schedules**:
  - Daily
  - Specific Weekdays (e.g. Mon, Wed, Fri)
  - Interval (Every N days)
  - Monthly (Day of month)
- **Single-Occurrence Removal & Skipping**:
  - **Skip Occurrence**: Skip a single day without deleting the recurring series. **Skipping does not penalize streaks or reduce completion percentages** (it is excluded from the denominator).
  - **Remove from Day**: Remove an occurrence from that day only.
  - **Occurrence Overrides**: Add single-day notes, custom titles, or time overrides without breaking future recurrences.
- **Sub-tasks Checklist**: Partial completion checklist within any task.

### 3. College Timetable Integration
- **Weekly Schedule Template**: Configure Monday through Saturday with periods (start/end times, room numbers, professors, lecture/lab types).
- **Unequal Days**: Supports variable schedules (e.g., Monday 4 periods, Wednesday research/free day, Saturday half-day).
- **Date-Specific Exceptions**:
  - Mark dates as **College Holidays** (automatically cancels all classes for that date).
  - Cancel specific periods on a date (e.g., professor on leave).
  - Reschedule or substitute periods on a specific date.
  - Never affects the base recurring weekly template.

### 4. Highlight & Pin Important Events
- Mark exams, deadlines, hackathons, and milestones as **Highlighted / Important**.
- Highlighted events display:
  - Glowing gold star and badge in lists and calendars.
  - A distinct **golden indicator dot** on the GitHub heatmap day square.
  - Automatic listing on the **Upcoming Milestones** countdown panel ("In 5 days", "Tomorrow").

### 5. Views
1. **Dashboard**: Main view with Heatmap, streak KPI cards, Today's Quick Agenda, Upcoming Highlights, and College overview.
2. **Today / Agenda**: Dedicated daily checklist with date navigation, subtask checkboxes, occurrence skip buttons, and daily progress bar.
3. **Calendar**: Interactive Month and Week views showing tasks, class counts, and heatmap intensity strips.
4. **College Timetable**: Dedicated weekly template editor and holiday/exception management.
5. **All Tasks & Analytics**: Manage all tasks and inspect individual task heatmaps and streak history.

### 6. Local-First & Swappable Storage
- Powered by **Dexie.js (IndexedDB)** — zero server required, 100% offline capable.
- Wrapped with a clean repository pattern (`ITaskRepository`, `IOccurrenceRepository`, `ICollegeRepository`, `ISettingsRepository`) for easy migration to SQLite (Tauri/Electron) or remote sync (Supabase/Firebase).
- **JSON Backup & Restore**: Export and import full database backups with one click.
- **Realistic Seed Data**: Automatically pre-populated with 80+ days of realistic habits, college classes, upcoming exams, and active streaks on first launch.

---

## 🛠️ Tech Stack
- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS v4 (GitHub Dark theme default + Light mode toggle)
- **Local Storage**: Dexie.js (IndexedDB) with `dexie-react-hooks`
- **Date Math**: `date-fns`
- **Icons**: `lucide-react`
- **Celebrations**: `canvas-confetti`
- **Tests**: Vitest
