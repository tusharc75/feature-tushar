import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';
import { FIREBASE_CONFIG } from './config';

export const firebaseConfig = {
  apiKey: FIREBASE_CONFIG.apiKey,
  authDomain: FIREBASE_CONFIG.authDomain,
  projectId: FIREBASE_CONFIG.projectId,
  storageBucket: FIREBASE_CONFIG.storageBucket,
  messagingSenderId: FIREBASE_CONFIG.messagingSenderId,
  appId: FIREBASE_CONFIG.appId,
  measurementId: FIREBASE_CONFIG.measurementId
};

// Initialize Firebase
export const app = FIREBASE_CONFIG.apiKey ? initializeApp(firebaseConfig) : null;
export const messaging = FIREBASE_CONFIG.apiKey ? getMessaging(app) : null;
