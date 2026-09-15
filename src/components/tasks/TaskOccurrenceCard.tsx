import React, { useState } from 'react';
import type { Task, Occurrence, OccurrenceStatus } from '../../types';
import { 
  CheckCircle2, 
  Circle, 
  Slash, 
  Trash2, 
  RotateCcw, 
  Star, 
  FileText 
} from 'lucide-react';

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
        className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-all ${
          isDone
            ? 'bg-[#1f883d]/10 border-[#238636]/40'
            : isSkipped
            ? 'bg-[#21262d]/40 border-[#30363d] opacity-75'
            : 'bg-[#0d1117] border-[#30363d] hover:border-[#58a6ff]/40'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onToggleDone(task.id, dateStr)}
            className="transition-transform active:scale-90"
          >
            {isDone ? (
              <CheckCircle2 className="w-5 h-5 text-[#3fb950] fill-[#238636]/30" />
            ) : isSkipped ? (
              <Slash className="w-5 h-5 text-[#8b949e]" />
            ) : (
              <Circle className="w-5 h-5 text-[#8b949e] hover:text-[#58a6ff]" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <span
              className={`text-xs font-semibold block truncate ${
                isDone
                  ? 'line-through text-[#8b949e]'
                  : isSkipped
                  ? 'line-through text-[#6e7681]'
                  : 'text-[#f0f6fc]'
              }`}
            >
              {occurrence?.overrideTitle || task.title}
            </span>
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
              className="text-[11px] text-[#8b949e] hover:text-[#e3b341] transition-colors"
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
          ? 'bg-[#1f883d]/10 border-[#238636]/40'
          : isSkipped
          ? 'bg-[#21262d]/40 border-[#30363d] opacity-75'
          : task.isHighlighted
          ? 'bg-[#d29922]/10 border-[#d29922]/50'
          : 'bg-[#0d1117] border-[#30363d] hover:border-[#58a6ff]/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Checkbox and Task Details */}
        <div className="flex items-start gap-3 flex-1">
          <button
            type="button"
            onClick={() => onToggleDone(task.id, dateStr)}
            className="mt-0.5 transition-transform active:scale-90 shrink-0"
          >
            {isDone ? (
              <CheckCircle2 className="w-5 h-5 text-[#3fb950] fill-[#238636]/30" />
            ) : isSkipped ? (
              <Slash className="w-5 h-5 text-[#8b949e]" />
            ) : (
              <Circle className="w-5 h-5 text-[#8b949e] hover:text-[#58a6ff]" />
            )}
          </button>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-bold ${
                  isDone
                    ? 'line-through text-[#8b949e]'
                    : isSkipped
                    ? 'line-through text-[#6e7681]'
                    : 'text-[#f0f6fc]'
                }`}
              >
                {occurrence?.overrideTitle || task.title}
              </span>

              {task.isHighlighted && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#e3b341] bg-[#d29922]/20 px-2 py-0.5 rounded border border-[#d29922]/40">
                  <Star className="w-2.5 h-2.5 fill-[#e3b341]" /> Important
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
                <span className="text-[10px] font-medium text-[#8b949e] bg-[#21262d] px-2 py-0.5 rounded border border-[#30363d]">
                  Skipped (Preserves Streak)
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-xs text-[#8b949e] line-clamp-2">{task.description}</p>
            )}

            {occurrence?.notes && (
              <div className="mt-2 text-xs bg-[#21262d]/60 border border-[#30363d] rounded p-2 text-[#8b949e] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#58a6ff] shrink-0" />
                <span>{occurrence.notes}</span>
              </div>
            )}

            {/* Subtasks checklist */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-[#30363d]/60 space-y-1.5">
                {task.subtasks.map(sub => {
                  const doneSubs = occurrence?.completedSubtaskIds || [];
                  const isSubDone = doneSubs.includes(sub.id);

                  return (
                    <label
                      key={sub.id}
                      className="flex items-center gap-2 text-xs text-[#8b949e] cursor-pointer hover:text-[#c9d1d9]"
                      onClick={e => handleSubtaskToggle(sub.id, e)}
                    >
                      <input
                        type="checkbox"
                        checked={isSubDone}
                        readOnly
                        className="rounded border-[#30363d] bg-[#0d1117] text-[#238636] focus:ring-0"
                      />
                      <span className={isSubDone ? 'line-through text-[#6e7681]' : ''}>
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
              className="p-1.5 text-[#8b949e] hover:text-[#e3b341] hover:bg-[#21262d] rounded transition-colors"
            >
              <Slash className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onReset(task.id, dateStr)}
              title="Restore task occurrence"
              className="p-1.5 text-[#58a6ff] hover:bg-[#21262d] rounded transition-colors"
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
            className="p-1.5 text-[#8b949e] hover:text-[#58a6ff] hover:bg-[#21262d] rounded transition-colors"
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
            className="p-1.5 text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline Note Editing */}
      {isEditingNote && (
        <div className="mt-3 pt-3 border-t border-[#30363d] space-y-2">
          <input
            type="text"
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            placeholder="Add specific note for this date..."
            className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-xs text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditingNote(false)}
              className="px-2.5 py-1 text-xs text-[#8b949e] hover:text-[#c9d1d9]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNote}
              className="px-3 py-1 text-xs bg-[#238636] hover:bg-[#2ea043] text-white rounded font-medium"
            >
              Save Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
