import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Star, 
  Calendar, 
  ChevronRight 
} from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { fromDateString, toDateString } from '../../services/recurrence';
import type { Task } from '../../types';

interface UpcomingHighlightsProps {
  onDayClick: (dateStr: string) => void;
  onEditTask?: (task: Task) => void;
}

export const UpcomingHighlights: React.FC<UpcomingHighlightsProps> = ({
  onDayClick,
}) => {
  const { tasks } = useApp();
  const todayStr = toDateString(new Date());
  const today = fromDateString(todayStr);

  // Find all tasks marked as isHighlighted
  const highlightedTasks = tasks.filter(t => t.isHighlighted);

  // Find upcoming occurrences for these highlighted tasks
  const upcomingList = highlightedTasks.map(task => {
    // For one-time tasks:
    const targetDateStr = task.recurrence.targetDate || task.recurrence.startDate;
    const targetDate = fromDateString(targetDateStr);
    const daysDiff = differenceInCalendarDays(targetDate, today);

    return {
      task,
      dateStr: targetDateStr,
      daysDiff,
    };
  })
  .filter(item => item.daysDiff >= -1) // today, future, or yesterday
  .sort((a, b) => a.daysDiff - b.daysDiff);

  if (upcomingList.length === 0) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-[#e3b341] fill-[#e3b341]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc]">
            Upcoming Highlights & Milestones
          </h3>
        </div>
        <p className="text-xs text-[#8b949e]">
          No highlighted exams or deadlines marked. Toggle "Mark as Important" when creating or editing a task.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#161b22] border border-[#d29922]/40 rounded-xl p-5 shadow-md relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#d29922]/5 rounded-bl-full pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-[#e3b341] fill-[#e3b341]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc]">
            Upcoming Milestones & Deadlines
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#d29922]/20 text-[#e3b341] rounded-full border border-[#d29922]/40">
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
              className="p-3.5 rounded-lg bg-[#0d1117] border border-[#d29922]/30 hover:border-[#e3b341] transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors">
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
                    <p className="text-[11px] text-[#8b949e] line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-[#8b949e] pt-1">
                    <Calendar className="w-3 h-3 text-[#58a6ff]" />
                    <span>{format(fromDateString(dateStr), 'EEE, MMM d, yyyy')}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      daysDiff <= 3
                        ? 'bg-[#f85149]/20 text-[#f85149] border border-[#f85149]/40 animate-pulse'
                        : 'bg-[#d29922]/20 text-[#e3b341] border border-[#d29922]/40'
                    }`}
                  >
                    {badgeText}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#6e7681] group-hover:text-[#f0f6fc] transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
