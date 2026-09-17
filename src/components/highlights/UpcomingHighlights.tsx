import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Star, 
  Calendar, 
  ChevronRight 
} from 'lucide-react';
import { format, differenceInCalendarDays, addDays } from 'date-fns';
import { fromDateString, toDateString, resolveTaskOccurrence } from '../../services/recurrence';
import type { Task, Occurrence } from '../../types';

interface UpcomingHighlightsProps {
  onDayClick: (dateStr: string) => void;
  onEditTask?: (task: Task) => void;
}

export const UpcomingHighlights: React.FC<UpcomingHighlightsProps> = ({
  onDayClick,
}) => {
  const { tasks, occurrences } = useApp();
  const todayStr = useMemo(() => toDateString(new Date()), []);
  const today = useMemo(() => fromDateString(todayStr), [todayStr]);

  const occurrencesMap = useMemo(() => {
    const map = new Map<string, Occurrence>();
    for (const occ of occurrences) {
      map.set(`${occ.taskId}_${occ.date}`, occ);
    }
    return map;
  }, [occurrences]);

  // Find all tasks marked as isHighlighted
  const highlightedTasks = useMemo(() => tasks.filter(t => t.isHighlighted), [tasks]);

  // Find upcoming occurrences for all highlighted tasks regardless of recurrence type
  const upcomingList = useMemo(() => {
    const result: Array<{
      task: Task;
      dateStr: string;
      daysDiff: number;
    }> = [];

    for (const task of highlightedTasks) {
      if (task.recurrence.type === 'none') {
        const targetDateStr = task.recurrence.targetDate || task.recurrence.startDate;
        const targetDate = fromDateString(targetDateStr);
        const daysDiff = differenceInCalendarDays(targetDate, today);
        if (daysDiff >= -1) {
          result.push({ task, dateStr: targetDateStr, daysDiff });
        }
      } else {
        // For recurring tasks (daily, weekly, monthly, interval), scan upcoming 60 days
        // to find the next scheduled occurrence on or after yesterday
        let foundCount = 0;
        for (let i = -1; i <= 60; i++) {
          const testDate = addDays(today, i);
          const testDateStr = toDateString(testDate);
          
          const resolved = resolveTaskOccurrence(task, testDateStr, occurrencesMap);
          if (resolved.isScheduled && resolved.status !== 'removed') {
            result.push({
              task,
              dateStr: testDateStr,
              daysDiff: i,
            });
            foundCount++;
            if (foundCount >= 1) break; // Collect next upcoming occurrence for this task
          }
        }
      }
    }

    return result.sort((a, b) => a.daysDiff - b.daysDiff);
  }, [highlightedTasks, today, occurrencesMap]);

  if (upcomingList.length === 0) {
    return (
      <div className="gradient-card bg-white dark:bg-[#161b22] border border-slate-300 dark:border-[#30363d] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#f0f6fc]">
            Upcoming Highlights & Milestones
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-[#8b949e]">
          No highlighted exams or deadlines marked. Toggle "Mark as Important" when creating or editing a task.
        </p>
      </div>
    );
  }

  return (
    <div className="gradient-card bg-white dark:bg-[#161b22] border border-amber-400/40 dark:border-[#d29922]/40 rounded-xl p-5 shadow-md relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#f0f6fc]">
            Upcoming Milestones & Deadlines
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 dark:bg-[#d29922]/20 text-amber-700 dark:text-[#e3b341] rounded-full border border-amber-500/30 dark:border-[#d29922]/40">
          {upcomingList.length} Pinned
        </span>
      </div>

      <div className="space-y-3">
        {upcomingList.map(({ task, dateStr, daysDiff }) => {
          let badgeText = '';
          if (daysDiff === 0) badgeText = 'Today!';
          else if (daysDiff === 1) badgeText = 'Tomorrow';
          else if (daysDiff > 1) badgeText = `In ${daysDiff} days`;
          else badgeText = 'Yesterday';

          return (
            <div
              key={task.id}
              onClick={() => onDayClick(dateStr)}
              className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-amber-300 dark:border-[#d29922]/30 hover:border-amber-500 dark:hover:border-[#e3b341] transition-all cursor-pointer group shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-[#f0f6fc] group-hover:text-teal-600 dark:group-hover:text-[#58a6ff] transition-colors">
                      {task.title}
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${task.color}20`,
                        color: task.color,
                      }}
                    >
                      {task.category}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-[11px] text-slate-600 dark:text-[#8b949e] line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-[#8b949e] pt-1">
                    <Calendar className="w-3 h-3 text-teal-600 dark:text-[#58a6ff]" />
                    <span>{format(fromDateString(dateStr), 'EEE, MMM d, yyyy')}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      daysDiff <= 3
                        ? 'bg-rose-500/10 text-rose-600 dark:text-[#f85149] border border-rose-500/30 animate-pulse'
                        : 'bg-amber-500/10 dark:bg-[#d29922]/20 text-amber-700 dark:text-[#e3b341] border border-amber-500/30'
                    }`}
                  >
                    {badgeText}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-[#6e7681] group-hover:text-slate-900 dark:group-hover:text-[#f0f6fc] transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
