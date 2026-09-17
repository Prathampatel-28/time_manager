import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addWeeks, 
  subWeeks 
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  GraduationCap 
} from 'lucide-react';
import { toDateString, computeDayActivity } from '../../services/recurrence';
import { getHeatmapCellColor } from '../../utils/theme';

interface CalendarViewProps {
  onDayClick: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onDayClick }) => {
  const { tasks, occurrences, collegeSchedule, collegeExceptions, activities, settings } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const mode = settings.themeMode || settings.theme;
  const isLight = mode === 'light' || mode === 'light-gradient';

  // Occurrences map for fallback calculation if needed
  const occurrencesMap = React.useMemo(() => {
    const map = new Map<string, any>();
    for (const occ of occurrences) {
      map.set(`${occ.taskId}_${occ.date}`, occ);
    }
    return map;
  }, [occurrences]);

  // Fast map for precalculated activities
  const activityMap = React.useMemo(() => new Map(activities.map(a => [a.date, a])), [activities]);

  // Month navigation
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => subMonths(prev, 1));
    } else {
      setCurrentDate(prev => subWeeks(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else {
      setCurrentDate(prev => addWeeks(prev, 1));
    }
  };

  const handleToday = () => setCurrentDate(new Date());

  // Compute days for current view
  const days = React.useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, viewMode]);

  const weekHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="gradient-card border border-slate-300 dark:border-[#30363d] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 dark:text-[#f0f6fc]">
            {format(currentDate, 'MMMM yyyy')}
          </h1>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 text-slate-500 dark:text-[#8b949e] hover:text-slate-900 dark:hover:text-[#f0f6fc] hover:bg-slate-100 dark:hover:bg-[#21262d] rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-200 dark:bg-[#21262d] hover:bg-slate-300 dark:hover:bg-[#30363d] text-slate-800 dark:text-[#c9d1d9] rounded transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 text-slate-500 dark:text-[#8b949e] hover:text-slate-900 dark:hover:text-[#f0f6fc] hover:bg-slate-100 dark:hover:bg-[#21262d] rounded transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher: Month / Week */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0d1117] p-1 rounded-lg border border-slate-200 dark:border-[#30363d] text-xs">
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-white dark:bg-[#21262d] text-slate-900 dark:text-[#f0f6fc] shadow-sm font-bold'
                : 'text-slate-600 dark:text-[#8b949e] hover:text-slate-900 dark:hover:text-[#c9d1d9]'
            }`}
          >
            Month View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-white dark:bg-[#21262d] text-slate-900 dark:text-[#f0f6fc] shadow-sm font-bold'
                : 'text-slate-600 dark:text-[#8b949e] hover:text-slate-900 dark:hover:text-[#c9d1d9]'
            }`}
          >
            Week View
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="gradient-card border border-slate-300 dark:border-[#30363d] rounded-xl overflow-hidden shadow-lg">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-[#30363d] bg-slate-50 dark:bg-[#0d1117]">
          {weekHeaders.map(day => (
            <div
              key={day}
              className="py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-[#8b949e] uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className={`grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-[#30363d] ${viewMode === 'week' ? 'min-h-[400px]' : ''}`}>
          {days.map(day => {
            const dStr = toDateString(day);
            const act = activityMap.get(dStr) || computeDayActivity(dStr, tasks, occurrencesMap, collegeSchedule, collegeExceptions);
            const isCurrMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);

            const level = act ? act.level : 0;
            const levelColor = getHeatmapCellColor(level, settings.heatmapTheme, isLight);

            // Sort tasks so highlighted ones appear first
            const sortedTasks = act?.tasks ? [...act.tasks].sort((a, b) => {
              const aHigh = a.task.isHighlighted || a.occurrence?.isHighlightedOverride;
              const bHigh = b.task.isHighlighted || b.occurrence?.isHighlightedOverride;
              if (aHigh && !bHigh) return -1;
              if (!aHigh && bHigh) return 1;
              return 0;
            }) : [];

            return (
              <div
                key={dStr}
                onClick={() => onDayClick(dStr)}
                className={`min-h-[105px] p-2 flex flex-col justify-between cursor-pointer transition-colors relative ${
                  !isCurrMonth && viewMode === 'month'
                    ? 'bg-slate-100/60 dark:bg-[#0d1117]/60 text-slate-400 dark:text-[#6e7681]'
                    : act?.hasHighlighted
                    ? 'bg-amber-500/5 dark:bg-[#d29922]/10 hover:bg-amber-500/10 dark:hover:bg-[#d29922]/15'
                    : 'bg-white/90 dark:bg-[#161b22] hover:bg-slate-100 dark:hover:bg-[#1c2128]'
                } ${isDayToday ? 'ring-2 ring-inset ring-teal-500 dark:ring-[#58a6ff]' : act?.hasHighlighted ? 'ring-1 ring-inset ring-amber-400/80 dark:ring-[#d29922]/80' : ''}`}
              >
                {/* Top: Day number + Highlight Star */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                      isDayToday
                        ? 'bg-teal-600 dark:bg-[#1f6feb] text-white'
                        : isCurrMonth
                        ? 'text-slate-900 dark:text-[#f0f6fc]'
                        : 'text-slate-400 dark:text-[#6e7681]'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {act?.hasHighlighted && (
                    <span title="Contains highlighted deadline or exam">
                      <Star className="w-3.5 h-3.5 text-amber-500 dark:text-[#e3b341] fill-amber-500 dark:fill-[#e3b341]" />
                    </span>
                  )}
                </div>

                {/* Middle: Badges for Tasks & College */}
                <div className="my-1 space-y-1 overflow-hidden">
                  {sortedTasks.length > 0 && (
                    <div className="space-y-0.5">
                      {sortedTasks.slice(0, 2).map(tItem => {
                        const isTaskHighlighted = tItem.task.isHighlighted || tItem.occurrence?.isHighlightedOverride;
                        return (
                          <div
                            key={tItem.task.id}
                            className={`text-[9px] flex items-center gap-1 px-1.5 py-0.5 rounded truncate ${
                              isTaskHighlighted
                                ? 'bg-amber-500/20 dark:bg-[#d29922]/30 text-amber-900 dark:text-[#e3b341] font-bold border border-amber-500/40 dark:border-[#d29922]/50'
                                : 'bg-slate-100 dark:bg-[#0d1117] text-slate-700 dark:text-[#c9d1d9] border border-slate-200 dark:border-[#30363d]'
                            }`}
                          >
                            {isTaskHighlighted ? (
                              <Star className="w-2.5 h-2.5 text-amber-500 dark:text-[#e3b341] fill-amber-500 dark:fill-[#e3b341] shrink-0" />
                            ) : (
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: tItem.task.color }}
                              />
                            )}
                            <span className="truncate">{tItem.occurrence?.overrideTitle || tItem.task.title}</span>
                          </div>
                        );
                      })}

                      {sortedTasks.length > 2 && (
                        <div className="text-[8px] font-semibold text-slate-500 dark:text-[#8b949e] px-1">
                          + {sortedTasks.length - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  {act && act.collegePeriods.length > 0 && (
                    <div className="text-[9px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-500/15 dark:bg-[#1f6feb]/15 text-teal-700 dark:text-[#58a6ff] border border-teal-500/30 dark:border-[#1f6feb]/30">
                      <GraduationCap className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{act.collegePeriods.length} Classes</span>
                    </div>
                  )}

                  {act?.isCollegeHoliday && (
                    <div className="text-[8px] px-1 py-0.5 rounded bg-amber-500/15 dark:bg-[#d29922]/20 text-amber-700 dark:text-[#e3b341] text-center font-bold">
                      Holiday
                    </div>
                  )}
                </div>

                {/* Bottom: Mini Activity Heatmap Strip */}
                <div className="pt-1 flex items-center justify-between">
                  <div
                    style={{ backgroundColor: levelColor }}
                    className="h-1.5 w-full rounded-full"
                    title={`Completion level: ${level}/4 (${act?.completionPercentage || 0}%)`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
