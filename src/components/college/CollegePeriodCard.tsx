import React from 'react';
import type { CollegePeriod } from '../../types';
import { Clock, Building2, User } from 'lucide-react';

interface CollegePeriodCardProps {
  period: CollegePeriod;
  compact?: boolean;
}

export const CollegePeriodCard: React.FC<CollegePeriodCardProps> = ({
  period,
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="p-2.5 bg-white/95 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 rounded-xl text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{period.subject}</span>
          <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">{period.startTime}</span>
        </div>
        {period.room && (
          <span className="text-[11px] text-slate-600 dark:text-slate-400">{period.room}</span>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-white/95 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 hover:border-indigo-500/50 transition-all shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{period.subject}</span>
        {period.type && (
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/30">
            {period.type}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1 font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
          <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          {period.startTime} - {period.endTime}
        </span>
        {period.room && (
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {period.room}
          </span>
        )}
      </div>

      {period.professor && (
        <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-600 dark:text-slate-400">
          <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          {period.professor}
        </div>
      )}
    </div>
  );
};
