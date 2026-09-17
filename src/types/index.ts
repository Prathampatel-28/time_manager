export type RecurrenceType = 
  | 'none'          // One-time task on a specific date
  | 'daily'         // Every day
  | 'weekly_days'   // Specific weekdays (e.g. Mon, Wed, Fri)
  | 'monthly'       // Same day every month (e.g. 15th)
  | 'monthly_dates' // Specific day-of-month numbers (e.g. 5, 15, 24)
  | 'interval';     // Every N days

export interface RecurrenceRule {
  type: RecurrenceType;
  // For 'none', the specific target date (YYYY-MM-DD)
  targetDate?: string;
  // For 'weekly_days': array of weekday indices (0 = Sunday, 1 = Monday, ... 6 = Saturday)
  daysOfWeek?: number[];
  // For 'interval': every N days (e.g. 2 = every other day)
  intervalDays?: number;
  // For 'monthly': day of month (1-31)
  dayOfMonth?: number;
  // For 'monthly_dates': array of day-of-month numbers (1-31)
  daysOfMonth?: number[];
  // Effective boundary dates
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD (optional)
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted?: boolean;
}

export type TaskCategory = 
  | 'College'
  | 'Study'
  | 'Coding'
  | 'Health'
  | 'Habit'
  | 'Personal'
  | 'Work'
  | string;

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  color: string;
  icon?: string;
  recurrence: RecurrenceRule;
  isHighlighted: boolean; // Important / Pinned (exam, deadline, milestone)
  subtasks?: SubTask[];
  startTime?: string; // "HH:MM", e.g. "09:30"
  endTime?: string;   // "HH:MM", e.g. "10:30"
  reminderOffsetMinutes?: number; // e.g. 0, 5, 10, 15, 30, 60
  createdAt: string;
  updatedAt: string;
}

export type OccurrenceStatus = 'pending' | 'done' | 'skipped' | 'removed';

export interface Occurrence {
  id: string; // typically `${taskId}_${date}`
  taskId: string;
  date: string; // YYYY-MM-DD
  status: OccurrenceStatus;
  completedAt?: string;
  notes?: string;
  timeSlot?: string; // e.g. "09:00 - 10:00"
  overrideTitle?: string;
  isHighlightedOverride?: boolean;
  completedSubtaskIds?: string[];
}

export interface CollegePeriod {
  id: string;
  subject: string;
  code?: string;
  startTime: string; // "HH:MM", e.g. "09:00"
  endTime: string;   // "HH:MM", e.g. "10:00"
  room?: string;
  professor?: string;
  color?: string;
  type?: 'Lecture' | 'Lab' | 'Tutorial' | 'Seminar';
}

export interface CollegeDaySchedule {
  weekday: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  isEnabled: boolean;
  periods: CollegePeriod[];
}

export type CollegeExceptionType = 
  | 'holiday'              // Entire day is off
  | 'cancelled_period'    // Specific period is cancelled on this date
  | 'rescheduled_period'  // Period moved or room/prof substituted
  | 'note';                // Special event / exam notice

export interface CollegeException {
  id: string;
  date: string; // YYYY-MM-DD
  type: CollegeExceptionType;
  periodId?: string; // If affecting a specific period
  note?: string;
  newStartTime?: string;
  newEndTime?: string;
  newRoom?: string;
  substituteSubject?: string;
}

export type HeatmapTheme = 
  | 'github-green'
  | 'cobalt-blue'
  | 'cyber-teal'
  | 'amethyst-purple'
  | 'flame-orange'
  | 'high-contrast';

export interface DayActivity {
  date: string; // YYYY-MM-DD
  totalScheduled: number;
  totalCompleted: number;
  totalSkipped: number;
  completionPercentage: number; // 0 to 100
  level: 0 | 1 | 2 | 3 | 4;
  hasHighlighted: boolean;
  tasks: Array<{
    task: Task;
    occurrence?: Occurrence;
    status: OccurrenceStatus;
  }>;
  collegePeriods: CollegePeriod[];
  isCollegeHoliday: boolean;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  totalActiveDays: number;
  completionRate: number; // overall percentage
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled?: boolean; // Audible notification chime (notification.mp3)
  permissionRequested: boolean;
  defaultOffsetMinutes: number; // default 10
  muteCollegePeriods: boolean;
  mutedCategories: string[]; // e.g. ['Habit', 'College']
}

export type ThemeMode = 'dark' | 'light' | 'light-gradient';

export type TimetableType = 'College' | 'School' | 'Work' | 'Custom';

export interface TimetableConfig {
  id: string;
  name: string; // e.g. "College Timetable", "Work Shift Schedule", "School Classes"
  type: TimetableType;
  enabled: boolean;
  color?: string;
}

export interface UserSettings {
  id: string;
  theme: 'dark' | 'light' | 'light-gradient';
  themeMode?: ThemeMode;
  heatmapTheme: HeatmapTheme;
  streakCalculationMode: 'all_completed' | 'at_least_one';
  startOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  collegeEnabled: boolean;
  timetableConfig?: TimetableConfig;
  notificationSettings?: NotificationSettings;
}
