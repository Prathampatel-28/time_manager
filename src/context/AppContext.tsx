import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import confetti from 'canvas-confetti';
import { 
  db, 
  initializeDatabase 
} from '../db';
import {
  taskRepository,
  occurrenceRepository,
  collegeRepository,
  settingsRepository,
} from '../services/repository';
import type { 
  Task, 
  Occurrence, 
  OccurrenceStatus, 
  CollegeDaySchedule, 
  CollegeException, 
  UserSettings, 
  DayActivity, 
  StreakStats 
} from '../types';
import { toDateString, computeDayActivity } from '../services/recurrence';
import { calculateStreakStats, calculateTaskStreak } from '../services/stats';
import { subDays, addDays, eachDayOfInterval } from 'date-fns';
import { 
  registerServiceWorker, 
  checkAndTriggerReminders, 
  sendTestNotification 
} from '../services/notifications';

interface AppContextType {
  tasks: Task[];
  occurrences: Occurrence[];
  collegeSchedule: CollegeDaySchedule[];
  collegeExceptions: CollegeException[];
  settings: UserSettings;
  isLoading: boolean;

  // Navigation & View
  activeView: 'dashboard' | 'agenda' | 'calendar' | 'college' | 'tasks' | 'stats';
  setActiveView: (view: 'dashboard' | 'agenda' | 'calendar' | 'college' | 'tasks' | 'stats') => void;
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  selectedTaskForDetail: Task | null;
  setSelectedTaskForDetail: (task: Task | null) => void;

  // Heatmap Filtering
  heatmapFilter: {
    type: 'all' | 'category' | 'task';
    value: string; // category name or task ID
  };
  setHeatmapFilter: (filter: { type: 'all' | 'category' | 'task'; value: string }) => void;

  // Computed Activity & Streaks
  activities: DayActivity[];
  streakStats: StreakStats;
  todayActivity: DayActivity | undefined;

  // Actions
  toggleTaskDone: (taskId: string, date: string) => Promise<void>;
  skipTaskForDate: (taskId: string, date: string, notes?: string) => Promise<void>;
  removeTaskForDate: (taskId: string, date: string) => Promise<void>;
  resetTaskOccurrence: (taskId: string, date: string) => Promise<void>;
  saveTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  saveOccurrence: (occurrence: Occurrence) => Promise<void>;
  saveCollegeSchedule: (schedule: CollegeDaySchedule) => Promise<void>;
  saveCollegeException: (exception: CollegeException) => Promise<void>;
  deleteCollegeException: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  triggerTestNotification: () => Promise<boolean>;
  resetToDemoData: () => Promise<void>;
  exportDataJSON: () => Promise<string>;
  importDataJSON: (jsonString: string) => Promise<boolean>;
}

const getInitialThemeMode = (): UserSettings['theme'] => {
  try {
    const saved = localStorage.getItem('chronos_theme_mode');
    if (saved === 'light' || saved === 'light-gradient') return 'light-gradient';
    if (saved === 'dark') return 'dark';
  } catch (e) {}
  return 'dark';
};

const initialTheme = getInitialThemeMode();

