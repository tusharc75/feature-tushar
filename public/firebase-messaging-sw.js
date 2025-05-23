/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBk4ZK0jrQNxRcJkOE5IylpVRvlohm7dBw',
  authDomain: 'oms-notification-push.firebaseapp.com',
  projectId: 'oms-notification-push',
  storageBucket: 'oms-notification-push.firebasestorage.app',
  messagingSenderId: '806532589288',
  appId: '1:806532589288:web:85ffd60f0e6a0fa8484b5d',
  measurementId: 'G-89TEFFHZD4'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  // Firebase automatically displays notifications sent via the 'notification' key from the backend.
  // If you need to customize the notification UI or handle data-only messages,
  // you can manually display notifications using self.registration.showNotification().
});