import { db } from '../db';
import type { 
  Task, 
  Occurrence, 
  OccurrenceStatus, 
  CollegeDaySchedule, 
  CollegeException, 
  UserSettings 
} from '../types';

export interface ITaskRepository {
  getAll(): Promise<Task[]>;
  getById(id: string): Promise<Task | undefined>;
  save(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IOccurrenceRepository {
  getByDateRange(startDate: string, endDate: string): Promise<Occurrence[]>;
  getById(id: string): Promise<Occurrence | undefined>;
  getByTaskAndDate(taskId: string, date: string): Promise<Occurrence | undefined>;
  setOccurrence(occurrence: Occurrence): Promise<void>;
  setStatus(taskId: string, date: string, status: OccurrenceStatus, notes?: string): Promise<Occurrence>;
  removeForDate(taskId: string, date: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ICollegeRepository {
  getSchedule(): Promise<CollegeDaySchedule[]>;
  saveDaySchedule(schedule: CollegeDaySchedule): Promise<void>;
  getExceptions(): Promise<CollegeException[]>;
  saveException(exception: CollegeException): Promise<void>;
  deleteException(id: string): Promise<void>;
}

export interface ISettingsRepository {
  get(): Promise<UserSettings>;
  update(settings: Partial<UserSettings>): Promise<void>;
}

export const taskRepository: ITaskRepository = {
  async getAll() {
    return db.tasks.toArray();
  },
  async getById(id: string) {
    return db.tasks.get(id);
  },
  async save(task: Task) {
    await db.tasks.put(task);
  },
  async delete(id: string) {
    await db.tasks.delete(id);
    // Also delete any occurrences for this task
    await db.occurrences.where('taskId').equals(id).delete();
  },
};

export const occurrenceRepository: IOccurrenceRepository = {
  async getByDateRange(startDate: string, endDate: string) {
    return db.occurrences
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  },
  async getById(id: string) {
    return db.occurrences.get(id);
  },
  async getByTaskAndDate(taskId: string, date: string) {
    const id = `${taskId}_${date}`;
    return db.occurrences.get(id);
  },
  async setOccurrence(occurrence: Occurrence) {
    await db.occurrences.put(occurrence);
  },
  async setStatus(taskId: string, date: string, status: OccurrenceStatus, notes?: string) {
    const id = `${taskId}_${date}`;
    const existing = await db.occurrences.get(id);
    const updated: Occurrence = {
      id,
      taskId,
      date,
      status,
      completedAt: status === 'done' ? (existing?.completedAt || new Date().toISOString()) : undefined,
      notes: notes !== undefined ? notes : existing?.notes,
      timeSlot: existing?.timeSlot,
      overrideTitle: existing?.overrideTitle,
      isHighlightedOverride: existing?.isHighlightedOverride,
      completedSubtaskIds: existing?.completedSubtaskIds,
    };
    await db.occurrences.put(updated);
    return updated;
  },
  async removeForDate(taskId: string, date: string) {
    const id = `${taskId}_${date}`;
    const existing = await db.occurrences.get(id);
    const updated: Occurrence = {
      ...(existing || { id, taskId, date }),
      status: 'removed',
    };
    await db.occurrences.put(updated);
  },
  async delete(id: string) {
    await db.occurrences.delete(id);
  },
};

export const collegeRepository: ICollegeRepository = {
  async getSchedule() {
    return db.collegeSchedule.toArray();
  },
  async saveDaySchedule(schedule: CollegeDaySchedule) {
    await db.collegeSchedule.put(schedule);
  },
  async getExceptions() {
    return db.collegeExceptions.toArray();
  },
  async saveException(exception: CollegeException) {
    await db.collegeExceptions.put(exception);
  },
  async deleteException(id: string) {
    await db.collegeExceptions.delete(id);
  },
};

export const settingsRepository: ISettingsRepository = {
  async get() {
    const settings = await db.userSettings.get('default');
    if (!settings) {
      const defaultSettings: UserSettings = {
        id: 'default',
        theme: 'dark',
        heatmapTheme: 'github-green',
        streakCalculationMode: 'all_completed',
        startOfWeek: 1,
        collegeEnabled: true,
      };
      await db.userSettings.put(defaultSettings);
      return defaultSettings;
    }
    return settings;
  },
  async update(settings: Partial<UserSettings>) {
    const current = await this.get();
    await db.userSettings.put({
      ...current,
      ...settings,
    });
  },
};
