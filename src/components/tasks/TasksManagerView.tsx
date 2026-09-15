import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Plus, 
  Search, 
  Flame, 
  Repeat, 
  Star, 
  Edit3, 
  Trash2,
  BarChart3
} from 'lucide-react';
import { calculateTaskStreak } from '../../services/stats';
import { toDateString } from '../../services/recurrence';
import type { Task } from '../../types';

interface TasksManagerViewProps {
  onOpenTaskModal: (taskToEdit?: Task) => void;
  onSelectTaskDetail: (task: Task) => void;
}

export const TasksManagerView: React.FC<TasksManagerViewProps> = ({
  onOpenTaskModal,
  onSelectTaskDetail,
}) => {
  const { tasks, activities, deleteTask, setHeatmapFilter } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const todayStr = toDateString(new Date());

  // Unique categories
  const categories = Array.from(new Set(tasks.map(t => t.category))).filter(Boolean);

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getRecurrenceLabel = (task: Task) => {
    switch (task.recurrence.type) {
      case 'none':
        return `One-time: ${task.recurrence.targetDate || task.recurrence.startDate}`;
      case 'daily':
        return 'Daily';
      case 'weekly_days': {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `Weekly (${(task.recurrence.daysOfWeek || []).map(d => days[d]).join(', ')})`;
      }
      case 'interval':
        return `Every ${task.recurrence.intervalDays || 1} days`;
      default:
        return 'Custom';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#f0f6fc]">All Tasks & Habits</h1>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Manage your recurring routines, view single-task heatmaps, and customize schedules.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenTaskModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-lg shadow transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Create New Task
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-[#30363d]">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8b949e] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
            />
          </div>

          {/* Categories Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-[#1f6feb] text-white'
                  : 'bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              All ({tasks.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#1f6feb] text-white'
                    : 'bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                {cat} ({tasks.filter(t => t.category === cat).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-10 text-center text-xs text-[#8b949e] space-y-3">
          <p className="font-semibold text-sm text-[#f0f6fc]">No tasks found</p>
          <p>Try clearing your search or add a new task.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map(task => {
            const streak = calculateTaskStreak(task, activities, todayStr);

            return (
              <div
                key={task.id}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-[#58a6ff]/50 transition-all flex flex-col justify-between shadow-sm group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: task.color }}
                      />
                      <h3 className="text-sm font-bold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors">
                        {task.title}
                      </h3>

                      {task.isHighlighted && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#e3b341] bg-[#d29922]/20 px-1.5 py-0.5 rounded border border-[#d29922]/40">
                          <Star className="w-2.5 h-2.5 fill-[#e3b341]" /> Important
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 text-xs font-bold text-[#f0883e] bg-[#f0883e]/15 border border-[#f0883e]/30 px-2 py-0.5 rounded-full">
                        <Flame className="w-3 h-3 fill-[#f0883e]" />
                        {streak.currentStreak}d
                      </span>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-xs text-[#8b949e] line-clamp-2">{task.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-[#8b949e] pt-1 flex-wrap">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${task.color}20`,
                        color: task.color,
                        border: `1px solid ${task.color}40`,
                      }}
                    >
                      {task.category}
                    </span>

                    <span className="flex items-center gap-1 text-[11px]">
                      <Repeat className="w-3 h-3 text-[#58a6ff]" />
                      {getRecurrenceLabel(task)}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#30363d] text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setHeatmapFilter({ type: 'task', value: task.id });
                      onSelectTaskDetail(task);
                    }}
                    className="flex items-center gap-1 text-[#58a6ff] hover:underline font-semibold"
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> View Heatmap & Stats
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenTaskModal(task)}
                      className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition-colors"
                      title="Edit task"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm(`Delete "${task.title}" and its history?`)) {
                          await deleteTask(task.id);
                        }
                      }}
                      className="p-1.5 text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] rounded transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
