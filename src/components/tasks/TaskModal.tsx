import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Star, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Repeat,
  Bell
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
  const { saveTask, deleteTask, settings } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Habit');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Time & Reminder
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reminderOffsetMinutes, setReminderOffsetMinutes] = useState(10);

  // Recurrence
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [targetDate, setTargetDate] = useState(() => defaultDate || toDateString(new Date()));
  const [startDate, setStartDate] = useState(() => defaultDate || toDateString(new Date()));
  const [endDate, setEndDate] = useState('');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([5, 15, 24]);
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

      if (taskToEdit.startTime) {
        setStartTime(taskToEdit.startTime);
        setEndTime(taskToEdit.endTime || '');
      } else {
        setStartTime('');
        setEndTime('');
      }

      setReminderOffsetMinutes(
        taskToEdit.reminderOffsetMinutes ?? settings.notificationSettings?.defaultOffsetMinutes ?? 10
      );

      setRecurrenceType(taskToEdit.recurrence.type);
      setStartDate(taskToEdit.recurrence.startDate);
      setEndDate(taskToEdit.recurrence.endDate || '');
      setTargetDate(taskToEdit.recurrence.targetDate || taskToEdit.recurrence.startDate);
      setSelectedWeekdays(taskToEdit.recurrence.daysOfWeek || [1, 2, 3, 4, 5]);
      setSelectedMonthDays(taskToEdit.recurrence.daysOfMonth || [5, 15, 24]);
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

      setStartTime('');
      setEndTime('');
      setReminderOffsetMinutes(settings.notificationSettings?.defaultOffsetMinutes ?? 10);

      const initDate = defaultDate || toDateString(new Date());
      setTargetDate(initDate);
      setStartDate(initDate);
      setEndDate('');
      setRecurrenceType(defaultDate ? 'none' : 'daily');
      setSelectedWeekdays([1, 2, 3, 4, 5]);
      setSelectedMonthDays([5, 15, 24]);
      setIntervalDays(2);
      setDayOfMonth(1);
      setSubtasks([]);
    }
  }, [taskToEdit, defaultDate, isOpen, settings.notificationSettings?.defaultOffsetMinutes]);

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

  const toggleMonthDay = (day: number) => {
    setSelectedMonthDays(prev =>
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
      startTime: startTime.trim() ? startTime.trim() : undefined,
      endTime: startTime.trim() && endTime.trim() ? endTime.trim() : undefined,
      reminderOffsetMinutes: startTime.trim() ? Number(reminderOffsetMinutes) : undefined,
      recurrence: {
        type: recurrenceType,
        startDate: recurrenceType === 'none' ? targetDate : startDate,
        endDate: endDate ? endDate : undefined,
        targetDate: recurrenceType === 'none' ? targetDate : undefined,
        daysOfWeek: recurrenceType === 'weekly_days' ? selectedWeekdays : undefined,
        daysOfMonth: recurrenceType === 'monthly_dates' ? selectedMonthDays.sort((a, b) => a - b) : undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-[#161b22] border border-slate-200 dark:border-[#30363d] rounded-xl shadow-2xl overflow-hidden text-slate-900 dark:text-[#c9d1d9]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#30363d] bg-slate-50 dark:bg-[#0d1117]">
          <h2 className="text-lg font-bold text-slate-900 dark:text-[#f0f6fc]">
            {taskToEdit ? 'Edit Task or Event' : 'Create New Task or Event'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 dark:text-[#8b949e] hover:text-slate-700 dark:hover:text-[#f0f6fc] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-[#8b949e] uppercase tracking-wider mb-1.5">
                Task / Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Solve 2 LeetCode Problems, Morning Workout, Midterm Exam..."
                required
                className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-[#30363d] rounded-lg px-3.5 py-2 text-sm text-slate-900 dark:text-[#f0f6fc] placeholder-slate-400 dark:placeholder-[#6e7681] focus:outline-none focus:border-teal-500 dark:focus:border-[#58a6ff]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-[#8b949e] uppercase tracking-wider mb-1.5">
                Description / Notes (Optional)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add instructions, checklist notes, resources..."
                rows={2}
                className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-[#30363d] rounded-lg px-3.5 py-2 text-xs text-slate-900 dark:text-[#c9d1d9] placeholder-slate-400 dark:placeholder-[#6e7681] focus:outline-none focus:border-teal-500 dark:focus:border-[#58a6ff] resize-none"
              />
            </div>

            {/* Category and Color Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-[#8b949e] uppercase tracking-wider mb-1.5">
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
                    className="w-full bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-[#30363d] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-[#c9d1d9] focus:outline-none focus:border-teal-500 dark:focus:border-[#58a6ff]"
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
                      className="flex-1 bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-[#30363d] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-[#c9d1d9] focus:outline-none focus:border-teal-500 dark:focus:border-[#58a6ff]"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomCat(false)}
                      className="px-2 py-1 bg-slate-200 dark:bg-[#21262d] text-slate-700 dark:text-[#8b949e] rounded text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-[#8b949e] uppercase tracking-wider mb-1.5">
                  Color Tag
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-teal-500 dark:ring-white ring-offset-1 ring-offset-white dark:ring-offset-[#161b22]' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Time & Reminder Offset Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-xl">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-[#8b949e] uppercase">
                    Start Time (Opt)
                  </label>
                  {startTime && (
                    <button
                      type="button"
                      onClick={() => { setStartTime(''); setEndTime(''); }}
                      className="text-[10px] text-rose-500 hover:underline font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full bg-white dark:bg-[#161b22] border border-slate-300 dark:border-[#30363d] rounded px-2.5 py-1 text-xs text-slate-900 dark:text-[#f0f6fc]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#8b949e] uppercase mb-1">
                  End Time (Opt)
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full bg-white dark:bg-[#161b22] border border-slate-300 dark:border-[#30363d] rounded px-2.5 py-1 text-xs text-slate-900 dark:text-[#f0f6fc]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#8b949e] uppercase mb-1 flex items-center gap-1">
                  <Bell className="w-3 h-3 text-teal-600 dark:text-teal-400" /> Reminder Offset
                </label>
                <select
                  value={reminderOffsetMinutes}
                  onChange={e => setReminderOffsetMinutes(Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#161b22] border border-slate-300 dark:border-[#30363d] rounded px-2 py-1 text-xs text-slate-900 dark:text-[#f0f6fc]"
                >
                  <option value={0}>At start time</option>
                  <option value={5}>5 mins before</option>
                  <option value={10}>10 mins before</option>
                  <option value={15}>15 mins before</option>
                  <option value={30}>30 mins before</option>
                  <option value={60}>1 hour before</option>
                </select>
              </div>
            </div>

            {/* Highlight Flag */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-xl">
              <div className="flex items-center gap-2">
                <Star className={`w-4 h-4 ${isHighlighted ? 'text-amber-500 fill-amber-500' : 'text-slate-400 dark:text-[#8b949e]'}`} />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-[#f0f6fc]">Highlight / Milestone Task</p>
                  <p className="text-[11px] text-slate-500 dark:text-[#8b949e]">Exams, deadlines, high-priority targets</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isHighlighted}
                onChange={e => setIsHighlighted(e.target.checked)}
                className="w-4 h-4 accent-teal-600 dark:accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Recurrence Pattern Controls */}
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Repeat className="w-4 h-4 text-teal-600 dark:text-[#58a6ff]" />
                <span className="text-xs font-semibold text-slate-900 dark:text-[#f0f6fc] uppercase tracking-wider">
                  Recurrence Schedule
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                {[
                  { type: 'none', label: 'One-time' },
                  { type: 'daily', label: 'Daily' },
                  { type: 'weekly_days', label: 'Weekly Days' },
                  { type: 'monthly', label: 'Monthly' },
                  { type: 'monthly_dates', label: 'Specific Dates' },
                  { type: 'interval', label: 'Custom Interval' },
                ].map(r => (
                  <button
                    key={r.type}
                    type="button"
                    onClick={() => setRecurrenceType(r.type as RecurrenceType)}
                    className={`py-1.5 px-2 rounded-md text-xs font-medium border transition-colors ${
                      recurrenceType === r.type
                        ? 'bg-teal-600 dark:bg-[#1f6feb] border-teal-600 dark:border-[#1f6feb] text-white'
                        : 'bg-white dark:bg-[#161b22] border-slate-300 dark:border-[#30363d] text-slate-700 dark:text-[#8b949e] hover:border-slate-400 dark:hover:border-[#8b949e]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Target Date for One-Time */}
              {recurrenceType === 'none' && (
                <div className="pt-2">
                  <label className="block text-[11px] text-slate-600 dark:text-[#8b949e] mb-1">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="w-full bg-white dark:bg-[#161b22] border border-slate-300 dark:border-[#30363d] rounded px-2.5 py-1 text-xs text-slate-900 dark:text-[#f0f6fc]"
                  />
                </div>
              )}

              {/* Weekly Day Selector */}
              {recurrenceType === 'weekly_days' && (
                <div className="pt-2 space-y-1.5">
                  <label className="block text-[11px] text-slate-600 dark:text-[#8b949e]">Select Repeat Days</label>
                  <div className="flex gap-1.5">
                    {WEEKDAY_NAMES.map(w => {
                      const isSelected = selectedWeekdays.includes(w.day);
                      return (
                        <button
                          key={w.day}
                          type="button"
                          onClick={() => toggleWeekday(w.day)}
                          className={`flex-1 py-1 rounded text-xs font-semibold border transition-colors ${
                            isSelected
                              ? 'bg-teal-600 dark:bg-[#238636] border-teal-600 dark:border-[#238636] text-white'
                              : 'bg-white dark:bg-[#161b22] border-slate-300 dark:border-[#30363d] text-slate-700 dark:text-[#8b949e]'
                          }`}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Monthly Day Selector */}
              {recurrenceType === 'monthly' && (
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-[#8b949e]">Repeat on day</span>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dayOfMonth}
                    onChange={e => setDayOfMonth(Number(e.target.value))}
                    className="w-16 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-[#30363d] rounded px-2 py-1 text-xs text-slate-900 dark:text-[#f0f6fc] text-center"
                  />
                  <span className="text-xs text-slate-600 dark:text-[#8b949e]">of every month</span>
                </div>
              )}

              {/* Specific Dates (Month Days 1-31 Multi-Select Grid) */}
              {recurrenceType === 'monthly_dates' && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] text-slate-600 dark:text-[#8b949e]">
                      Select Month-Day Numbers (1–31):
                    </label>
                    <span className="text-[11px] font-mono font-semibold text-teal-600 dark:text-[#58a6ff]">
                      {selectedMonthDays.length > 0 ? `Selected: ${selectedMonthDays.join(', ')}` : 'None selected'}
                    </span>
                  </div>

                  <div className="grid grid-cols-7 sm:grid-cols-11 gap-1 pt-1">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(dayNum => {
                      const isSelected = selectedMonthDays.includes(dayNum);
                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => toggleMonthDay(dayNum)}
                          className={`h-7 rounded text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-teal-600 dark:bg-[#238636] border-teal-600 dark:border-[#238636] text-white shadow-xs scale-105'
                              : 'bg-white dark:bg-[#161b22] border-slate-300 dark:border-[#30363d] text-slate-700 dark:text-[#8b949e] hover:border-slate-400 dark:hover:border-[#8b949e]'
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-[#8b949e] pt-1">
                    💡 <strong>Edge Case Note:</strong> For months with fewer days (e.g. Feb with 28/29 days), selected dates exceeding the month length automatically shift to the last day of that month.
                  </p>
                </div>
              )}

              {/* Interval Days Selector */}
              {recurrenceType === 'interval' && (
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-[#8b949e]">Repeat every</span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={intervalDays}
                    onChange={e => setIntervalDays(Number(e.target.value))}
                    className="w-20 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-[#30363d] rounded px-2.5 py-1 text-xs text-slate-900 dark:text-[#f0f6fc] text-center"
                  />
                  <span className="text-xs text-slate-600 dark:text-[#8b949e]">days</span>
                </div>
              )}

              {/* Start and Optional End Date for Recurring */}
              {recurrenceType !== 'none' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-[#30363d]/60">
                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-[#8b949e] mb-1">Effective From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-white dark:bg-[#161b22] border border-slate-300 dark:border-[#30363d] rounded px-2.5 py-1 text-xs text-slate-900 dark:text-[#f0f6fc]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-[#8b949e] mb-1">Until (Optional)</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      placeholder="Forever"
                      className="w-full bg-white dark:bg-[#161b22] border border-slate-300 dark:border-[#30363d] rounded px-2.5 py-1 text-xs text-slate-900 dark:text-[#f0f6fc]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Subtasks (Optional partial completion) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-[#8b949e] uppercase tracking-wider mb-2">
                Sub-steps / Checklist (Optional)
              </label>
              
              <div className="space-y-2 mb-2">
                {subtasks.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-md text-xs">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-3.5 h-3.5 text-teal-600 dark:text-[#58a6ff]" />
                      <span>{sub.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(sub.id)}
                      className="text-slate-400 dark:text-[#8b949e] hover:text-rose-600 dark:hover:text-[#f85149]"
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
                  className="flex-1 bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-[#c9d1d9] focus:outline-none focus:border-teal-500 dark:focus:border-[#58a6ff]"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-[#21262d] hover:bg-slate-300 dark:hover:bg-[#30363d] text-slate-800 dark:text-[#c9d1d9] rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-[#30363d] bg-slate-50 dark:bg-[#0d1117]">
            {taskToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-[#f85149] hover:bg-rose-500/10 rounded-md transition-colors"
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
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-[#8b949e] hover:text-slate-900 dark:hover:text-[#c9d1d9] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-emerald-600 dark:bg-[#238636] hover:bg-emerald-500 dark:hover:bg-[#2ea043] text-white rounded-md shadow transition-colors"
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
