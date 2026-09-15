import React from 'react';
import { useApp } from '../../context/AppContext';
import { HEATMAP_THEMES } from '../../utils/theme';
import type { HeatmapTheme } from '../../types';
import { Filter, Palette } from 'lucide-react';

interface HeatmapControlsProps {
  dateRange: '3m' | '6m' | '1y';
  setDateRange: (range: '3m' | '6m' | '1y') => void;
}

export const HeatmapControls: React.FC<HeatmapControlsProps> = ({
  dateRange,
  setDateRange,
}) => {
  const { 
    tasks, 
    settings, 
    updateSettings, 
    heatmapFilter, 
    setHeatmapFilter 
  } = useApp();

  // Extract unique categories
  const categories = Array.from(new Set(tasks.map(t => t.category))).filter(Boolean);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 bg-[#161b22] border border-[#30363d] rounded-lg">
      {/* Left: Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter Type & Entity Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#8b949e]" />
          <span className="text-xs text-[#8b949e] font-medium hidden sm:inline">View:</span>
          
          <select
            value={
              heatmapFilter.type === 'all'
                ? 'all'
                : `${heatmapFilter.type}:${heatmapFilter.value}`
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'all') {
                setHeatmapFilter({ type: 'all', value: 'all' });
              } else if (val.startsWith('cat:')) {
                setHeatmapFilter({ type: 'category', value: val.replace('cat:', '') });
              } else if (val.startsWith('task:')) {
                setHeatmapFilter({ type: 'task', value: val.replace('task:', '') });
              }
            }}
            className="bg-[#0d1117] text-xs text-[#c9d1d9] border border-[#30363d] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#58a6ff] cursor-pointer"
          >
            <option value="all">🌟 All Tasks (Aggregate)</option>
            <optgroup label="Categories">
              {categories.map(cat => (
                <option key={`cat-${cat}`} value={`cat:${cat}`}>
                  📁 {cat}
                </option>
              ))}
            </optgroup>
            <optgroup label="Single Tasks">
              {tasks.map(task => (
                <option key={`task-${task.id}`} value={`task:${task.id}`}>
                  {task.isHighlighted ? '⭐ ' : '• '} {task.title}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setDateRange('3m')}
            className={`px-2.5 py-1 rounded transition-colors ${
              dateRange === '3m'
                ? 'bg-[#21262d] text-[#f0f6fc] font-semibold'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            3 Months
          </button>
          <button
            type="button"
            onClick={() => setDateRange('6m')}
            className={`px-2.5 py-1 rounded transition-colors ${
              dateRange === '6m'
                ? 'bg-[#21262d] text-[#f0f6fc] font-semibold'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            6 Months
          </button>
          <button
            type="button"
            onClick={() => setDateRange('1y')}
            className={`px-2.5 py-1 rounded transition-colors ${
              dateRange === '1y'
                ? 'bg-[#21262d] text-[#f0f6fc] font-semibold'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            1 Year
          </button>
        </div>
      </div>

      {/* Right: Theme Picker */}
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-[#8b949e]" />
        <span className="text-xs text-[#8b949e] font-medium hidden sm:inline">Theme:</span>
        <select
          value={settings.heatmapTheme}
          onChange={(e) => updateSettings({ heatmapTheme: e.target.value as HeatmapTheme })}
          className="bg-[#0d1117] text-xs text-[#c9d1d9] border border-[#30363d] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#58a6ff] cursor-pointer"
        >
          {Object.values(HEATMAP_THEMES).map(theme => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
