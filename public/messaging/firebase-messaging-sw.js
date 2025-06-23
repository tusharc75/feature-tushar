/* eslint-disable no-restricted-globals */

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

let messaging;

// Initialize Firebase when config is received
self.addEventListener('message', (event) => {
  if (event.data?.type === 'INIT_FIREBASE') {
    try {
      const config = event.data.config;
      if (!config?.apiKey) throw new Error('Invalid Firebase config');
      firebase.initializeApp(config);
      messaging = firebase.messaging();
    } catch (error) {
      console.error('Firebase initialization failed:', error);
    }
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  try {
    const payload = event.data?.json();
    if (!payload) return;

    const { notification, data } = payload;
    const notificationData = notification || data;

    if (notificationData) {
      const { title, body, icon, data: customData } = notificationData;
      self.registration.showNotification(title || 'Notification', {
        body: body || 'No message provided',
        icon: icon || '/logo-24x24.ico',
        data: customData || {}
      });
    }
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const client = windowClients.find((c) => c.url === url);
      return client?.focus() || clients.openWindow(url);
    })
  );
});
