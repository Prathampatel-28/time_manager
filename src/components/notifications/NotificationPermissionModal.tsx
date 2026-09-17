import React from 'react';
import { Bell, ShieldCheck, X } from 'lucide-react';
import { requestNotificationPermission } from '../../services/notifications';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted,
}) => {
  if (!isOpen) return null;

  const handleEnable = async () => {
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      onPermissionGranted();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-gradient-to-br dark:from-[#1e293b] dark:via-[#111827] dark:to-[#0f172a] border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-slate-100 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
            <Bell className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Never Miss a Scheduled Task</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Timely Push Reminders for your Schedule</p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Chronos can alert you <strong>10 minutes before</strong> (or at your custom offset) your lectures, exams, and daily tasks start.
            </p>
          </div>
          <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 pl-1 text-[11px]">
            <li>100% Offline local notification triggers</li>
            <li>Customizable offset per task (5m, 10m, 30m, 1h)</li>
            <li>Easily mute timetable periods or specific categories in Settings</li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={handleEnable}
            className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
          >
            Enable Reminders 🔔
          </button>
        </div>
      </div>
    </div>
  );
};
