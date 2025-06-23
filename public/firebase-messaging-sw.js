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

function handlePushEvent(event) {
  try {
    const payload = event.data?.json();
    if (!payload) {
      console.log('No payload in push event');
      return;
    }

    const { notification, data } = payload;
    const notificationData = notification || data;

    if (notificationData) {
      const { title, body, icon, data: customData } = notificationData;
      const notificationPayload = {
        title,
        body: body || 'No message provided',
        icon: icon || '/logo-24x24.ico',
        data: customData || {}
      };
      self.registration.showNotification(title || 'Notification', notificationPayload);
    }
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
}

// Handle push notifications
self.addEventListener('push', handlePushEvent);

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
