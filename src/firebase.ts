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
export const app = import.meta.env?.VITE_APP_FIREBASE_API_KEY ? initializeApp(firebaseConfig) : null;
export const messaging = import.meta.env?.VITE_APP_FIREBASE_API_KEY ? getMessaging(app) : null;
