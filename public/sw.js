// Service Worker for Chronos Tracker Push Notifications

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push events (Web Push protocol with backend VAPID server)
self.addEventListener('push', (event) => {
  let data = { title: 'Chronos Reminder', body: 'You have an upcoming scheduled task or lecture.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'Scheduled Task Reminder',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: data.url || '/',
    tag: data.tag || 'chronos-reminder',
    renotify: true,
    actions: [
      { action: 'open', title: 'Open Schedule' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Chronos Reminder 🔔', options)
  );
});

// Handle messages sent from frontend client (e.g. test notifications or local triggers)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.payload || {};
    const notificationOptions = {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [100, 50, 100],
      tag: options?.tag || 'chronos-local-notification',
      body: options?.body || '',
      data: options?.data || '/',
      ...options,
    };

    self.registration.showNotification(title || 'Chronos Tracker 🔔', notificationOptions);
  }
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