const defaultSettings: UserSettings = {
  id: 'default',
  theme: initialTheme,
  themeMode: initialTheme,
  heatmapTheme: 'github-green',
  streakCalculationMode: 'all_completed',
  startOfWeek: 1,
  collegeEnabled: true,
  notificationSettings: {
    enabled: true,
    permissionRequested: false,
    defaultOffsetMinutes: 10,
    muteCollegePeriods: false,
    mutedCategories: [],
  },
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'agenda' | 'calendar' | 'college' | 'tasks' | 'stats'>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateString(new Date()));
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [heatmapFilter, setHeatmapFilter] = useState<{ type: 'all' | 'category' | 'task'; value: string }>({
    type: 'all',
    value: 'all',
  });

  // Initialize DB with seed & Service Worker on mount
  useEffect(() => {
    initializeDatabase().then(() => {
      setIsDbReady(true);
    }).catch(err => {
      console.error('Failed to initialize database', err);
      setIsDbReady(true);
    });
    registerServiceWorker();
  }, []);

  // Live queries from Dexie
  const tasks = useLiveQuery(() => db.tasks.toArray(), [], []) ?? [];
  const occurrences = useLiveQuery(() => db.occurrences.toArray(), [], []) ?? [];
  const collegeSchedule = useLiveQuery(() => db.collegeSchedule.toArray(), [], []) ?? [];
  const collegeExceptions = useLiveQuery(() => db.collegeExceptions.toArray(), [], []) ?? [];
  const dbSettings = useLiveQuery(() => db.userSettings.get('default'), [], defaultSettings);
  const settings = dbSettings || defaultSettings;

  // Apply theme class strictly to document element and sync localStorage
  useEffect(() => {
    const mode = settings.themeMode || settings.theme;
    const isLight = mode === 'light' || mode === 'light-gradient';
    const isDark = !isLight;
    
    try {
      localStorage.setItem('chronos_theme_mode', mode);
    } catch (e) {}

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('theme-light-gradient', 'theme-light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('theme-light-gradient');
    }
  }, [settings.themeMode, settings.theme]);

  // Fast occurrence map lookup: taskId_YYYY-MM-DD -> Occurrence
  const occurrencesMap = useMemo(() => {
    const map = new Map<string, Occurrence>();
    for (const occ of occurrences) {
      map.set(`${occ.taskId}_${occ.date}`, occ);
    }
    return map;
  }, [occurrences]);

  // Date range for history & upcoming: past 365 days + next 30 days
  const todayStr = useMemo(() => toDateString(new Date()), []);
  
  const activities = useMemo(() => {
    const now = new Date();
    const startDate = subDays(now, 365);
    const endDate = addDays(now, 30);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Filter tasks based on active heatmap filter
    let relevantTasks = tasks;
    if (heatmapFilter.type === 'category' && heatmapFilter.value !== 'all') {
      relevantTasks = tasks.filter(t => t.category === heatmapFilter.value);
    } else if (heatmapFilter.type === 'task' && heatmapFilter.value !== 'all') {
      relevantTasks = tasks.filter(t => t.id === heatmapFilter.value);
    }

    return days.map(day => {
      const dStr = toDateString(day);
      return computeDayActivity(
        dStr,
        relevantTasks,
        occurrencesMap,
        collegeSchedule,
        collegeExceptions
      );
    });
  }, [tasks, occurrencesMap, collegeSchedule, collegeExceptions, heatmapFilter]);

  // Streak Stats
  const streakStats = useMemo(() => {
    if (heatmapFilter.type === 'task' && heatmapFilter.value !== 'all') {
      const targetTask = tasks.find(t => t.id === heatmapFilter.value);
      if (targetTask) {
        return calculateTaskStreak(targetTask, activities, todayStr);
      }
    }
    return calculateStreakStats(activities, todayStr, settings.streakCalculationMode);
  }, [activities, todayStr, settings.streakCalculationMode, heatmapFilter, tasks]);

  // Today's Activity
  const todayActivity = useMemo(() => {
    return activities.find(a => a.date === todayStr);
  }, [activities, todayStr]);

  // Fire celebratory confetti
  const triggerCelebration = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#238636', '#2ea043', '#39d353', '#7ee787', '#58a6ff'],
    });
  }, []);

  // Action: Toggle Task Done
  const toggleTaskDone = useCallback(async (taskId: string, date: string) => {
    const key = `${taskId}_${date}`;
    const current = occurrencesMap.get(key);
    const newStatus: OccurrenceStatus = current?.status === 'done' ? 'pending' : 'done';

    await occurrenceRepository.setStatus(taskId, date, newStatus);

    // If marked done and all other tasks for this date are done, trigger celebration!
    if (newStatus === 'done' && date === todayStr) {
      const currentDay = activities.find(a => a.date === date);
      if (currentDay && currentDay.totalCompleted + 1 >= currentDay.totalScheduled) {
        triggerCelebration();
      }
    }
  }, [occurrencesMap, todayStr, activities, triggerCelebration]);

  // Action: Skip Task for a single date (preserves streak!)
  const skipTaskForDate = useCallback(async (taskId: string, date: string, notes?: string) => {
    await occurrenceRepository.setStatus(taskId, date, 'skipped', notes);
  }, []);

  // Action: Remove Task from this single date only
  const removeTaskForDate = useCallback(async (taskId: string, date: string) => {
    await occurrenceRepository.removeForDate(taskId, date);
  }, []);

  // Action: Reset Occurrence (clear skip/remove/done back to pending)
  const resetTaskOccurrence = useCallback(async (taskId: string, date: string) => {
    await occurrenceRepository.setStatus(taskId, date, 'pending');
  }, []);

  // Action: Save Task
  const saveTask = useCallback(async (task: Task) => {
    await taskRepository.save(task);
  }, []);

  // Action: Delete Task
  const deleteTask = useCallback(async (taskId: string) => {
    await taskRepository.delete(taskId);
  }, []);

  // Action: Save Occurrence
  const saveOccurrence = useCallback(async (occurrence: Occurrence) => {
    await occurrenceRepository.setOccurrence(occurrence);
  }, []);

  // College Timetable Actions
  const saveCollegeSchedule = useCallback(async (schedule: CollegeDaySchedule) => {
    await collegeRepository.saveDaySchedule(schedule);
  }, []);

  const saveCollegeException = useCallback(async (exception: CollegeException) => {
    await collegeRepository.saveException(exception);
  }, []);

  const deleteCollegeException = useCallback(async (id: string) => {
    await collegeRepository.deleteException(id);
  }, []);

  // Action: Update Settings
  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    const nextMode = newSettings.themeMode || newSettings.theme;
    if (nextMode) {
      try {
        localStorage.setItem('chronos_theme_mode', nextMode);
      } catch (e) {}
    }
    await settingsRepository.update(newSettings);
  }, []);

  // Action: Reset to Sample Demo Data
  const resetToDemoData = useCallback(async () => {
    await initializeDatabase(true);
  }, []);

  // Action: Export Data as JSON backup
  const exportDataJSON = useCallback(async () => {
    const allTasks = await db.tasks.toArray();
    const allOccurrences = await db.occurrences.toArray();
    const allSchedule = await db.collegeSchedule.toArray();
    const allExceptions = await db.collegeExceptions.toArray();
    const userSettings = await db.userSettings.get('default');

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks: allTasks,
      occurrences: allOccurrences,
      collegeSchedule: allSchedule,
      collegeExceptions: allExceptions,
      settings: userSettings,
    };

    return JSON.stringify(backup, null, 2);
  }, []);

  // Action: Import Data from JSON backup
  const importDataJSON = useCallback(async (jsonString: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.tasks || !Array.isArray(data.tasks)) {
        throw new Error('Invalid backup format');
      }

      await db.tasks.clear();
      await db.occurrences.clear();
      await db.collegeSchedule.clear();
      await db.collegeExceptions.clear();

      await db.tasks.bulkPut(data.tasks);
      if (data.occurrences?.length) await db.occurrences.bulkPut(data.occurrences);
      if (data.collegeSchedule?.length) await db.collegeSchedule.bulkPut(data.collegeSchedule);
      if (data.collegeExceptions?.length) await db.collegeExceptions.bulkPut(data.collegeExceptions);
      if (data.settings) await db.userSettings.put(data.settings);

      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  }, []);

  // Background notification check timer
  useEffect(() => {
    checkAndTriggerReminders(todayActivity, settings.notificationSettings);
    const interval = setInterval(() => {
      checkAndTriggerReminders(todayActivity, settings.notificationSettings);
    }, 25000); // Check every 25 seconds
    return () => clearInterval(interval);
  }, [todayActivity, settings.notificationSettings]);

  // Action: Trigger Test Notification
  const triggerTestNotification = useCallback(async () => {
    return await sendTestNotification();
  }, []);

  return (
    <AppContext.Provider
      value={{
        tasks,
        occurrences,
        collegeSchedule,
        collegeExceptions,
        settings,
        isLoading: !isDbReady,

        activeView,
        setActiveView,
        selectedDate,
        setSelectedDate,
        selectedTaskForDetail,
        setSelectedTaskForDetail,

        heatmapFilter,
        setHeatmapFilter,

        activities,
        streakStats,
        todayActivity,

        toggleTaskDone,
        skipTaskForDate,
        removeTaskForDate,
        resetTaskOccurrence,
        saveTask,
        deleteTask,
        saveOccurrence,
        saveCollegeSchedule,
        saveCollegeException,
        deleteCollegeException,
        updateSettings,
        triggerTestNotification,
        resetToDemoData,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
