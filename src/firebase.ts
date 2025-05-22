import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';
import { firebaseConfigKey } from './config';

const firebaseConfig = {
  apiKey: firebaseConfigKey.apiKey,
  authDomain: firebaseConfigKey.authDomain,
  projectId: firebaseConfigKey.projectId,
  storageBucket: firebaseConfigKey.storageBucket,
  messagingSenderId: firebaseConfigKey.messagingSenderId,
  appId: firebaseConfigKey.appId,
  measurementId: firebaseConfigKey.measurementId
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
