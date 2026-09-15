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
      <div className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#f0f6fc] truncate">{period.subject}</span>
          <span className="text-[10px] font-mono text-[#58a6ff]">{period.startTime}</span>
        </div>
        {period.room && (
          <span className="text-[11px] text-[#8b949e]">{period.room}</span>
        )}
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff]/50 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#f0f6fc]">{period.subject}</span>
        {period.type && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#21262d] text-[#58a6ff] font-medium">
            {period.type}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs text-[#8b949e]">
        <span className="flex items-center gap-1 font-mono text-[#f0f6fc]">
          <Clock className="w-3.5 h-3.5 text-[#58a6ff]" />
          {period.startTime} - {period.endTime}
        </span>
        {period.room && (
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#3fb950]" />
            {period.room}
          </span>
        )}
      </div>

      {period.professor && (
        <div className="flex items-center gap-1 mt-1 text-[11px] text-[#6e7681]">
          <User className="w-3 h-3" />
          {period.professor}
        </div>
      )}
    </div>
  );
};
