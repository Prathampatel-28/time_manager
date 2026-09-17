import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Star, 
  Plus, 
  GraduationCap, 
  AlertCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { fromDateString } from '../../services/recurrence';
import { TaskOccurrenceCard } from '../tasks/TaskOccurrenceCard';
import { CollegePeriodCard } from '../college/CollegePeriodCard';

interface DayDetailModalProps {
  dateStr: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenTaskModalForDate?: (dateStr: string) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  dateStr,
  isOpen,
  onClose,
  onOpenTaskModalForDate,
}) => {
  const { 
    activities, 
    toggleTaskDone, 
    skipTaskForDate, 
    removeTaskForDate, 
    resetTaskOccurrence, 
    saveOccurrence,
    saveCollegeException,
  } = useApp();

  if (!isOpen || !dateStr) return null;

  const dateObj = fromDateString(dateStr);
  const formattedDate = format(dateObj, 'EEEE, MMMM d, yyyy');
  const activity = activities.find(a => a.date === dateStr);

  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  // Quick action: Mark entire day as College Holiday
  const handleMarkCollegeHoliday = async () => {
    const reason = window.prompt('Enter reason for College Holiday (e.g. Festival, University Off):', 'Holiday');
    if (reason !== null) {
      await saveCollegeException({
        id: `holiday_${dateStr}`,
        date: dateStr,
        type: 'holiday',
        note: reason,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-[#c9d1d9]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#30363d] bg-slate-50/90 dark:bg-[#0d1117]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#f0f6fc]">{formattedDate}</h2>
              {isToday && (
                <span className="text-[11px] font-semibold uppercase tracking-wider bg-teal-500/15 text-teal-700 dark:text-[#58a6ff] border border-teal-500/30 dark:border-[#1f6feb]/40 px-2.5 py-0.5 rounded-full">
                  Today
                </span>
              )}
              {activity?.hasHighlighted && (
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-[#e3b341] border border-amber-500/30 dark:border-[#d29922]/40 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-amber-500 dark:fill-[#e3b341]" /> Highlighted
                </span>
              )}
            </div>
            
            {/* Day stats badge */}
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-[#8b949e]">
              <span>
                Completed:{' '}
                <strong className="text-slate-900 dark:text-[#f0f6fc]">
                  {activity?.totalCompleted || 0} / {activity?.totalScheduled || 0}
                </strong>
                {activity?.totalScheduled ? ` (${activity.completionPercentage}%)` : ''}
              </span>
              {activity?.totalSkipped ? (
                <span className="text-slate-500 dark:text-[#8b949e] italic">
                  ({activity.totalSkipped} skipped - neutral for streak)
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-[#f0f6fc] hover:bg-slate-200/60 dark:hover:bg-[#21262d] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Section 1: Tasks & Habits */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#8b949e]">
                Scheduled Tasks & Habits ({activity?.tasks.length || 0})
              </h3>
              {onOpenTaskModalForDate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTaskModalForDate(dateStr);
                  }}
                  className="flex items-center gap-1 text-xs text-teal-600 dark:text-[#58a6ff] hover:underline font-bold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task for this Date
                </button>
              )}
            </div>

            {activity?.tasks.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] text-center text-xs text-slate-500 dark:text-[#8b949e]">
                No tasks scheduled for this date.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activity?.tasks.map(({ task, occurrence, status }) => (
                  <TaskOccurrenceCard
                    key={task.id}
                    task={task}
                    occurrence={occurrence}
                    status={status}
                    dateStr={dateStr}
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

          {/* Section 2: College Timetable Schedule */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-teal-600 dark:text-[#58a6ff]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#8b949e]">
                  Timetable Schedule
                </h3>
              </div>

              {!activity?.isCollegeHoliday && (
                <button
                  type="button"
                  onClick={handleMarkCollegeHoliday}
                  className="text-xs text-slate-500 dark:text-[#8b949e] hover:text-amber-600 dark:hover:text-[#e3b341] transition-colors"
                >
                  Mark Holiday on this Date
                </button>
              )}
            </div>

            {activity?.isCollegeHoliday ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-700 dark:text-[#e3b341]">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-semibold">Timetable Holiday</p>
                  <p className="text-slate-500 dark:text-[#8b949e] mt-0.5">Classes cancelled for this date.</p>
                </div>
              </div>
            ) : activity?.collegePeriods.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] text-center text-xs text-slate-500 dark:text-[#8b949e]">
                No classes scheduled for this day of the week.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activity?.collegePeriods.map(period => (
                  <CollegePeriodCard key={period.id} period={period} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-[#30363d] bg-slate-50 dark:bg-[#0d1117] text-xs text-slate-500 dark:text-[#8b949e]">
          <span>Tip: Skipped occurrences do not lower your completion % or break streaks.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold transition-colors shadow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
