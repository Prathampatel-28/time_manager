import React, { useState } from 'react';
import type { Task, Occurrence, OccurrenceStatus } from '../../types';
import { 
  CheckCircle2, 
  Circle, 
  Slash, 
  Trash2, 
  RotateCcw, 
  Star, 
  FileText,
  Clock,
  Bell
} from 'lucide-react';
import { isTaskActionableForDate } from '../../services/recurrence';

interface TaskOccurrenceCardProps {
  task: Task;
  occurrence?: Occurrence;
  status: OccurrenceStatus;
  dateStr: string;
  onToggleDone: (taskId: string, dateStr: string) => void;
  onSkip: (taskId: string, dateStr: string, note?: string) => void;
  onReset: (taskId: string, dateStr: string) => void;
  onRemove: (taskId: string, dateStr: string) => void;
  onSaveOccurrence: (occurrence: Occurrence) => void;
  compact?: boolean;
}

/**
 * Format 24h "HH:MM" into 12h format e.g. "09:30" -> "9:30 AM", "14:15" -> "2:15 PM"
 */
function formatTime12h(timeStr?: string): string | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${ampm}`;
}

export const TaskOccurrenceCard: React.FC<TaskOccurrenceCardProps> = ({
  task,
  occurrence,
  status,
  dateStr,
  onToggleDone,
  onSkip,
  onReset,
  onRemove,
  onSaveOccurrence,
  compact = false,
}) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(occurrence?.notes || '');

  const isDone = status === 'done';
  const isSkipped = status === 'skipped';
  const isHighlighted = occurrence?.isHighlightedOverride ?? task.isHighlighted;

  const startTime12h = formatTime12h(task.startTime);
  const endTime12h = formatTime12h(task.endTime);

  const isActionable = isTaskActionableForDate(task, dateStr);
  const canToggle = isDone || isSkipped || isActionable;

  const handleSaveNote = async () => {
    await onSaveOccurrence({
      ...(occurrence || {
        id: `${task.id}_${dateStr}`,
        taskId: task.id,
        date: dateStr,
        status: 'pending',
      }),
      notes: noteContent,
    });
    setIsEditingNote(false);
  };

  const handleSubtaskToggle = async (subId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const doneSubs = occurrence?.completedSubtaskIds || [];
    const nextSubs = doneSubs.includes(subId)
      ? doneSubs.filter(id => id !== subId)
      : [...doneSubs, subId];

    await onSaveOccurrence({
      ...(occurrence || {
        id: `${task.id}_${dateStr}`,
        taskId: task.id,
        date: dateStr,
        status: 'pending',
      }),
      completedSubtaskIds: nextSubs,
    });
  };

  if (compact) {
    return (
      <div
        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
          isDone
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : isSkipped
            ? 'bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
            : isHighlighted
            ? 'bg-amber-500/10 border-amber-500/40 shadow-xs'
            : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-teal-500/40'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            disabled={!canToggle}
            onClick={() => canToggle && onToggleDone(task.id, dateStr)}
            title={!canToggle ? `Available at ${startTime12h || task.startTime}` : isDone ? 'Mark as pending' : 'Mark as done'}
            className={`transition-transform active:scale-90 ${!canToggle ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {isDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 fill-emerald-500/20" />
            ) : isSkipped ? (
              <Slash className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            ) : (
              <Circle className={`w-5 h-5 ${!canToggle ? 'text-slate-400 dark:text-slate-600' : 'text-slate-400 hover:text-teal-500'}`} />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {isHighlighted && (
                <Star className="w-3.5 h-3.5 text-amber-500 dark:text-[#e3b341] fill-amber-500 dark:fill-[#e3b341] shrink-0" />
              )}
              <span
                className={`text-xs font-semibold truncate ${
                  isDone
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : isSkipped
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : isHighlighted
                    ? 'text-amber-900 dark:text-[#f0f6fc] font-bold'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {occurrence?.overrideTitle || task.title}
              </span>
              {startTime12h && (
                <span className="text-[10px] font-mono text-teal-700 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.2 rounded border border-teal-500/30 shrink-0">
                  {startTime12h}
                </span>
              )}
            </div>
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full inline-block mt-0.5"
              style={{
                backgroundColor: `${task.color}20`,
                color: task.color,
              }}
            >
              {task.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0">
          {!isSkipped && !isDone && (
            <button
              type="button"
              onClick={() => {
                const note = window.prompt('Reason for skipping today (optional):', '');
                onSkip(task.id, dateStr, note || undefined);
              }}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              title="Skip today without losing streak"
            >
              Skip Today
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isDone
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : isSkipped
          ? 'bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'
          : isHighlighted
          ? 'bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-500/10'
          : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800/80 hover:border-teal-500/40 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Checkbox and Task Details */}
        <div className="flex items-start gap-3 flex-1">
          <button
            type="button"
            disabled={!canToggle}
            onClick={() => canToggle && onToggleDone(task.id, dateStr)}
            title={!canToggle ? `Available at ${startTime12h || task.startTime}` : isDone ? 'Mark as pending' : 'Mark as done'}
            className={`mt-0.5 transition-transform active:scale-90 shrink-0 ${!canToggle ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {isDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 fill-emerald-500/20" />
            ) : isSkipped ? (
              <Slash className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            ) : (
              <Circle className={`w-5 h-5 ${!canToggle ? 'text-slate-400 dark:text-slate-600' : 'text-slate-400 hover:text-teal-500'}`} />
            )}
          </button>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-bold ${
                  isDone
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : isSkipped
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {occurrence?.overrideTitle || task.title}
              </span>

              {/* Time Badge if specific time set */}
              {startTime12h && (
                <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-teal-700 dark:text-teal-300 bg-teal-500/15 px-2 py-0.5 rounded-md border border-teal-500/30">
                  <Clock className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                  {startTime12h} {endTime12h ? `- ${endTime12h}` : ''}
                </span>
              )}

              {/* Reminder Offset Badge if specific time */}
              {task.startTime && task.reminderOffsetMinutes !== undefined && (
                <span className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                  <Bell className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                  {task.reminderOffsetMinutes === 0 ? 'At time' : `${task.reminderOffsetMinutes}m before`}
                </span>
              )}

              {!canToggle && !isDone && !isSkipped && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  <Clock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                  Available at {startTime12h || task.startTime}
                </span>
              )}

              {isHighlighted && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                  <Star className="w-2.5 h-2.5 fill-amber-500 dark:fill-amber-400" /> Important
                </span>
              )}

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

              {isSkipped && (
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                  Skipped (Preserves Streak)
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{task.description}</p>
            )}

            {occurrence?.notes && (
              <div className="mt-2 text-xs bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded p-2 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{occurrence.notes}</span>
              </div>
            )}

            {/* Subtasks checklist */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5">
                {task.subtasks.map(sub => {
                  const doneSubs = occurrence?.completedSubtaskIds || [];
                  const isSubDone = doneSubs.includes(sub.id);

                  return (
                    <label
                      key={sub.id}
                      className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                      onClick={e => handleSubtaskToggle(sub.id, e)}
                    >
                      <input
                        type="checkbox"
                        checked={isSubDone}
                        readOnly
                        className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-teal-600 focus:ring-0"
                      />
                      <span className={isSubDone ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                        {sub.title}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 text-xs shrink-0">
          {!isSkipped ? (
            <button
              type="button"
              onClick={() => {
                const note = window.prompt('Reason for skipping (optional):', '');
                onSkip(task.id, dateStr, note || undefined);
              }}
              title="Skip this occurrence without breaking your streak"
              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <Slash className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onReset(task.id, dateStr)}
              title="Restore task occurrence"
              className="p-1.5 text-teal-600 dark:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsEditingNote(!isEditingNote);
              setNoteContent(occurrence?.notes || '');
            }}
            title="Add note for this date"
            className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Remove "${task.title}" for this date only?`)) {
                onRemove(task.id, dateStr);
              }
            }}
            title="Remove occurrence for this date only"
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline Note Editing */}
      {isEditingNote && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <input
            type="text"
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            placeholder="Add specific note for this date..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-teal-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditingNote(false)}
              className="px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNote}
              className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium shadow-sm"
            >
              Save Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
