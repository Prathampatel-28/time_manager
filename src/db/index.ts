import Dexie, { type EntityTable } from 'dexie';
import type { 
  Task, 
  Occurrence, 
  CollegeDaySchedule, 
  CollegeException, 
  UserSettings 
} from '../types';

export class AppDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>;
  occurrences!: EntityTable<Occurrence, 'id'>;
  collegeSchedule!: EntityTable<CollegeDaySchedule, 'weekday'>;
  collegeExceptions!: EntityTable<CollegeException, 'id'>;
  userSettings!: EntityTable<UserSettings, 'id'>;

  constructor() {
    super('PersonalScheduleTrackerDB');
    this.version(1).stores({
      tasks: 'id, category, isHighlighted, createdAt',
      occurrences: 'id, taskId, date, status, [taskId+date]',
      collegeSchedule: 'weekday',
      collegeExceptions: 'id, date, type',
      userSettings: 'id',
    });
  }
}

export const db = new AppDatabase();

/**
 * Initializes database with default settings.
 * Starts in a clean, empty state without dummy/seed tasks.
 */
export async function initializeDatabase(forceReset: boolean = false): Promise<void> {
  if (forceReset) {
    await db.tasks.clear();
    await db.occurrences.clear();
    await db.collegeSchedule.clear();
    await db.collegeExceptions.clear();
    await db.userSettings.clear();
  }

  // Ensure default User Settings exist
  const existingSettings = await db.userSettings.get('default');
  if (!existingSettings) {
    await db.userSettings.put({
      id: 'default',
      theme: 'dark',
      themeMode: 'dark',
      heatmapTheme: 'github-green',
      streakCalculationMode: 'all_completed',
      startOfWeek: 1, // Monday
      collegeEnabled: true,
      timetableConfig: {
        id: 'tt-default',
        name: 'College Timetable',
        type: 'College',
        enabled: true,
      },
      notificationSettings: {
        enabled: true,
        permissionRequested: false,
        defaultOffsetMinutes: 10,
        muteCollegePeriods: false,
        mutedCategories: [],
      },
    });
  }

  // Automatic cleanup of sample/dummy seed tasks if present from earlier runs
  const sampleTaskIds = [
    'task-workout',
    'task-dsa',
    'task-reading',
    'task-project',
    'task-review',
    'task-exam',
    'task-hackathon',
  ];

  const existingTasks = await db.tasks.toArray();
  const sampleTasksFound = existingTasks.filter(t => sampleTaskIds.includes(t.id));
  if (sampleTasksFound.length > 0) {
    for (const sampleTask of sampleTasksFound) {
      await db.tasks.delete(sampleTask.id);
      // Delete associated occurrences
      const occs = await db.occurrences.where('taskId').equals(sampleTask.id).toArray();
      if (occs.length > 0) {
        await db.occurrences.bulkDelete(occs.map(o => o.id));
      }
    }
  }

  // Clean out sample college exceptions if any
  const sampleException = await db.collegeExceptions.get('exc-holiday-1');
  if (sampleException) {
    await db.collegeExceptions.delete('exc-holiday-1');
  }
}

