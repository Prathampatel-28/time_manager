import { describe, it, expect } from 'vitest';
import { 
  isTaskScheduledForDate, 
  resolveTaskOccurrence, 
  computeDayActivity, 
  resolveCollegeScheduleForDate 
} from '../recurrence';
import type { Task, Occurrence, CollegeDaySchedule, CollegeException } from '../../types';

describe('Recurrence Engine', () => {
  const baseTask: Task = {
    id: 'test-task-1',
    title: 'Daily Exercise',
    category: 'Health',
    color: '#10b981',
    isHighlighted: false,
    recurrence: {
      type: 'daily',
      startDate: '2026-09-01',
    },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  it('should accurately evaluate daily recurrence', () => {
    expect(isTaskScheduledForDate(baseTask, '2026-09-15')).toBe(true);
    // Before start date should be false
    expect(isTaskScheduledForDate(baseTask, '2026-08-31')).toBe(false);
  });

  it('should accurately evaluate specific weekdays (Mon, Wed, Fri)', () => {
    const mwfTask: Task = {
      ...baseTask,
      id: 'mwf-task',
      recurrence: {
        type: 'weekly_days',
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        startDate: '2026-09-01',
      },
    };

    // 2026-09-14 is Monday (1) -> true
    expect(isTaskScheduledForDate(mwfTask, '2026-09-14')).toBe(true);
    // 2026-09-15 is Tuesday (2) -> false
    expect(isTaskScheduledForDate(mwfTask, '2026-09-15')).toBe(false);
    // 2026-09-16 is Wednesday (3) -> true
    expect(isTaskScheduledForDate(mwfTask, '2026-09-16')).toBe(true);
  });

  it('should accurately evaluate one-time tasks', () => {
    const oneTimeTask: Task = {
      ...baseTask,
      recurrence: {
        type: 'none',
        targetDate: '2026-09-20',
        startDate: '2026-09-20',
      },
    };

    expect(isTaskScheduledForDate(oneTimeTask, '2026-09-20')).toBe(true);
    expect(isTaskScheduledForDate(oneTimeTask, '2026-09-21')).toBe(false);
  });

  it('should respect endDate boundaries', () => {
    const boundedTask: Task = {
      ...baseTask,
      recurrence: {
        type: 'daily',
        startDate: '2026-09-01',
        endDate: '2026-09-10',
      },
    };

    expect(isTaskScheduledForDate(boundedTask, '2026-09-05')).toBe(true);
    expect(isTaskScheduledForDate(boundedTask, '2026-09-10')).toBe(true);
    expect(isTaskScheduledForDate(boundedTask, '2026-09-11')).toBe(false);
  });
});

describe('Single Occurrence Removal and Skipping', () => {
  const task: Task = {
    id: 'task-read',
    title: 'Read Book',
    category: 'Habit',
    color: '#3b82f6',
    isHighlighted: false,
    recurrence: {
      type: 'daily',
      startDate: '2026-09-01',
    },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  it('should exclude single occurrence removed from that specific date', () => {
    const occurrencesMap = new Map<string, Occurrence>();
    occurrencesMap.set('task-read_2026-09-15', {
      id: 'task-read_2026-09-15',
      taskId: 'task-read',
      date: '2026-09-15',
      status: 'removed',
    });

    // For 2026-09-15, it is removed
    const resolvedRemoved = resolveTaskOccurrence(task, '2026-09-15', occurrencesMap);
    expect(resolvedRemoved.status).toBe('removed');
    expect(resolvedRemoved.isScheduled).toBe(false);

    // For other days, it remains scheduled
    const resolvedOtherDay = resolveTaskOccurrence(task, '2026-09-16', occurrencesMap);
    expect(resolvedOtherDay.status).toBe('pending');
    expect(resolvedOtherDay.isScheduled).toBe(true);
  });

  it('should not penalize streak or completion percentage when an occurrence is skipped', () => {
    const occurrencesMap = new Map<string, Occurrence>();
    occurrencesMap.set('task-read_2026-09-15', {
      id: 'task-read_2026-09-15',
      taskId: 'task-read',
      date: '2026-09-15',
      status: 'skipped',
      notes: 'Sick day',
    });

    const activity = computeDayActivity('2026-09-15', [task], occurrencesMap);

    // Skipped tasks are excluded from totalScheduled so denominator is 0
    expect(activity.totalScheduled).toBe(0);
    expect(activity.totalSkipped).toBe(1);
    expect(activity.completionPercentage).toBe(0);
  });

  it('should compute 100% completion when all non-skipped tasks are done', () => {
    const task2: Task = {
      id: 'task-code',
      title: 'Coding',
      category: 'Coding',
      color: '#6366f1',
      isHighlighted: false,
      recurrence: { type: 'daily', startDate: '2026-09-01' },
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };

    const occurrencesMap = new Map<string, Occurrence>();
    // task is skipped
    occurrencesMap.set('task-read_2026-09-15', {
      id: 'task-read_2026-09-15',
      taskId: 'task-read',
      date: '2026-09-15',
      status: 'skipped',
    });
    // task2 is done
    occurrencesMap.set('task-code_2026-09-15', {
      id: 'task-code_2026-09-15',
      taskId: 'task-code',
      date: '2026-09-15',
      status: 'done',
    });

    const activity = computeDayActivity('2026-09-15', [task, task2], occurrencesMap);

    // Total scheduled is 1 (only task2 counts, task is skipped)
    expect(activity.totalScheduled).toBe(1);
    expect(activity.totalCompleted).toBe(1);
    expect(activity.totalSkipped).toBe(1);
    // Completion percentage is 100% and level is 4!
    expect(activity.completionPercentage).toBe(100);
    expect(activity.level).toBe(4);
  });
});

describe('College Timetable Exceptions', () => {
  const schedule: CollegeDaySchedule[] = [
    {
      weekday: 1, // Monday
      isEnabled: true,
      periods: [
        { id: 'p1', subject: 'OS', startTime: '09:00', endTime: '10:00' },
        { id: 'p2', subject: 'DBMS', startTime: '10:15', endTime: '11:15' },
      ],
    },
  ];

  it('should dismiss all periods when date is marked as holiday', () => {
    const exceptions: CollegeException[] = [
      { id: 'exc-1', date: '2026-09-14', type: 'holiday', note: 'Public Holiday' },
    ];

    const result = resolveCollegeScheduleForDate('2026-09-14', schedule, exceptions);
    expect(result.isHoliday).toBe(true);
    expect(result.periods.length).toBe(0);
  });

  it('should exclude cancelled period for date without altering weekly template', () => {
    const exceptions: CollegeException[] = [
      { id: 'exc-2', date: '2026-09-14', type: 'cancelled_period', periodId: 'p1' },
    ];

    const result = resolveCollegeScheduleForDate('2026-09-14', schedule, exceptions);
    expect(result.isHoliday).toBe(false);
    expect(result.periods.length).toBe(1);
    expect(result.periods[0].id).toBe('p2');
  });
});
