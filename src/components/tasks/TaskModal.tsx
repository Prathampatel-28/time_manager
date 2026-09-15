import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Star, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Repeat
} from 'lucide-react';
import type { Task, RecurrenceType, SubTask, TaskCategory } from '../../types';
import { toDateString } from '../../services/recurrence';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  defaultDate?: string;
}

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
];

const PRESET_CATEGORIES: TaskCategory[] = [
  'Habit',
  'Health',
  'Coding',
  'Study',
  'College',
  'Personal',
  'Work',
];

const WEEKDAY_NAMES = [
  { day: 0, label: 'Sun' },
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultDate,
}) => {
  const { saveTask, deleteTask } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Habit');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Recurrence
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [targetDate, setTargetDate] = useState(() => defaultDate || toDateString(new Date()));
  const [startDate, setStartDate] = useState(() => defaultDate || toDateString(new Date()));
  const [endDate, setEndDate] = useState('');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [intervalDays, setIntervalDays] = useState(2);
  const [dayOfMonth, setDayOfMonth] = useState(1);

  // Subtasks
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Load task into state if editing
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      if (PRESET_CATEGORIES.includes(taskToEdit.category)) {
        setCategory(taskToEdit.category);
        setIsCustomCat(false);
      } else {
        setIsCustomCat(true);
        setCustomCategory(taskToEdit.category);
      }
      setColor(taskToEdit.color);
      setIsHighlighted(taskToEdit.isHighlighted);

      setRecurrenceType(taskToEdit.recurrence.type);
      setStartDate(taskToEdit.recurrence.startDate);
      setEndDate(taskToEdit.recurrence.endDate || '');
      setTargetDate(taskToEdit.recurrence.targetDate || taskToEdit.recurrence.startDate);
      setSelectedWeekdays(taskToEdit.recurrence.daysOfWeek || [1, 2, 3, 4, 5]);
      setIntervalDays(taskToEdit.recurrence.intervalDays || 2);
      setDayOfMonth(taskToEdit.recurrence.dayOfMonth || 1);

      setSubtasks(taskToEdit.subtasks || []);
    } else {
      // Defaults for new task
      setTitle('');
      setDescription('');
      setCategory('Habit');
      setIsCustomCat(false);
      setColor(PRESET_COLORS[0]);
      setIsHighlighted(false);

      const initDate = defaultDate || toDateString(new Date());
      setTargetDate(initDate);
      setStartDate(initDate);
      setEndDate('');
      setRecurrenceType(defaultDate ? 'none' : 'daily');
      setSelectedWeekdays([1, 2, 3, 4, 5]);
      setIntervalDays(2);
      setDayOfMonth(1);
      setSubtasks([]);
    }
  }, [taskToEdit, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks(prev => [
      ...prev,
      { id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, title: newSubtaskTitle.trim() },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
  };

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = isCustomCat && customCategory.trim() ? customCategory.trim() : category;

    const task: Task = {
      id: taskToEdit ? taskToEdit.id : `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      category: finalCategory,
      color,
      isHighlighted,
      recurrence: {
        type: recurrenceType,
        startDate: recurrenceType === 'none' ? targetDate : startDate,
        endDate: endDate ? endDate : undefined,
        targetDate: recurrenceType === 'none' ? targetDate : undefined,
        daysOfWeek: recurrenceType === 'weekly_days' ? selectedWeekdays : undefined,
        intervalDays: recurrenceType === 'interval' ? Number(intervalDays) : undefined,
        dayOfMonth: recurrenceType === 'monthly' ? Number(dayOfMonth) : undefined,
      },
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      createdAt: taskToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveTask(task);
    onClose();
  };

  const handleDelete = async () => {
    if (!taskToEdit) return;
    if (window.confirm(`Delete recurring task "${taskToEdit.title}" and all its history?`)) {
      await deleteTask(taskToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden text-[#c9d1d9]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#0d1117]">
          <h2 className="text-lg font-bold text-[#f0f6fc]">
            {taskToEdit ? 'Edit Task or Event' : 'Create New Task or Event'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#8b949e] hover:text-[#f0f6fc] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1.5">
                Task / Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Solve 2 LeetCode Problems, Morning Workout, Midterm Exam..."
                required
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3.5 py-2 text-sm text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none focus:border-[#58a6ff]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1.5">
                Description / Notes (Optional)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add instructions, checklist notes, resources..."
                rows={2}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3.5 py-2 text-xs text-[#c9d1d9] placeholder-[#6e7681] focus:outline-none focus:border-[#58a6ff] resize-none"
              />
            </div>

            {/* Category and Color Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1.5">
                  Category
                </label>
                {!isCustomCat ? (
                  <select
                    value={category}
                    onChange={e => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCat(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
                  >
                    {PRESET_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Custom Category...</option>
                  </select>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      placeholder="Category name..."
                      className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomCat(false)}
                      className="px-2 py-1 text-xs text-[#8b949e] hover:text-[#c9d1d9] border border-[#30363d] rounded"
                    >
                      Presets
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1.5">
                  Tag Color
                </label>
                <div className="flex items-center gap-1.5 py-1">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#161b22] scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Highlight / Pin Important Event */}
            <div className="p-3.5 bg-[#d29922]/10 border border-[#d29922]/40 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Star className={`w-5 h-5 ${isHighlighted ? 'text-[#e3b341] fill-[#e3b341]' : 'text-[#8b949e]'}`} />
                <div>
                  <span className="text-xs font-bold text-[#f0f6fc] block">
                    Mark as Important / Milestone
                  </span>
                  <span className="text-[11px] text-[#8b949e]">
                    Displays special highlight markers in calendars and on the GitHub heatmap
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHighlighted}
                  onChange={e => setIsHighlighted(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-[#30363d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e3b341]"></div>
              </label>
            </div>

            {/* Recurrence Pattern Configuration */}
            <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-[#58a6ff]" /> Recurrence Schedule
                </label>
              </div>

              {/* Recurrence Type Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'none', label: 'One-Time' },
                  { id: 'daily', label: 'Daily' },
                  { id: 'weekly_days', label: 'Specific Days' },
                  { id: 'interval', label: 'Interval' },
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRecurrenceType(r.id as RecurrenceType)}
                    className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-colors ${
                      recurrenceType === r.id
                        ? 'bg-[#238636] border-[#2ea043] text-white'
                        : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Conditional Recurrence Settings */}
              {recurrenceType === 'none' && (
                <div>
                  <label className="block text-xs text-[#8b949e] mb-1">Specific Event Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                  />
                </div>
              )}

              {recurrenceType === 'weekly_days' && (
                <div className="space-y-2">
                  <span className="block text-xs text-[#8b949e]">Select Active Days:</span>
                  <div className="flex gap-1.5 justify-between">
                    {WEEKDAY_NAMES.map(({ day, label }) => {
                      const isSelected = selectedWeekdays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleWeekday(day)}
                          className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${
                            isSelected
                              ? 'bg-[#1f6feb] border-[#388bfd] text-white font-bold'
                              : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {recurrenceType === 'interval' && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#8b949e]">Repeat every</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={intervalDays}
                    onChange={e => setIntervalDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1 text-xs text-[#f0f6fc] text-center"
                  />
                  <span className="text-xs text-[#8b949e]">days</span>
                </div>
              )}

              {/* Start and Optional End Date for Recurring */}
              {recurrenceType !== 'none' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#30363d]/60">
                  <div>
                    <label className="block text-[11px] text-[#8b949e] mb-1">Effective From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1 text-xs text-[#f0f6fc]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#8b949e] mb-1">Until (Optional)</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      placeholder="Forever"
                      className="w-full bg-[#161b22] border border-[#30363d] rounded px-2.5 py-1 text-xs text-[#f0f6fc]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Subtasks (Optional partial completion) */}
            <div>
              <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">
                Sub-steps / Checklist (Optional)
              </label>
              
              <div className="space-y-2 mb-2">
                {subtasks.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between gap-2 p-2 bg-[#0d1117] border border-[#30363d] rounded-md text-xs">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-3.5 h-3.5 text-[#58a6ff]" />
                      <span>{sub.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(sub.id)}
                      className="text-[#8b949e] hover:text-[#f85149]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add subtask (e.g. Part 1, 10 reps)..."
                  className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#30363d] bg-[#0d1117]">
            {taskToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#f85149] hover:bg-[#f85149]/10 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Task
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-[#238636] hover:bg-[#2ea043] text-white rounded-md shadow transition-colors"
              >
                {taskToEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
