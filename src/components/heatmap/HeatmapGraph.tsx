import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getHeatmapCellColor } from '../../utils/theme';
import { 
  subMonths, 
  subYears, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  getMonth, 
  isAfter 
} from 'date-fns';
import { toDateString, fromDateString } from '../../services/recurrence';
import type { DayActivity } from '../../types';
import { Star, Flame, Trophy, CheckCircle2 } from 'lucide-react';

interface HeatmapGraphProps {
  dateRange: '3m' | '6m' | '1y';
  onDayClick: (dateStr: string) => void;
}

export const HeatmapGraph: React.FC<HeatmapGraphProps> = ({
  dateRange,
  onDayClick,
}) => {
  const { 
    activities, 
    settings, 
    streakStats, 
    heatmapFilter, 
    tasks 
  } = useApp();

  const [hoveredDay, setHoveredDay] = useState<{
    activity: DayActivity;
    x: number;
    y: number;
  } | null>(null);

  const isLight = settings.theme === 'light';
  const todayStr = useMemo(() => toDateString(new Date()), []);
  const today = useMemo(() => new Date(), []);

  // Quick lookup map for activities by date
  const activityMap = useMemo(() => {
    const map = new Map<string, DayActivity>();
    for (const act of activities) {
      map.set(act.date, act);
    }
    return map;
  }, [activities]);

  // Determine date bounds based on selected range
  const { weeks } = useMemo(() => {
    let start: Date;
    if (dateRange === '3m') {
      start = subMonths(today, 3);
    } else if (dateRange === '6m') {
      start = subMonths(today, 6);
    } else {
      start = subYears(today, 1);
    }

    // Align start to start of week (Sunday = 0)
    const calendarStart = startOfWeek(start, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(today, { weekStartsOn: 0 });

    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Group into columns (weeks), each with 7 days (Sun -> Sat)
    const weekColumns: Date[][] = [];
    let currentWeek: Date[] = [];

    allDays.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weekColumns.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      weekColumns.push(currentWeek);
    }

    return {
      weeks: weekColumns,
    };
  }, [dateRange, today]);

  // Compute month labels with week index positions
  const monthLabels = useMemo(() => {
    const labels: { name: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, index) => {
      // Pick a representative day in the week (e.g. Thursday or day 0)
      const day = week[0];
      const month = getMonth(day);

      if (month !== lastMonth && index < weeks.length - 1) {
        labels.push({
          name: format(day, 'MMM'),
          weekIndex: index,
        });
        lastMonth = month;
      }
    });

    return labels;
  }, [weeks]);

  // Get active filter title
  const filterTitle = useMemo(() => {
    if (heatmapFilter.type === 'all') return 'All Tasks & Habits';
    if (heatmapFilter.type === 'category') return `Category: ${heatmapFilter.value}`;
    const t = tasks.find(x => x.id === heatmapFilter.value);
    return t ? `Task: ${t.title}` : 'Selected Task';
  }, [heatmapFilter, tasks]);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-lg relative">
      {/* Top Banner: Filter & Summary Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#30363d]">
        <div>
          <h2 className="text-base font-semibold text-[#f0f6fc] flex items-center gap-2">
            <span>Activity Heatmap</span>
            <span className="text-xs font-normal text-[#8b949e]">({filterTitle})</span>
          </h2>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Reflects actual completed tasks and daily consistency. Skipped occurrences do not break streaks.
          </p>
        </div>

        {/* Quick Streak Stats Pills */}
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg">
            <Flame className="w-4 h-4 text-[#f0883e] fill-[#f0883e]" />
            <div>
              <span className="text-[#8b949e] text-[10px] uppercase font-semibold block leading-none">Streak</span>
              <span className="text-[#f0f6fc] font-bold">{streakStats.currentStreak} Days</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg">
            <Trophy className="w-4 h-4 text-[#e3b341]" />
            <div>
              <span className="text-[#8b949e] text-[10px] uppercase font-semibold block leading-none">Best</span>
              <span className="text-[#f0f6fc] font-bold">{streakStats.longestStreak} Days</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-[#3fb950]" />
            <div>
              <span className="text-[#8b949e] text-[10px] uppercase font-semibold block leading-none">Total</span>
              <span className="text-[#f0f6fc] font-bold">{streakStats.totalCompletions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Wrapper (horizontally scrollable on mobile) */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-fit inline-block">
          {/* Month labels row */}
          <div className="flex text-[11px] text-[#8b949e] font-medium mb-1.5 h-4 pl-8 relative">
            {monthLabels.map(label => (
              <span
                key={`${label.name}-${label.weekIndex}`}
                className="absolute"
                style={{ left: `${label.weekIndex * 15 + 32}px` }}
              >
                {label.name}
              </span>
            ))}
          </div>

          {/* Grid: Day labels on left, Week columns on right */}
          <div className="flex gap-2">
            {/* Weekday labels (Mon, Wed, Fri like GitHub) */}
            <div className="flex flex-col justify-between text-[10px] text-[#8b949e] font-medium py-[1px] select-none pr-1">
              <span className="h-[12px]"></span>
              <span className="h-[12px] leading-[12px]">Mon</span>
              <span className="h-[12px]"></span>
              <span className="h-[12px] leading-[12px]">Wed</span>
              <span className="h-[12px]"></span>
              <span className="h-[12px] leading-[12px]">Fri</span>
              <span className="h-[12px]"></span>
            </div>

            {/* Weeks columns */}
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIdx) => (
                <div key={`week-${weekIdx}`} className="flex flex-col gap-[3px]">
                  {week.map(day => {
                    const dStr = toDateString(day);
                    const isFuture = isAfter(day, today);
                    const isToday = dStr === todayStr;

                    const act = activityMap.get(dStr) || {
                      date: dStr,
                      totalScheduled: 0,
                      totalCompleted: 0,
                      totalSkipped: 0,
                      completionPercentage: 0,
                      level: 0,
                      hasHighlighted: false,
                      tasks: [],
                      collegePeriods: [],
                      isCollegeHoliday: false,
                    };

                    const cellColor = getHeatmapCellColor(
                      isFuture ? 0 : act.level,
                      settings.heatmapTheme,
                      isLight
                    );

                    return (
                      <div
                        key={dStr}
                        onClick={() => onDayClick(dStr)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredDay({
                            activity: act,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                          });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                        style={{ backgroundColor: cellColor }}
                        className={`w-[12px] h-[12px] rounded-[2px] cursor-pointer transition-transform hover:scale-125 relative select-none ${
                          isLight ? 'border border-gray-300/40' : 'border border-[#30363d]/30'
                        } ${
                          isToday 
                            ? 'ring-1.5 ring-[#58a6ff] ring-offset-1 ring-offset-[#0d1117] z-10' 
                            : 'hover:ring-1 hover:ring-[#8b949e]'
                        }`}
                      >
                        {/* Highlight marker (distinct star/pin dot for important exams/deadlines) */}
                        {act.hasHighlighted && (
                          <span 
                            className="absolute -top-[1.5px] -right-[1.5px] w-[5px] h-[5px] bg-[#f0883e] rounded-full ring-1 ring-[#0d1117] animate-pulse"
                            title="Important Event / Highlighted Milestone"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Legend & Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-[#30363d] text-xs text-[#8b949e]">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#f0883e] inline-block animate-pulse"></span>
            <span>Starred / Highlighted milestone</span>
          </span>
        </div>

        {/* Level Legend */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">Less</span>
          {([0, 1, 2, 3, 4] as const).map(lvl => (
            <div
              key={`legend-${lvl}`}
              style={{
                backgroundColor: getHeatmapCellColor(lvl, settings.heatmapTheme, isLight),
              }}
              className="w-[11px] h-[11px] rounded-[2px] border border-[#30363d]/50"
              title={`Level ${lvl}`}
            />
          ))}
          <span className="text-[11px]">More</span>
        </div>
      </div>

      {/* Floating Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg shadow-xl text-xs text-[#c9d1d9] whitespace-nowrap animate-in fade-in duration-100"
          style={{
            left: hoveredDay.x,
            top: hoveredDay.y,
          }}
        >
          <div className="font-semibold text-[#f0f6fc]">
            {format(fromDateString(hoveredDay.activity.date), 'EEEE, MMM d, yyyy')}
          </div>
          
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[#8b949e]">
              {hoveredDay.activity.totalScheduled === 0 ? (
                'No tasks scheduled'
              ) : (
                <>
                  <strong className="text-[#f0f6fc]">
                    {hoveredDay.activity.totalCompleted}
                  </strong>{' '}
                  of {hoveredDay.activity.totalScheduled} tasks completed ({hoveredDay.activity.completionPercentage}%)
                </>
              )}
            </span>
            {hoveredDay.activity.totalSkipped > 0 && (
              <span className="text-[#8b949e] italic">
                ({hoveredDay.activity.totalSkipped} skipped)
              </span>
            )}
          </div>

          {hoveredDay.activity.hasHighlighted && (
            <div className="flex items-center gap-1 text-[#e3b341] mt-1 font-medium text-[11px]">
              <Star className="w-3 h-3 fill-[#e3b341]" /> Contains important deadline or exam
            </div>
          )}

          {hoveredDay.activity.isCollegeHoliday && (
            <div className="text-[#58a6ff] mt-0.5 text-[11px]">
              🎓 College Holiday
            </div>
          )}

          <div className="text-[10px] text-[#6e7681] mt-1">
            Click to view and edit details
          </div>
        </div>
      )}
    </div>
  );
};
