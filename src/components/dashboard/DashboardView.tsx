import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HeatmapGraph } from '../heatmap/HeatmapGraph';
import { HeatmapControls } from '../heatmap/HeatmapControls';
import { UpcomingHighlights } from '../highlights/UpcomingHighlights';
import { TaskOccurrenceCard } from '../tasks/TaskOccurrenceCard';
import { CollegePeriodCard } from '../college/CollegePeriodCard';
import { 
  Flame, 
  Trophy, 
  CheckCircle2, 
  Target, 
  GraduationCap, 
  Plus, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { toDateString } from '../../services/recurrence';
import type { Task } from '../../types';

interface DashboardViewProps {
  onDayClick: (dateStr: string) => void;
  onOpenTaskModal: (defaultDate?: string, taskToEdit?: Task) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onDayClick,
  onOpenTaskModal,
}) => {
  const { 
    settings,
    streakStats, 
    todayActivity, 
    toggleTaskDone, 
    skipTaskForDate, 
    setActiveView 
  } = useApp();

  const timetableConfig = settings.timetableConfig || { name: 'College Timetable', type: 'College' };

  const [dateRange, setDateRange] = useState<'3m' | '6m' | '1y'>('1y');
  const todayStr = toDateString(new Date());

  return (
    <div className="space-y-6">
      {/* 1. Heatmap Controls */}
      <HeatmapControls dateRange={dateRange} setDateRange={setDateRange} />

      {/* 2. GitHub-Style Contribution Heatmap */}
      <HeatmapGraph dateRange={dateRange} onDayClick={onDayClick} />

      {/* 3. Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="gradient-card p-5 rounded-2xl shadow-lg flex items-center gap-4 border border-slate-300 dark:border-slate-700/60">
          <div className="p-3.5 bg-amber-500/15 text-amber-500 rounded-2xl border border-amber-500/30">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
              Current Streak
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {streakStats.currentStreak}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">days</span>
            </div>
          </div>
        </div>

        <div className="gradient-card p-5 rounded-2xl shadow-lg flex items-center gap-4 border border-slate-300 dark:border-slate-700/60">
          <div className="p-3.5 bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 rounded-2xl border border-yellow-500/30">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
              Longest Streak
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {streakStats.longestStreak}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">days</span>
            </div>
          </div>
        </div>

        <div className="gradient-card p-5 rounded-2xl shadow-lg flex items-center gap-4 border border-slate-300 dark:border-slate-700/60">
          <div className="p-3.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
              Today's Completion
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {todayActivity ? todayActivity.completionPercentage : 0}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({todayActivity?.totalCompleted || 0}/{todayActivity?.totalScheduled || 0})
              </span>
            </div>
          </div>
        </div>

        <div className="gradient-card p-5 rounded-2xl shadow-lg flex items-center gap-4 border border-slate-300 dark:border-slate-700/60">
          <div className="p-3.5 bg-teal-500/15 text-teal-600 dark:text-teal-400 rounded-2xl border border-teal-500/30">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
              Total Completions
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {streakStats.totalCompletions}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">tasks done</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Two Column Layout: Today's Focus & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Quick Checklist */}
        <div className="lg:col-span-2 gradient-card rounded-2xl p-6 shadow-xl flex flex-col justify-between border border-slate-300 dark:border-slate-700/60">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Today's Agenda & Routine
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({format(new Date(), 'EEE, MMM d')})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveView('agenda')}
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold"
              >
                Full Agenda <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Task List */}
            {todayActivity?.tasks.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-700/80 rounded-2xl text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <Sparkles className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-auto" />
                <p className="text-slate-700 dark:text-slate-200 font-medium">No tasks scheduled for today.</p>
                <button
                  type="button"
                  onClick={() => onOpenTaskModal(todayStr)}
                  className="text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                >
                  + Add a task for today
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayActivity?.tasks.map(({ task, occurrence, status }) => (
                  <TaskOccurrenceCard
                    key={task.id}
                    task={task}
                    occurrence={occurrence}
                    status={status}
                    dateStr={todayStr}
                    onToggleDone={toggleTaskDone}
                    onSkip={skipTaskForDate}
                    onReset={() => {}}
                    onRemove={() => {}}
                    onSaveOccurrence={() => Promise.resolve()}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Clicking checkboxes saves immediately to offline IndexedDB.</span>
            <button
              type="button"
              onClick={() => onOpenTaskModal(todayStr)}
              className="flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>
        </div>

        {/* Right 1 Col: Highlights & College Summary */}
        <div className="space-y-6">
          {/* Upcoming Highlights */}
          <UpcomingHighlights
            onDayClick={onDayClick}
            onEditTask={task => onOpenTaskModal(undefined, task)}
          />

          {/* Today's Timetable Schedule Mini Card */}
          <div className="gradient-card rounded-2xl p-5 shadow-xl border border-slate-300 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Today's {timetableConfig.name || 'College'} Schedule
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('college')}
                className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-medium"
              >
                Timetable
              </button>
            </div>

            {todayActivity?.isCollegeHoliday ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-700 dark:text-amber-300 font-semibold">
                🎓 {timetableConfig.type || 'College'} Holiday Today
              </div>
            ) : todayActivity?.collegePeriods.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No classes scheduled for today on the weekly timetable.
              </p>
            ) : (
              <div className="space-y-2">
                {todayActivity?.collegePeriods.slice(0, 3).map(p => (
                  <CollegePeriodCard key={p.id} period={p} compact />
                ))}
                {todayActivity && todayActivity.collegePeriods.length > 3 && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                    + {todayActivity.collegePeriods.length - 3} more periods
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
