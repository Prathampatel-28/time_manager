import {
  format,
  differenceInCalendarDays,
  getDay,
  getDate,
  isBefore,
  isAfter,
} from 'date-fns';
import type { Task, Occurrence, OccurrenceStatus, CollegeDaySchedule, CollegeException, DayActivity } from '../types';

/**
 * Format a Date object to standard YYYY-MM-DD string in local time
 */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse standard YYYY-MM-DD string to start-of-day Date
 */
export function fromDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Checks if a task is scheduled on a specific date according to its recurrence rule
 */
export function isTaskScheduledForDate(task: Task, dateStr: string): boolean {
  const targetDate = fromDateString(dateStr);
  const startDate = fromDateString(task.recurrence.startDate);

  // Check bounds
  if (isBefore(targetDate, startDate)) {
    return false;
  }

  if (task.recurrence.endDate) {
    const endDate = fromDateString(task.recurrence.endDate);
    if (isAfter(targetDate, endDate)) {
      return false;
    }
  }

  switch (task.recurrence.type) {
    case 'none': {
      const oneTimeDate = task.recurrence.targetDate || task.recurrence.startDate;
      return oneTimeDate === dateStr;
    }

    case 'daily': {
      return true;
    }

    case 'weekly_days': {
      const dayOfWeek = getDay(targetDate); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      const days = task.recurrence.daysOfWeek ?? [];
      return days.includes(dayOfWeek);
    }

    case 'monthly': {
      const targetDayOfMonth = getDate(targetDate);
      const expectedDay = task.recurrence.dayOfMonth ?? getDate(startDate);
      return targetDayOfMonth === expectedDay;
    }

    case 'interval': {
      const interval = task.recurrence.intervalDays || 1;
      const diff = differenceInCalendarDays(targetDate, startDate);
      return diff >= 0 && diff % interval === 0;
    }

    default:
      return false;
  }
}

/**
 * Resolves the status and occurrence data for a task on a specific date
 */
export function resolveTaskOccurrence(
  task: Task,
  dateStr: string,
  occurrencesMap: Map<string, Occurrence>
): {
  isScheduled: boolean;
  status: OccurrenceStatus;
  occurrence?: Occurrence;
  effectiveTitle: string;
  isHighlighted: boolean;
} {
  const isRuleScheduled = isTaskScheduledForDate(task, dateStr);
  const occurrenceKey = `${task.id}_${dateStr}`;
  const occurrence = occurrencesMap.get(occurrenceKey);

  // If permanently or specifically removed on this date:
  if (occurrence?.status === 'removed') {
    return {
      isScheduled: false,
      status: 'removed',
      occurrence,
      effectiveTitle: occurrence.overrideTitle || task.title,
      isHighlighted: false,
    };
  }

  // If one-time task that was explicitly created for this date
  if (!isRuleScheduled && !occurrence) {
    return {
      isScheduled: false,
      status: 'pending',
      effectiveTitle: task.title,
      isHighlighted: task.isHighlighted,
    };
  }

  const status: OccurrenceStatus = occurrence ? occurrence.status : 'pending';
  const effectiveTitle = occurrence?.overrideTitle || task.title;
  const isHighlighted = occurrence?.isHighlightedOverride ?? task.isHighlighted;

  return {
    isScheduled: true,
    status,
    occurrence,
    effectiveTitle,
    isHighlighted,
  };
}

/**
 * Resolves active college periods for a given date, taking into account
 * weekly templates and date-specific exceptions (holidays, cancelled/rescheduled periods)
 */
