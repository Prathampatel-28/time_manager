import { subDays } from 'date-fns';
import type { Task, StreakStats, DayActivity } from '../types';
import { toDateString, fromDateString } from './recurrence';

/**
 * Calculates current streak, longest streak, total completions, and overall completion rate.
 * Neutral days (days where totalScheduled === 0, or all tasks were skipped/removed)
 * do not break the streak.
 */
export function calculateStreakStats(
  activities: DayActivity[],
  todayStr: string,
  mode: 'all_completed' | 'at_least_one' = 'all_completed'
): StreakStats {
  if (!activities || activities.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      totalActiveDays: 0,
      completionRate: 0,
    };
  }

  // Sort activities by date ascending
  const sorted = [...activities].sort((a, b) => a.date.localeCompare(b.date));

  let totalCompletions = 0;
  let totalScheduledAll = 0;
  let totalActiveDays = 0;

  for (const day of sorted) {
    totalCompletions += day.totalCompleted;
    totalScheduledAll += day.totalScheduled;
    if (day.totalCompleted > 0) {
      totalActiveDays++;
    }
  }

  const completionRate = totalScheduledAll > 0 
    ? Math.round((totalCompletions / totalScheduledAll) * 100) 
    : 0;

  // Determine qualification per day
  const isQualifying = (day: DayActivity): boolean => {
    if (day.totalScheduled === 0) return false;
    if (mode === 'all_completed') {
      return day.totalCompleted >= day.totalScheduled;
    } else {
      return day.totalCompleted > 0;
    }
  };

  const isNeutral = (day: DayActivity): boolean => {
    return day.totalScheduled === 0;
  };

  // Find longest streak across entire history
  let longestStreak = 0;
  let tempStreak = 0;

  for (const day of sorted) {
    // We only calculate historical streaks up to today
    if (day.date > todayStr) break;

    if (isQualifying(day)) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else if (isNeutral(day)) {
      // Neutral day (no tasks scheduled or all skipped) preserves streak without incrementing
      continue;
    } else {
      // Failed/missed day resets streak
      tempStreak = 0;
    }
  }

  // Calculate current streak walking backwards from today
  const dayMap = new Map<string, DayActivity>();
  sorted.forEach(a => dayMap.set(a.date, a));

  let currentStreak = 0;
  const today = fromDateString(todayStr);
  const todayActivity = dayMap.get(todayStr);

  let checkDate = today;

  // If today is completed, count it and start backwards from yesterday
  if (todayActivity && isQualifying(todayActivity)) {
    currentStreak++;
    checkDate = subDays(today, 1);
  } else if (todayActivity && isNeutral(todayActivity)) {
    // Today has nothing due, start checking backwards from yesterday
    checkDate = subDays(today, 1);
  } else {
    // Today has pending tasks not yet completed, but since today is still in progress,
    // we evaluate from yesterday backwards
    checkDate = subDays(today, 1);
  }

  // Walk backwards from checkDate
  while (true) {
    const dStr = toDateString(checkDate);
    const act = dayMap.get(dStr);

    if (!act) {
      // Reached boundary of recorded history
      break;
    }

    if (isQualifying(act)) {
      currentStreak++;
    } else if (isNeutral(act)) {
      // Neutral day does not break streak
    } else {
      // A day in the past with scheduled tasks that were not completed breaks the streak
      break;
    }

    checkDate = subDays(checkDate, 1);
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    totalActiveDays,
    completionRate,
  };
}

/**
 * Calculates streak and stats for a single specific task over time
 */
export function calculateTaskStreak(
  task: Task,
  activities: DayActivity[],
  todayStr: string
): StreakStats {
  const taskActivities = activities.map(act => {
    const item = act.tasks.find(t => t.task.id === task.id);
    if (!item || item.status === 'removed' || item.status === 'skipped') {
      return {
        ...act,
        totalScheduled: 0,
        totalCompleted: 0,
        totalSkipped: item?.status === 'skipped' ? 1 : 0,
        completionPercentage: 0,
        level: 0 as const,
      };
    }
    const isDone = item.status === 'done';
    return {
      ...act,
      totalScheduled: 1,
      totalCompleted: isDone ? 1 : 0,
      totalSkipped: 0,
      completionPercentage: isDone ? 100 : 0,
      level: (isDone ? 4 : 0) as 0 | 4,
    };
  });

  return calculateStreakStats(taskActivities, todayStr, 'all_completed');
}
