import type { DayActivity, NotificationSettings } from '../types';

let swRegistration: ServiceWorkerRegistration | null = null;
const notifiedKeysToday = new Set<string>();
let lastCheckDate = '';

/**
 * Register Service Worker if supported by browser
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      swRegistration = reg;
      return reg;
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  }
  return null;
}

/**
 * Get current browser notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission gracefully
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Send a notification via Service Worker or Web Notifications API
 */
export async function dispatchNotification(
  title: string,
  options: NotificationOptions & { body?: string; icon?: string; tag?: string } = {}
): Promise<boolean> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions = {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    tag: options.tag || 'chronos-reminder',
    ...options,
  };

  try {
    // 1. Try ServiceWorker Registration (Required on Android / Mobile PWA)
    if ('serviceWorker' in navigator) {
      const reg = swRegistration || (await navigator.serviceWorker.ready.catch(() => null));
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    }
    // 2. Standalone Desktop Browser Fallback
    new Notification(title, notificationOptions);
    return true;
  } catch (err) {
    console.warn('Primary notification dispatch failed, trying fallback:', err);
    try {
      new Notification(title, notificationOptions);
      return true;
    } catch (e) {
      console.error('All notification attempts failed:', e);
      return false;
    }
  }
}

/**
 * Send a test notification immediately to confirm working state
 */
export async function sendTestNotification(): Promise<boolean> {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') {
    alert('Notification permission is not granted. Please enable notifications in your browser settings.');
    return false;
  }

  return await dispatchNotification('Chronos Tracker Test Notification 🔔', {
    body: 'Browser push reminders are active! You will be notified before scheduled tasks and college lectures.',
    tag: 'test-notification',
  });
}

/**
 * Helper to parse "HH:MM" 24h time into minutes from midnight
 */
function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

/**
 * Check today's tasks and college periods to trigger notifications when due
 */
export function checkAndTriggerReminders(
  todayActivity: DayActivity | undefined,
  settings: NotificationSettings | undefined
) {
  if (!settings || !settings.enabled) return;
  if (getNotificationPermissionStatus() !== 'granted') return;
  if (!todayActivity) return;

  const now = new Date();
  const dateStr = todayActivity.date;

  // Reset notified set on new day
  if (dateStr !== lastCheckDate) {
    notifiedKeysToday.clear();
    lastCheckDate = dateStr;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 1. Check Timed Tasks
  for (const { task, status } of todayActivity.tasks) {
    if (status === 'done' || status === 'skipped' || status === 'removed') continue;
    if (!task.startTime) continue; // Skip all-day tasks without specific time

    // Check if task category is muted
    if (settings.mutedCategories && settings.mutedCategories.includes(task.category)) {
      continue;
    }

    const taskMinutes = parseTimeToMinutes(task.startTime);
    if (taskMinutes === null) continue;

    const offset = task.reminderOffsetMinutes ?? settings.defaultOffsetMinutes ?? 10;
    const reminderTargetMinutes = taskMinutes - offset;

    // Trigger if current time is within active reminder window (from target offset time up to task start + 2 mins)
    if (currentMinutes >= reminderTargetMinutes && currentMinutes <= taskMinutes + 2) {
      const key = `task_${task.id}_${dateStr}_${reminderTargetMinutes}`;
      if (!notifiedKeysToday.has(key)) {
        notifiedKeysToday.add(key);

        const remainingMins = Math.max(0, taskMinutes - currentMinutes);
        const timingText = remainingMins === 0 
          ? `Starting NOW at ${task.startTime}`
          : `Due in ${remainingMins} min${remainingMins === 1 ? '' : 's'} (at ${task.startTime})`;

        dispatchNotification(`Upcoming Task: ${task.title}`, {
          body: `[${task.category}] ${timingText}${task.description ? ` • ${task.description}` : ''}`,
          tag: key,
        });
      }
    }
  }

  // 2. Check College Periods
  if (!settings.muteCollegePeriods && !todayActivity.isCollegeHoliday) {
    for (const period of todayActivity.collegePeriods) {
      const periodMinutes = parseTimeToMinutes(period.startTime);
      if (periodMinutes === null) continue;

      const offset = settings.defaultOffsetMinutes ?? 10;
      const reminderTargetMinutes = periodMinutes - offset;

      if (currentMinutes >= reminderTargetMinutes && currentMinutes <= periodMinutes + 2) {
        const key = `college_${period.id}_${dateStr}_${reminderTargetMinutes}`;
        if (!notifiedKeysToday.has(key)) {
          notifiedKeysToday.add(key);

          const remainingMins = Math.max(0, periodMinutes - currentMinutes);
          const timingText = remainingMins === 0 
            ? `Starting NOW at ${period.startTime}`
            : `Starts in ${remainingMins} min${remainingMins === 1 ? '' : 's'} (at ${period.startTime})`;
          const roomLabel = period.room ? ` in Room ${period.room}` : '';

          dispatchNotification(`Lecture: ${period.subject}`, {
            body: `${period.type || 'Class'} ${timingText}${roomLabel}`,
            tag: key,
          });
        }
      }
    }
  }
}
