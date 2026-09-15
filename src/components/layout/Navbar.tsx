import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  GraduationCap, 
  ListTodo, 
  Plus, 
  Moon, 
  Sun, 
  Settings as SettingsIcon, 
  Download, 
  Upload, 
  RotateCcw, 
  X,
  Flame,
  BarChart2
} from 'lucide-react';
import { HEATMAP_THEMES } from '../../utils/theme';
import type { HeatmapTheme } from '../../types';

interface NavbarProps {
  onOpenNewTaskModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewTaskModal }) => {
  const { 
    activeView, 
    setActiveView, 
    settings, 
    updateSettings, 
    streakStats, 
    resetToDemoData, 
    exportDataJSON, 
    importDataJSON 
  } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Handle export
  const handleExport = async () => {
    const json = await exportDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronos-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle import
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await importDataJSON(content);
      if (success) {
        alert('Data imported successfully!');
        setIsSettingsOpen(false);
      } else {
        alert('Failed to import data. Please verify the JSON backup format.');
      }
    };
    reader.readAsText(file);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stats', label: 'Stats', icon: BarChart2 },
    { id: 'agenda', label: 'Today / Agenda', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'college', label: 'College Timetable', icon: GraduationCap },
    { id: 'tasks', label: 'All Tasks', icon: ListTodo },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-[#161b22]/95 backdrop-blur-md border-b border-[#30363d] px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => setActiveView('dashboard')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#238636] to-[#3fb950] flex items-center justify-center text-white font-black shadow-md shadow-[#238636]/30">
              <span className="text-base font-mono">C</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-[#f0f6fc] tracking-tight">Chronos</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#21262d] text-[#58a6ff] rounded border border-[#30363d]">
                  Tracker
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#21262d] text-[#f0f6fc] shadow-xs'
                      : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#58a6ff]' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Streaks, New Task, Settings */}
        <div className="flex items-center gap-3">
          {/* Active Streak Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs">
            <Flame className="w-4 h-4 text-[#f0883e] fill-[#f0883e]" />
            <span className="font-bold text-[#f0f6fc]">{streakStats.currentStreak}</span>
            <span className="text-[#8b949e] text-[11px]">streak</span>
          </div>

          {/* + New Task Button */}
          <button
            type="button"
            onClick={onOpenNewTaskModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-lg shadow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>

          {/* Theme Toggle (Dark / Light) */}
          <button
            type="button"
            onClick={() =>
              updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
            }
            className="p-2 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded-lg transition-colors"
            title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings / Config Modal Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded-lg transition-colors"
            title="Settings & Data Tools"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden flex items-center justify-around pt-2.5 mt-2 border-t border-[#30363d]/50 text-xs">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center gap-1 p-1 rounded transition-colors ${
                isActive ? 'text-[#58a6ff] font-bold' : 'text-[#8b949e]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-6 text-[#c9d1d9] space-y-5">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
              <h2 className="text-base font-bold text-[#f0f6fc] flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-[#58a6ff]" /> App Settings & Backup
              </h2>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-[#8b949e] hover:text-[#f0f6fc]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Streak Mode */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                Streak Qualification Rule
              </label>
              <select
                value={settings.streakCalculationMode}
                onChange={e =>
                  updateSettings({ streakCalculationMode: e.target.value as any })
                }
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
              >
                <option value="all_completed">
                  100% Completion (All scheduled tasks must be done)
                </option>
                <option value="at_least_one">
                  Active Day (At least 1 task completed counts)
                </option>
              </select>
              <p className="text-[11px] text-[#6e7681]">
                Days with no tasks scheduled or where tasks were skipped do not break your streak in either mode.
              </p>
            </div>

            {/* Heatmap Color Theme */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                Heatmap Palette
              </label>
              <select
                value={settings.heatmapTheme}
                onChange={e =>
                  updateSettings({ heatmapTheme: e.target.value as HeatmapTheme })
                }
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
              >
                {Object.values(HEATMAP_THEMES).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Backup & Restore */}
            <div className="space-y-2 pt-2 border-t border-[#30363d]">
              <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                Data Management (Offline Local-First)
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#f0f6fc] rounded-lg border border-[#30363d] transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#58a6ff]" /> Export JSON
                </button>

                <label className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#f0f6fc] rounded-lg border border-[#30363d] transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#3fb950]" /> Import JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Clear All Data */}
              <button
                type="button"
                onClick={async () => {
                  if (
                    window.confirm(
                      'Clear all data and reset app state back to clean empty state? All tasks, occurrences, and schedules will be cleared.'
                    )
                  ) {
                    await resetToDemoData();
                    setIsSettingsOpen(false);
                  }
                }}
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#f85149]/10 hover:bg-[#f85149]/20 text-[#f85149] text-xs font-semibold rounded-lg border border-[#f85149]/30 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear All Data (Clean App State)
              </button>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
