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
    streakStats, 
    todayActivity, 
    toggleTaskDone, 
    skipTaskForDate, 
    setActiveView 
  } = useApp();

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
        <div className="p-5 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-[#f0883e]/15 text-[#f0883e] rounded-xl border border-[#f0883e]/30">
            <Flame className="w-6 h-6 fill-[#f0883e]" />
          </div>
          <div>
            <span className="text-xs text-[#8b949e] font-semibold uppercase tracking-wider block">
              Current Streak
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#f0f6fc]">
                {streakStats.currentStreak}
              </span>
              <span className="text-xs text-[#8b949e]">days</span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-[#e3b341]/15 text-[#e3b341] rounded-xl border border-[#e3b341]/30">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#8b949e] font-semibold uppercase tracking-wider block">
              Longest Streak
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#f0f6fc]">
                {streakStats.longestStreak}
              </span>
              <span className="text-xs text-[#8b949e]">days</span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-[#238636]/15 text-[#3fb950] rounded-xl border border-[#238636]/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#8b949e] font-semibold uppercase tracking-wider block">
              Today's Completion
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#f0f6fc]">
                {todayActivity ? todayActivity.completionPercentage : 0}%
              </span>
              <span className="text-xs text-[#8b949e]">
                ({todayActivity?.totalCompleted || 0}/{todayActivity?.totalScheduled || 0})
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xs flex items-center gap-4">
          <div className="p-3 bg-[#1f6feb]/15 text-[#58a6ff] rounded-xl border border-[#1f6feb]/30">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-[#8b949e] font-semibold uppercase tracking-wider block">
              Total Completions
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#f0f6fc]">
                {streakStats.totalCompletions}
              </span>
              <span className="text-xs text-[#8b949e]">tasks done</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Two Column Layout: Today's Focus & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Quick Checklist */}
        <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#3fb950]" />
                <h2 className="text-base font-bold text-[#f0f6fc]">
                  Today's Agenda & Routine
                </h2>
                <span className="text-xs text-[#8b949e]">
                  ({format(new Date(), 'EEE, MMM d')})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveView('agenda')}
                className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1 font-semibold"
              >
                Full Agenda <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Task List */}
            {todayActivity?.tasks.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[#30363d] rounded-xl text-xs text-[#8b949e] space-y-2">
                <Sparkles className="w-6 h-6 text-[#6e7681] mx-auto" />
                <p className="text-[#c9d1d9] font-medium">No tasks scheduled for today.</p>
                <button
                  type="button"
                  onClick={() => onOpenTaskModal(todayStr)}
                  className="text-[#58a6ff] hover:underline font-semibold"
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

          <div className="mt-4 pt-3 border-t border-[#30363d] flex items-center justify-between text-xs text-[#8b949e]">
            <span>Clicking checkboxes saves immediately to offline IndexedDB.</span>
            <button
              type="button"
              onClick={() => onOpenTaskModal(todayStr)}
              className="flex items-center gap-1 text-[#58a6ff] hover:underline font-semibold"
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

          {/* Today's College Schedule Mini Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#58a6ff]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc]">
                  Today's College Classes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('college')}
                className="text-[11px] text-[#58a6ff] hover:underline font-medium"
              >
                Timetable
              </button>
            </div>

            {todayActivity?.isCollegeHoliday ? (
              <div className="p-3 bg-[#d29922]/10 border border-[#d29922]/30 rounded-lg text-xs text-[#e3b341]">
                🎓 College Holiday Today
              </div>
            ) : todayActivity?.collegePeriods.length === 0 ? (
              <p className="text-xs text-[#8b949e]">
                No classes scheduled for today on the weekly timetable.
              </p>
            ) : (
              <div className="space-y-2">
                {todayActivity?.collegePeriods.slice(0, 3).map(p => (
                  <CollegePeriodCard key={p.id} period={p} compact />
                ))}
                {todayActivity && todayActivity.collegePeriods.length > 3 && (
                  <p className="text-[11px] text-[#8b949e] text-center">
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
