import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  format, 
  addDays, 
  subDays 
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  GraduationCap, 
  Sparkles
} from 'lucide-react';
import { toDateString, fromDateString } from '../../services/recurrence';
import { TaskOccurrenceCard } from './TaskOccurrenceCard';
import { CollegePeriodCard } from '../college/CollegePeriodCard';

interface TodayAgendaViewProps {
  onOpenTaskModal: (defaultDate?: string) => void;
}

export const TodayAgendaView: React.FC<TodayAgendaViewProps> = ({ onOpenTaskModal }) => {
  const { 
    activities, 
    toggleTaskDone, 
    skipTaskForDate, 
    removeTaskForDate, 
    resetTaskOccurrence, 
    saveOccurrence 
  } = useApp();

  const [currentDateStr, setCurrentDateStr] = useState(() => toDateString(new Date()));

  const currentDate = fromDateString(currentDateStr);
  const todayStr = toDateString(new Date());
  const isToday = currentDateStr === todayStr;

  const activity = activities.find(a => a.date === currentDateStr) || {
    date: currentDateStr,
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

  const handlePrevDay = () => setCurrentDateStr(toDateString(subDays(currentDate, 1)));
  const handleNextDay = () => setCurrentDateStr(toDateString(addDays(currentDate, 1)));
  const handleToday = () => setCurrentDateStr(todayStr);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Date Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161b22] border border-[#30363d] p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded-lg p-1">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                isToday
                  ? 'bg-[#1f6feb] text-white'
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#f0f6fc] flex items-center gap-2">
              <span>{format(currentDate, 'EEEE, MMMM d, yyyy')}</span>
              {isToday && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40 rounded-full">
                  Today
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Progress & Add Action */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-right hidden sm:block">
            <span className="text-[#8b949e]">Progress: </span>
            <strong className="text-[#f0f6fc]">
              {activity.totalCompleted} / {activity.totalScheduled} completed
            </strong>
            <span className="text-[#3fb950] font-semibold ml-1">
              ({activity.completionPercentage}%)
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenTaskModal(currentDateStr)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-lg shadow transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {activity.totalScheduled > 0 && (
        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[#8b949e]">Daily Goal Completion</span>
            <span className="font-semibold text-[#f0f6fc]">{activity.completionPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-[#0d1117] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#238636] to-[#39d353] transition-all duration-300 rounded-full"
              style={{ width: `${activity.completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Checklist */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#8b949e] mb-4">
          Today's Tasks & Habits ({activity.tasks.length})
        </h2>

        {activity.tasks.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[#30363d] rounded-xl text-xs text-[#8b949e] space-y-2">
            <Sparkles className="w-7 h-7 text-[#6e7681] mx-auto" />
            <p className="font-semibold text-[#c9d1d9]">No tasks scheduled for this day</p>
            <p>Enjoy your free time or add a task with the button above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activity.tasks.map(({ task, occurrence, status }) => (
              <TaskOccurrenceCard
                key={task.id}
                task={task}
                occurrence={occurrence}
                status={status}
                dateStr={currentDateStr}
                onToggleDone={toggleTaskDone}
                onSkip={skipTaskForDate}
                onReset={resetTaskOccurrence}
                onRemove={removeTaskForDate}
                onSaveOccurrence={saveOccurrence}
              />
            ))}
          </div>
        )}
      </div>

      {/* College Classes Section */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-[#58a6ff]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#8b949e]">
            College Classes Today
          </h2>
        </div>

        {activity.isCollegeHoliday ? (
          <div className="p-4 rounded-lg bg-[#d29922]/10 border border-[#d29922]/30 text-xs text-[#e3b341]">
            🎓 University Holiday - All classes are dismissed for this day.
          </div>
        ) : activity.collegePeriods.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-[#30363d] rounded-xl text-xs text-[#8b949e]">
            No college lectures scheduled for this day of the week.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activity.collegePeriods.map(period => (
              <CollegePeriodCard key={period.id} period={period} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
