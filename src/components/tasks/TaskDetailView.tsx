import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Flame, 
  Trophy, 
  CheckCircle2, 
  Calendar, 
  Repeat, 
  Edit3, 
  Trash2, 
  Star,
  Slash
} from 'lucide-react';
import { HeatmapGraph } from '../heatmap/HeatmapGraph';
import { calculateTaskStreak } from '../../services/stats';
import { format } from 'date-fns';
import { fromDateString, toDateString } from '../../services/recurrence';
import type { Task } from '../../types';

interface TaskDetailViewProps {
  task: Task;
  onBack: () => void;
  onEdit: (task: Task) => void;
  onDayClick: (dateStr: string) => void;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({
  task,
  onBack,
  onEdit,
  onDayClick,
}) => {
  const { activities, deleteTask, occurrences } = useApp();
  const todayStr = toDateString(new Date());

  // Task streak stats
  const taskStats = calculateTaskStreak(task, activities, todayStr);

  // Recurrence summary text
  const getRecurrenceSummary = () => {
    switch (task.recurrence.type) {
      case 'none':
        return `One-time on ${task.recurrence.targetDate || task.recurrence.startDate}`;
      case 'daily':
        return 'Repeats Daily';
      case 'weekly_days': {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const list = (task.recurrence.daysOfWeek || []).map(d => days[d]).join(', ');
        return `Weekly on ${list || 'specific days'}`;
      }
      case 'interval':
        return `Every ${task.recurrence.intervalDays || 1} days`;
      default:
        return 'Custom recurrence';
    }
  };

  // Occurrences history for this task
  const taskOccurrences = occurrences
    .filter(o => o.taskId === task.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30); // show recent 30 entries

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Tasks
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#f0f6fc] rounded-lg border border-[#30363d] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Task
          </button>
          <button
            type="button"
            onClick={async () => {
              if (window.confirm(`Delete "${task.title}" and its complete history?`)) {
                await deleteTask(task.id);
                onBack();
              }
            }}
            className="p-1.5 text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] rounded-lg transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Task Header Profile Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="w-3.5 h-3.5 rounded-full inline-block shrink-0"
                style={{ backgroundColor: task.color }}
              />
              <h1 className="text-xl font-bold text-[#f0f6fc]">{task.title}</h1>
              {task.isHighlighted && (
                <span className="flex items-center gap-1 text-xs font-bold text-[#e3b341] bg-[#d29922]/20 px-2 py-0.5 rounded-full border border-[#d29922]/40">
                  <Star className="w-3 h-3 fill-[#e3b341]" /> Important Milestone
                </span>
              )}
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${task.color}20`,
                  color: task.color,
                  border: `1px solid ${task.color}40`,
                }}
              >
                {task.category}
              </span>
            </div>

            {task.description && (
              <p className="text-xs text-[#8b949e] max-w-2xl">{task.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-[#8b949e] pt-1 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-[#58a6ff]" />
                {getRecurrenceSummary()}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#3fb950]" />
                Started {format(fromDateString(task.recurrence.startDate), 'MMM d, yyyy')}
              </span>
            </div>
          </div>

          {/* Key Stats Counter Pills */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-center min-w-[90px]">
              <div className="flex items-center justify-center gap-1 text-[#f0883e]">
                <Flame className="w-4 h-4 fill-[#f0883e]" />
                <span className="text-base font-bold">{taskStats.currentStreak}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#8b949e]">Streak</span>
            </div>

            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-center min-w-[90px]">
              <div className="flex items-center justify-center gap-1 text-[#e3b341]">
                <Trophy className="w-4 h-4" />
                <span className="text-base font-bold">{taskStats.longestStreak}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#8b949e]">Best</span>
            </div>

            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-center min-w-[90px]">
              <div className="flex items-center justify-center gap-1 text-[#3fb950]">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-base font-bold">{taskStats.totalCompletions}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#8b949e]">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Task-Specific Contribution Heatmap */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#8b949e] mb-3">
          Individual Task Activity Heatmap
        </h2>
        <HeatmapGraph dateRange="1y" onDayClick={onDayClick} />
      </div>

      {/* Recent Occurrence History */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#8b949e] mb-4">
          Recorded Occurrence History ({taskOccurrences.length})
        </h2>

        {taskOccurrences.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-[#30363d] rounded-xl text-xs text-[#8b949e]">
            No recorded history yet. Mark occurrences done or skipped on the dashboard or agenda.
          </div>
        ) : (
          <div className="divide-y divide-[#30363d]">
            {taskOccurrences.map(occ => (
              <div
                key={occ.id}
                className="py-3 flex items-center justify-between text-xs cursor-pointer hover:bg-[#0d1117] px-3 rounded transition-colors"
                onClick={() => onDayClick(occ.date)}
              >
                <div className="flex items-center gap-3">
                  {occ.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#3fb950]" />
                  ) : occ.status === 'skipped' ? (
                    <Slash className="w-4 h-4 text-[#8b949e]" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#8b949e]" />
                  )}

                  <div>
                    <span className="font-semibold text-[#f0f6fc]">
                      {format(fromDateString(occ.date), 'EEEE, MMMM d, yyyy')}
                    </span>
                    {occ.notes && (
                      <p className="text-[11px] text-[#8b949e] mt-0.5">{occ.notes}</p>
                    )}
                  </div>
                </div>

                <div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      occ.status === 'done'
                        ? 'bg-[#238636]/20 text-[#3fb950]'
                        : occ.status === 'skipped'
                        ? 'bg-[#21262d] text-[#8b949e]'
                        : 'bg-[#1f6feb]/20 text-[#58a6ff]'
                    }`}
                  >
                    {occ.status === 'skipped' ? 'Skipped (Preserved Streak)' : occ.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
