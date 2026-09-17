import React, { useState, useEffect } from 'react';
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
  BarChart2,
  Bell,
  BellOff,
  Send,
  Check,
  DownloadCloud
} from 'lucide-react';
import { HEATMAP_THEMES } from '../../utils/theme';
import type { HeatmapTheme, ThemeMode, TaskCategory } from '../../types';
import { getNotificationPermissionStatus } from '../../services/notifications';
import { NotificationPermissionModal } from '../notifications/NotificationPermissionModal';

interface NavbarProps {
  onOpenNewTaskModal: () => void;
}

const CATEGORY_LIST: TaskCategory[] = [
  'College',
  'Study',
  'Coding',
  'Health',
  'Habit',
  'Personal',
  'Work',
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewTaskModal }) => {
  const { 
    activeView, 
    setActiveView, 
    settings, 
    updateSettings, 
    streakStats, 
    resetToDemoData, 
    exportDataJSON, 
    importDataJSON,
    triggerTestNotification
  } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'data'>('general');
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // PWA Installation State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const notifSettings = settings.notificationSettings || {
    enabled: true,
    permissionRequested: false,
    defaultOffsetMinutes: 10,
    muteCollegePeriods: false,
    mutedCategories: [],
  };

  const timetableConfig = settings.timetableConfig || { id: 'tt-default', name: 'College Timetable', type: 'College' as const, enabled: true };

  const permissionStatus = getNotificationPermissionStatus();

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

  const handleTestNotification = async () => {
    if (permissionStatus !== 'granted') {
      setIsPermissionModalOpen(true);
      return;
    }
    const sent = await triggerTestNotification();
    if (sent) {
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3000);
    }
  };

  const toggleCategoryMute = (cat: string) => {
    const currentMuted = notifSettings.mutedCategories || [];
    const nextMuted = currentMuted.includes(cat)
      ? currentMuted.filter(c => c !== cat)
      : [...currentMuted, cat];

    updateSettings({
      notificationSettings: {
        ...notifSettings,
        mutedCategories: nextMuted,
      },
    });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stats', label: 'Stats', icon: BarChart2 },
    { id: 'agenda', label: 'Today / Agenda', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'college', label: timetableConfig.name || 'Timetable', icon: GraduationCap },
    { id: 'tasks', label: 'All Tasks', icon: ListTodo },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-3 sm:px-6 lg:px-8 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
            onClick={() => setActiveView('dashboard')}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-1 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <img src="/favicon.svg" className="w-full h-full object-contain" alt="Chronos Logo" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">Chronos</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400 rounded-md border border-slate-200 dark:border-slate-700/60 font-semibold">
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700/60 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: PWA Install, Streak, New Task, Theme, Backup & Export, Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Install Desktop App Button */}
          {deferredPrompt && !isAppInstalled && (
            <button
              type="button"
              onClick={handleInstallApp}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-900/20 transition-all active:scale-95 shrink-0"
              title="Install Chronos Tracker as Standalone Desktop/Mobile App"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Install App</span>
            </button>
          )}

          {/* Active Streak Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs shrink-0">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            <span className="font-bold text-slate-900 dark:text-slate-100">{streakStats.currentStreak}</span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px] hidden lg:inline">streak</span>
          </div>

          {/* + New Task Button */}
          <button
            type="button"
            onClick={onOpenNewTaskModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>

          {/* 2-Theme Switcher Button */}
          <button
            type="button"
            onClick={() => {
              const mode = settings.themeMode || settings.theme;
              const isCurrentlyLight = mode === 'light' || mode === 'light-gradient';
              const nextMode: ThemeMode = isCurrentlyLight ? 'dark' : 'light';
              updateSettings({ 
                themeMode: nextMode,
                theme: nextMode
              });
            }}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl border border-slate-300 dark:border-slate-700/50 transition-all shrink-0"
            title={`Current Theme: ${settings.themeMode || settings.theme}. Click to toggle theme.`}
          >
            {(settings.themeMode === 'light' || settings.theme === 'light') ? (
              <Sun className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {/* Direct Backup & Export Button */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('data');
              setIsSettingsOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700/60 shadow-sm transition-all shrink-0"
            title="Backup & Export (JSON Data Backup & Restore)"
          >
            <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="hidden md:inline">Backup & Export</span>
          </button>

          {/* Settings / Config Modal Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl border border-slate-300 dark:border-slate-700/50 transition-all shrink-0"
            title="Settings & Notifications"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden flex items-center justify-around pt-2 mt-2 border-t border-slate-200 dark:border-slate-800/60 text-xs">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center gap-1 p-1 rounded-lg transition-colors ${
                isActive ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-500 dark:text-slate-400'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-gradient-to-br dark:from-[#1e293b] dark:via-[#111827] dark:to-[#0f172a] border border-slate-200 dark:border-slate-700/70 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Chronos Settings Panel
              </h2>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'general'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Theme & General
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Bell className="w-3.5 h-3.5" /> Reminders & Notifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('data')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'data'
                    ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Backup & Data
              </button>
            </div>

            {/* TAB 1: General & Theme & Timetable Settings */}
            {activeTab === 'general' && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Theme Mode Selector (Exactly Two Themes) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    UI Theme Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'dark', label: 'Dark Theme', icon: Moon },
                      { id: 'light', label: 'Light Theme', icon: Sun },
                    ].map(m => {
                      const Icon = m.icon;
                      const mode = settings.themeMode || settings.theme;
                      const isCurrentlyLight = mode === 'light' || mode === 'light-gradient';
                      const isSel = (m.id === 'light' && isCurrentlyLight) || (m.id === 'dark' && !isCurrentlyLight);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            updateSettings({
                              themeMode: m.id as ThemeMode,
                              theme: m.id as 'dark' | 'light',
                            });
                          }}
                          className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all ${
                            isSel
                              ? 'bg-teal-500/20 border-teal-500/60 text-teal-700 dark:text-teal-300 shadow-md font-bold'
                              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Timetable Configuration */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Timetable Configuration</span>
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Timetable Type
                      </label>
                      <select
                        value={timetableConfig.type || 'College'}
                        onChange={e => {
                          const newType = e.target.value as any;
                          const defaultName = newType === 'Custom' ? 'Custom Timetable' : `${newType} Timetable`;
                          updateSettings({
                            timetableConfig: {
                              id: timetableConfig.id || 'tt-default',
                              type: newType,
                              name: timetableConfig.name ? timetableConfig.name : defaultName,
                              enabled: true,
                            },
                          });
                        }}
                        className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200"
                      >
                        <option value="College">College</option>
                        <option value="School">School</option>
                        <option value="Work">Work</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={timetableConfig.name}
                        onChange={e =>
                          updateSettings({
                            timetableConfig: {
                              id: timetableConfig.id || 'tt-default',
                              type: timetableConfig.type || 'College',
                              name: e.target.value,
                              enabled: true,
                            },
                          })
                        }
                        placeholder="e.g. College Timetable"
                        className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Streak Qualification Rule */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Streak Qualification Rule
                  </label>
                  <select
                    value={settings.streakCalculationMode}
                    onChange={e =>
                      updateSettings({ streakCalculationMode: e.target.value as any })
                    }
                    className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200"
                  >
                    <option value="all_completed">
                      100% Completion (All scheduled tasks must be done)
                    </option>
                    <option value="at_least_one">
                      Active Day (At least 1 task completed counts)
                    </option>
                  </select>
                </div>

                {/* Heatmap Theme */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Heatmap Palette
                  </label>
                  <select
                    value={settings.heatmapTheme}
                    onChange={e =>
                      updateSettings({ heatmapTheme: e.target.value as HeatmapTheme })
                    }
                    className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200"
                  >
                    {Object.values(HEATMAP_THEMES).map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* TAB 2: Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Global Notification Toggle */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {notifSettings.enabled ? (
                      <Bell className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    ) : (
                      <BellOff className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block">
                        Browser Push Reminders
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {notifSettings.enabled ? 'Global push alerts enabled' : 'Push alerts currently disabled'}
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifSettings.enabled}
                      onChange={e => {
                        if (e.target.checked && permissionStatus !== 'granted') {
                          setIsPermissionModalOpen(true);
                        }
                        updateSettings({
                          notificationSettings: {
                            ...notifSettings,
                            enabled: e.target.checked,
                          },
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                  </label>
                </div>

                {/* Permission Status */}
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Browser Permission:</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold ${
                      permissionStatus === 'granted'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                        : permissionStatus === 'denied'
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                    }`}>
                      {permissionStatus.toUpperCase()}
                    </span>
                    {permissionStatus !== 'granted' && (
                      <button
                        type="button"
                        onClick={() => setIsPermissionModalOpen(true)}
                        className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        Request
                      </button>
                    )}
                  </div>
                </div>

                {/* Default Reminder Offset */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Default Task Reminder Offset
                  </label>
                  <select
                    value={notifSettings.defaultOffsetMinutes}
                    onChange={e =>
                      updateSettings({
                        notificationSettings: {
                          ...notifSettings,
                          defaultOffsetMinutes: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200"
                  >
                    <option value={0}>At scheduled time (0 min before)</option>
                    <option value={5}>5 minutes before</option>
                    <option value={10}>10 minutes before (Default)</option>
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                    <option value={60}>1 hour before</option>
                  </select>
                </div>

                {/* Timetable Periods Mute Toggle */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block">
                        Mute {timetableConfig.name || 'Timetable'} Periods
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Suppress reminders for period schedules separately from personal tasks
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={notifSettings.muteCollegePeriods}
                      onChange={e =>
                        updateSettings({
                          notificationSettings: {
                            ...notifSettings,
                            muteCollegePeriods: e.target.checked,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                {/* Category Level Mutes */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Mute Reminders per Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORY_LIST.map(cat => {
                      const isMuted = (notifSettings.mutedCategories || []).includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategoryMute(cat)}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                            isMuted
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold'
                              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <span>{cat}</span>
                          <span className="text-[10px] font-bold">
                            {isMuted ? 'MUTED' : 'ACTIVE'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Send Test Notification Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                  >
                    {testNotificationSent ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-200" /> Sent Test Notification!
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Send Test Push Notification 🔔
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Backup & Export */}
            {activeTab === 'data' && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* JSON Backup (Restore Data) */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-teal-600 dark:text-teal-400" /> JSON Backup & Restore
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      FULL BACKUP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Export your complete local database (tasks, occurrences, habits, timetable schedule, and settings) as a JSON file, or restore a previously saved backup file.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleExport}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Export Backup
                    </button>

                    <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors shadow-sm cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Restore Backup
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Clear All Data */}
                <div className="pt-2">
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
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/30 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Clear All Data (Clean App State)
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 text-right border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      <NotificationPermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        onPermissionGranted={() => {
          updateSettings({
            notificationSettings: {
              ...notifSettings,
              enabled: true,
              permissionRequested: true,
            },
          });
        }}
      />
    </header>
  );
};
