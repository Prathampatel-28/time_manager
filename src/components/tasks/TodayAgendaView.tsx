import React, { useState, useMemo } from 'react';
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
  Sparkles,
  Clock,
  CalendarDays
} from 'lucide-react';
import { toDateString, fromDateString } from '../../services/recurrence';
import { TaskOccurrenceCard } from './TaskOccurrenceCard';
import { CollegePeriodCard } from '../college/CollegePeriodCard';
import type { Task, OccurrenceStatus, Occurrence } from '../../types';
import { NotificationBanner } from '../notifications/NotificationBanner';
import { NotificationPermissionModal } from '../notifications/NotificationPermissionModal';

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
    saveOccurrence,
    updateSettings,
    settings
  } = useApp();

  const timetableConfig = settings.timetableConfig || { name: 'College Timetable', type: 'College' };

  const [currentDateStr, setCurrentDateStr] = useState(() => toDateString(new Date()));
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

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

  // Group tasks into Timed and All-Day items
  const { timedTasks, allDayTasks } = useMemo(() => {
    const timed: Array<{ task: Task; occurrence?: Occurrence; status: OccurrenceStatus }> = [];
    const allDay: Array<{ task: Task; occurrence?: Occurrence; status: OccurrenceStatus }> = [];

    for (const item of activity.tasks) {
      if (item.task.startTime) {
        timed.push(item);
      } else {
        allDay.push(item);
      }
    }

    // Sort timed tasks chronologically
    timed.sort((a, b) => (a.task.startTime || '').localeCompare(b.task.startTime || ''));

    return { timedTasks: timed, allDayTasks: allDay };
  }, [activity.tasks]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* First-Use Notification Banner */}
      {!isBannerDismissed && (
        <NotificationBanner
          onRequestPermission={() => setIsPermissionModalOpen(true)}
          onDismiss={() => setIsBannerDismissed(true)}
        />
      )}

      {/* Date Navigation Bar */}
      <div className="gradient-card p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-300 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                isToday
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{format(currentDate, 'EEEE, MMMM d, yyyy')}</span>
              {isToday && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-teal-500/20 text-teal-700 dark:text-teal-400 border border-teal-500/40 rounded-full">
                  Today
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Progress & Add Action */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-right hidden sm:block">
            <span className="text-slate-500 dark:text-slate-400">Progress: </span>
            <strong className="text-slate-900 dark:text-slate-100">
              {activity.totalCompleted} / {activity.totalScheduled} completed
            </strong>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-1">
              ({activity.completionPercentage}%)
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenTaskModal(currentDateStr)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {activity.totalScheduled > 0 && (
        <div className="gradient-card p-4 rounded-2xl space-y-2 border border-slate-300 dark:border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Daily Goal Completion</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{activity.completionPercentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-900/80 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300 rounded-full shadow-md shadow-emerald-500/30"
              style={{ width: `${activity.completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* SECTION 1: Timed Tasks & College Schedule (Chronological Order) */}
      {(timedTasks.length > 0 || activity.collegePeriods.length > 0) && (
        <div className="gradient-card rounded-2xl p-6 space-y-4 border border-slate-300 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300">
                Timed Schedule ({timedTasks.length + (activity.isCollegeHoliday ? 0 : activity.collegePeriods.length)})
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Sorted Chronologically</span>
          </div>

          <div className="space-y-3">
            {/* Timed Tasks */}
            {timedTasks.map(({ task, occurrence, status }) => (
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

            {/* College Classes Today */}
            {!activity.isCollegeHoliday && activity.collegePeriods.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                    {timetableConfig.name || 'College'} Lectures & Sessions
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activity.collegePeriods.map(period => (
                    <CollegePeriodCard key={period.id} period={period} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: All-Day Tasks & Habits */}
      <div className="gradient-card rounded-2xl p-6 space-y-4 border border-slate-300 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300">
              All-Day Tasks & Habits ({allDayTasks.length})
            </h2>
          </div>
        </div>

        {allDayTasks.length === 0 && timedTasks.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-700/80 rounded-2xl text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <Sparkles className="w-7 h-7 text-slate-400 dark:text-slate-500 mx-auto" />
            <p className="font-semibold text-slate-900 dark:text-slate-200">No tasks scheduled for this day</p>
            <p>Enjoy your free time or add a task with the button above.</p>
          </div>
        ) : allDayTasks.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-500">
            No all-day tasks for this day. All scheduled items have specific start times above.
          </div>
        ) : (
          <div className="space-y-3">
            {allDayTasks.map(({ task, occurrence, status }) => (
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

      {/* College Holiday Alert if Holiday */}
      {activity.isCollegeHoliday && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-amber-500 shrink-0" />
          <span>🎓 {timetableConfig.name || 'College'} Holiday - All class periods dismissed for this date.</span>
        </div>
      )}

      {/* Permission Modal */}
      <NotificationPermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        onPermissionGranted={() => {
          updateSettings({
            notificationSettings: {
              ...(settings.notificationSettings || {
                enabled: true,
                permissionRequested: true,
                defaultOffsetMinutes: 10,
                muteCollegePeriods: false,
                mutedCategories: [],
              }),
              enabled: true,
              permissionRequested: true,
            },
          });
        }}
      />
    </div>
  );
};
