
importScripts('https://www.gstatic.com/firebasejs/8.4.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.4.1/firebase-messaging.js');

var firebaseConfig = {
    apiKey: "AIzaSyAPTpIYzw9oNQVHpSvc7mKcIqfUf7RAcAI",
    authDomain: "oms-frontend-2896e.firebaseapp.com",
    projectId: "oms-frontend-2896e",
    storageBucket: "oms-frontend-2896e.appspot.com",
    messagingSenderId: "686537353771",
    appId: "1:686537353771:web:5642299ecb56fe719b586e"
};

!firebase.apps.length ?
    firebase.initializeApp(firebaseConfig) :
    firebase.app();

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
    };

    self.registration.showNotification(notificationTitle,
        notificationOptions);
});