export function resolveCollegeScheduleForDate(
  dateStr: string,
  weeklySchedules: CollegeDaySchedule[],
  exceptions: CollegeException[]
): {
  periods: CollegeException extends never ? never : any[];
  isHoliday: boolean;
  holidayNote?: string;
} {
  const date = fromDateString(dateStr);
  const weekday = getDay(date); // 0 = Sun, 1 = Mon, ...
  
  // Find exception for this date
  const dateExceptions = exceptions.filter(e => e.date === dateStr);
  const holidayException = dateExceptions.find(e => e.type === 'holiday');

  if (holidayException) {
    return {
      periods: [],
      isHoliday: true,
      holidayNote: holidayException.note || 'College Holiday',
    };
  }

  const daySchedule = weeklySchedules.find(s => s.weekday === weekday);
  if (!daySchedule || !daySchedule.isEnabled) {
    return {
      periods: [],
      isHoliday: false,
    };
  }

  // Filter and adjust periods based on exceptions
  const periods = daySchedule.periods
    .filter(period => {
      // Check if period is cancelled
      const isCancelled = dateExceptions.some(
        e => e.type === 'cancelled_period' && e.periodId === period.id
      );
      return !isCancelled;
    })
    .map(period => {
      // Check if period is rescheduled or substituted
      const reschedule = dateExceptions.find(
        e => e.type === 'rescheduled_period' && e.periodId === period.id
      );
      if (reschedule) {
        return {
          ...period,
          startTime: reschedule.newStartTime || period.startTime,
          endTime: reschedule.newEndTime || period.endTime,
          room: reschedule.newRoom || period.room,
          subject: reschedule.substituteSubject || period.subject,
        };
      }
      return period;
    });

  return {
    periods,
    isHoliday: false,
  };
}

/**
 * Computes the DayActivity object for a specific date
 */
export function computeDayActivity(
  dateStr: string,
  tasks: Task[],
  occurrencesMap: Map<string, Occurrence>,
  collegeSchedule: CollegeDaySchedule[] = [],
  collegeExceptions: CollegeException[] = [],
  includeCollegeInDailyStats: boolean = false
): DayActivity {
  let scheduledCount = 0;
  let completedCount = 0;
  let skippedCount = 0;
  let hasHighlighted = false;

  const resolvedTasks: DayActivity['tasks'] = [];

  for (const task of tasks) {
    const resolved = resolveTaskOccurrence(task, dateStr, occurrencesMap);

    // If completely removed for this date, ignore from scheduled
    if (resolved.status === 'removed' || !resolved.isScheduled) {
      continue;
    }

    if (resolved.isHighlighted) {
      hasHighlighted = true;
    }

    resolvedTasks.push({
      task,
      occurrence: resolved.occurrence,
      status: resolved.status,
    });

    // Skipped instances do NOT count against streaks / denominator!
    if (resolved.status === 'skipped') {
      skippedCount++;
    } else if (resolved.status === 'done') {
      scheduledCount++;
      completedCount++;
    } else {
      // pending
      scheduledCount++;
    }
  }

  const { periods, isHoliday } = resolveCollegeScheduleForDate(
    dateStr,
    collegeSchedule,
    collegeExceptions
  );

  // If college periods are counted as daily tasks (optional setting)
  if (includeCollegeInDailyStats && periods.length > 0 && !isHoliday) {
    // each period could count if specified
  }

  const completionPercentage = scheduledCount > 0 
    ? Math.round((completedCount / scheduledCount) * 100)
    : 0;

  let level: 0 | 1 | 2 | 3 | 4 = 0;
  if (scheduledCount === 0 || completedCount === 0) {
    level = 0;
  } else if (completionPercentage < 35) {
    level = 1;
  } else if (completionPercentage < 70) {
    level = 2;
  } else if (completionPercentage < 100) {
    level = 3;
  } else {
    level = 4; // 100% completion
  }

  return {
    date: dateStr,
    totalScheduled: scheduledCount,
    totalCompleted: completedCount,
    totalSkipped: skippedCount,
    completionPercentage,
    level,
    hasHighlighted,
    tasks: resolvedTasks,
    collegePeriods: periods,
    isCollegeHoliday: isHoliday,
  };
}
