import { describe, it, expect } from 'vitest';
import { 
  isTaskScheduledForDate, 
  isTaskActionableForDate,
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

  it('should accurately evaluate specific month dates (e.g. 5, 15, 24)', () => {
    const customDatesTask: Task = {
      ...baseTask,
      id: 'custom-dates-task',
      recurrence: {
        type: 'monthly_dates',
        daysOfMonth: [5, 15, 24],
        startDate: '2026-09-01',
      },
    };

    expect(isTaskScheduledForDate(customDatesTask, '2026-09-05')).toBe(true);
    expect(isTaskScheduledForDate(customDatesTask, '2026-09-15')).toBe(true);
    expect(isTaskScheduledForDate(customDatesTask, '2026-09-24')).toBe(true);
    expect(isTaskScheduledForDate(customDatesTask, '2026-09-10')).toBe(false);
  });

  it('should shift dates exceeding month length to the last day of shorter months', () => {
    const endOfMonthTask: Task = {
      ...baseTask,
      id: 'end-of-month-task',
      recurrence: {
        type: 'monthly_dates',
        daysOfMonth: [30, 31],
        startDate: '2026-01-01',
      },
    };

    // February 2026 (28 days): 28th should trigger for day 30 and 31
    expect(isTaskScheduledForDate(endOfMonthTask, '2026-02-28')).toBe(true);
    expect(isTaskScheduledForDate(endOfMonthTask, '2026-02-27')).toBe(false);

    // April 2026 (30 days): 30th triggers for day 30 (exact) and day 31 (clamped)
    expect(isTaskScheduledForDate(endOfMonthTask, '2026-04-30')).toBe(true);
    expect(isTaskScheduledForDate(endOfMonthTask, '2026-04-29')).toBe(false);
  });

  it('should enforce time-based actionability correctly', () => {
    const timedTask: Task = {
      ...baseTask,
      startTime: '14:30',
    };

    // Simulated "now" at 12:00 PM on 2026-09-15
    const at12pm = new Date(2026, 8, 15, 12, 0);
    // Simulated "now" at 15:00 PM on 2026-09-15
    const at3pm = new Date(2026, 8, 15, 15, 0);

    // On 2026-09-15 before 14:30 -> false
    expect(isTaskActionableForDate(timedTask, '2026-09-15', at12pm)).toBe(false);
    // On 2026-09-15 after 14:30 -> true
    expect(isTaskActionableForDate(timedTask, '2026-09-15', at3pm)).toBe(true);

    // Past date -> always true
    expect(isTaskActionableForDate(timedTask, '2026-09-14', at12pm)).toBe(true);
    // Future date -> always false
    expect(isTaskActionableForDate(timedTask, '2026-09-16', at12pm)).toBe(false);
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

  it('should include skipped occurrence in totalScheduled for accurate completion rate', () => {
    const occurrencesMap = new Map<string, Occurrence>();
    occurrencesMap.set('task-read_2026-09-15', {
      id: 'task-read_2026-09-15',
      taskId: 'task-read',
      date: '2026-09-15',
      status: 'skipped',
      notes: 'Sick day',
    });

    const activity = computeDayActivity('2026-09-15', [task], occurrencesMap);

    // Skipped tasks count in totalScheduled so completion is 0/1 (0%)
    expect(activity.totalScheduled).toBe(1);
    expect(activity.totalSkipped).toBe(1);
    expect(activity.totalCompleted).toBe(0);
    expect(activity.completionPercentage).toBe(0);
  });

  it('should compute 50% completion when 1 task is done and 1 task is skipped', () => {
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

    // Total scheduled is 2 (1 done, 1 skipped)
    expect(activity.totalScheduled).toBe(2);
    expect(activity.totalCompleted).toBe(1);
    expect(activity.totalSkipped).toBe(1);
    // Completion percentage is 50% and level is 2
    expect(activity.completionPercentage).toBe(50);
    expect(activity.level).toBe(2);
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

describe('Weekly & Important Task Recurrence', () => {
  const weeklyImportantTask: Task = {
    id: 'weekly-important-task',
    title: 'Weekly Systems Review',
    category: 'Work',
    color: '#f59e0b',
    isHighlighted: true,
    recurrence: {
      type: 'weekly_days',
      daysOfWeek: [1, 3], // Mon, Wed
      startDate: '2026-09-01',
    },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  const dailyImportantTask: Task = {
    id: 'daily-important-task',
    title: 'Daily High Impact Target',
    category: 'Personal',
    color: '#ef4444',
    isHighlighted: true,
    recurrence: {
      type: 'daily',
      startDate: '2026-09-01',
    },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  const customDatesImportantTask: Task = {
    id: 'custom-important-task',
    title: 'Midterm Milestone',
    category: 'Study',
    color: '#8b5cf6',
    isHighlighted: true,
    recurrence: {
      type: 'monthly_dates',
      daysOfMonth: [5, 20],
      startDate: '2026-09-01',
    },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  it('should correctly schedule Weekly Important task on every scheduled date', () => {
    // 2026-09-14 is Monday
    expect(isTaskScheduledForDate(weeklyImportantTask, '2026-09-14')).toBe(true);
    // 2026-09-16 is Wednesday
    expect(isTaskScheduledForDate(weeklyImportantTask, '2026-09-16')).toBe(true);
    // 2026-09-21 is Monday (second week occurrence)
    expect(isTaskScheduledForDate(weeklyImportantTask, '2026-09-21')).toBe(true);
    // 2026-09-15 is Tuesday -> false
    expect(isTaskScheduledForDate(weeklyImportantTask, '2026-09-15')).toBe(false);
  });

  it('should set hasHighlighted = true in DayActivity for Daily, Weekly, and Custom Dates important tasks', () => {
    const occMap = new Map<string, Occurrence>();

    // Monday 2026-09-14 has Weekly important task
    const monAct = computeDayActivity('2026-09-14', [weeklyImportantTask], occMap);
    expect(monAct.hasHighlighted).toBe(true);
    expect(monAct.totalScheduled).toBe(1);

    // Tuesday 2026-09-15 has Daily important task
    const tueAct = computeDayActivity('2026-09-15', [dailyImportantTask], occMap);
    expect(tueAct.hasHighlighted).toBe(true);
    expect(tueAct.totalScheduled).toBe(1);

    // 2026-09-20 has Custom Dates important task
    const customAct = computeDayActivity('2026-09-20', [customDatesImportantTask], occMap);
    expect(customAct.hasHighlighted).toBe(true);
    expect(customAct.totalScheduled).toBe(1);
  });

  it('should handle recurrence type "weekly" and empty daysOfWeek fallback', () => {
    const legacyWeeklyTask: Task = {
      ...weeklyImportantTask,
      recurrence: {
        type: 'weekly' as any,
        startDate: '2026-09-03', // Thursday
      },
    };

    // Thursday 2026-09-03 -> true (fallback to weekday of startDate)
    expect(isTaskScheduledForDate(legacyWeeklyTask, '2026-09-03')).toBe(true);
    // Thursday 2026-09-10 -> true
    expect(isTaskScheduledForDate(legacyWeeklyTask, '2026-09-10')).toBe(true);
    // Friday 2026-09-04 -> false
    expect(isTaskScheduledForDate(legacyWeeklyTask, '2026-09-04')).toBe(false);
  });
});
