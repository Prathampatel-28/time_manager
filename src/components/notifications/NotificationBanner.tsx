import React from 'react';
import { Bell, ShieldCheck, X, AlertTriangle } from 'lucide-react';
import { getNotificationPermissionStatus, requestNotificationPermission } from '../../services/notifications';

interface NotificationBannerProps {
  onRequestPermission: () => void;
  onDismiss: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  onRequestPermission,
  onDismiss,
}) => {
  const permStatus = getNotificationPermissionStatus();

  if (permStatus === 'granted' || permStatus === 'unsupported') {
    return null;
  }

  if (permStatus === 'denied') {
    return (
      <div className="gradient-card p-4 rounded-2xl border border-amber-500/40 dark:border-amber-500/40 bg-amber-500/10 shadow-lg flex items-center justify-between gap-4 mb-6 animate-in fade-in duration-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-500 dark:text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Notifications Blocked in Browser</span>
            </h4>
            <p className="text-[11px] text-slate-700 dark:text-slate-300">
              Browser push reminders are blocked. To re-enable: click the 🔒 lock icon next to the URL address bar, find <strong>Notifications</strong>, set it to <strong>Allow</strong>, and refresh the page.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg shrink-0"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="gradient-card p-4 rounded-2xl border border-teal-500/40 shadow-lg flex items-center justify-between gap-4 mb-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl border border-teal-500/30 shrink-0">
          <Bell className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span>Enable Browser Push Reminders</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Get push alerts before scheduled tasks and class periods (at custom offsets like 10m before).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={async () => {
            const res = await requestNotificationPermission();
            if (res === 'granted') {
              onRequestPermission();
            }
          }}
          className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow transition-all active:scale-95"
        >
          Enable 🔔
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

