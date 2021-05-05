import firebase from 'firebase';
// import 'firebase/messaging';

// var firebaseConfig = {
//     apiKey: "AIzaSyAPTpIYzw9oNQVHpSvc7mKcIqfUf7RAcAI",
//     authDomain: "oms-frontend-2896e.firebaseapp.com",
//     projectId: "oms-frontend-2896e",
//     storageBucket: "oms-frontend-2896e.appspot.com",
//     messagingSenderId: "686537353771",
//     appId: "1:686537353771:web:5642299ecb56fe719b586e"
// };
// // Initialize Firebase
// // firebase.initializeApp(firebaseConfig)
// !firebase.apps.length ?
//     firebase.initializeApp(firebaseConfig) :
//     firebase.app();

// export const getToken = (setTokenFound) => {
//     return messaging.getToken({ vapidKey: 'GENERATED_MESSAGING_KEY' }).then((currentToken) => {
//         if (currentToken) {
//             console.log('current token for client: ', currentToken);
//             setTokenFound(true);
//             // Track the token -> client mapping, by sending to backend server
//             // show on the UI that permission is secured
//         } else {
//             console.log('No registration token available. Request permission to generate one.');
//             setTokenFound(false);
//             // shows on the UI that permission is required 
//         }
//     }).catch((err) => {
//         console.log('An error occurred while retrieving token. ', err);
//         // catch error while creating client token
//     });
// }

// getToken(false);

// const messaging = firebase.messaging();
// export const onMessageListener = () =>
//     new Promise((resolve) => {
//         messaging.onMessage((payload) => {
//             resolve(payload);
//         });
//     });

export default firebase;