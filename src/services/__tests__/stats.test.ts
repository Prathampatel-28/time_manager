import { describe, it, expect } from 'vitest';
import { calculateStreakStats } from '../stats';
import type { DayActivity } from '../../types';

describe('Streak and Progress Analytics', () => {
  const mockActivity = (
    date: string,
    scheduled: number,
    completed: number,
    skipped: number = 0
  ): DayActivity => {
    const pct = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (completed === 0 || scheduled === 0) level = 0;
    else if (pct === 100) level = 4;
    else if (pct >= 67) level = 3;
    else if (pct >= 34) level = 2;
    else level = 1;

    return {
      date,
      totalScheduled: scheduled,
      totalCompleted: completed,
      totalSkipped: skipped,
      completionPercentage: pct,
      level,
      hasHighlighted: false,
      tasks: [],
      collegePeriods: [],
      isCollegeHoliday: false,
    };
  };

  it('should accurately calculate consecutive qualifying days as current streak', () => {
    const activities: DayActivity[] = [
      mockActivity('2026-09-11', 2, 2),
      mockActivity('2026-09-12', 2, 2),
      mockActivity('2026-09-13', 3, 3),
      mockActivity('2026-09-14', 2, 2),
      mockActivity('2026-09-15', 2, 2), // today
    ];

    const stats = calculateStreakStats(activities, '2026-09-15', 'all_completed');
    expect(stats.currentStreak).toBe(5);
    expect(stats.longestStreak).toBe(5);
    expect(stats.totalCompletions).toBe(11);
    expect(stats.completionRate).toBe(100);
  });

  it('should preserve streak across neutral days (days with 0 scheduled or all skipped)', () => {
    const activities: DayActivity[] = [
      mockActivity('2026-09-10', 2, 2),
      mockActivity('2026-09-11', 2, 2),
      mockActivity('2026-09-12', 0, 0, 2), // neutral day: rest day / all skipped
      mockActivity('2026-09-13', 2, 2),
      mockActivity('2026-09-14', 2, 2),
      mockActivity('2026-09-15', 2, 2), // today
    ];

    const stats = calculateStreakStats(activities, '2026-09-15', 'all_completed');
    // Neutral day does not break streak
    expect(stats.currentStreak).toBe(5);
    expect(stats.longestStreak).toBe(5);
  });

  it('should break streak on past days where tasks were scheduled but not completed', () => {
    const activities: DayActivity[] = [
      mockActivity('2026-09-10', 2, 2),
      mockActivity('2026-09-11', 2, 2),
      mockActivity('2026-09-12', 3, 1), // missed 2 tasks!
      mockActivity('2026-09-13', 2, 2),
      mockActivity('2026-09-14', 2, 2),
      mockActivity('2026-09-15', 2, 2), // today
    ];

    const stats = calculateStreakStats(activities, '2026-09-15', 'all_completed');
    // Current streak starts after the break (Sept 13, 14, 15) -> 3 days
    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
  });

  it('should calculate a 2-day streak when tasks are completed for yesterday and today', () => {
    const activities: DayActivity[] = [
      mockActivity('2026-09-16', 1, 1), // yesterday
      mockActivity('2026-09-17', 1, 1), // today
    ];

    const stats = calculateStreakStats(activities, '2026-09-17', 'all_completed');
    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(2);
  });

  it('should qualify days where remaining non-skipped tasks are completed', () => {
    const activities: DayActivity[] = [
      mockActivity('2026-09-16', 2, 1, 1), // yesterday: 2 scheduled, 1 completed, 1 skipped
      mockActivity('2026-09-17', 2, 1, 1), // today: 2 scheduled, 1 completed, 1 skipped
    ];

    const stats = calculateStreakStats(activities, '2026-09-17', 'all_completed');
    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(2);
  });
});
