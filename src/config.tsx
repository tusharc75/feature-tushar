export const azureConfig = {
  clientId: import.meta.env?.VITE_APP_AZURE_CLIENT_ID,
  redirectUri: import.meta.env?.VITE_APP_AZURE_REDIRECT_URL,
  // authority: `https://login.microsoftonline.com/${import.meta?.env?.REACT_APP_AZURE_TENANT_ID}`,
  authority: `https://login.microsoftonline.com/common`,
  cache: 'localStorage' // This configures where your cache will be stored
};

export const TRACKING_ID = 'UA-196035023-2'; //Google analytics tracking id

export const backendApi =
  localStorage.getItem('backendApi') ?? (import.meta.env?.VITE_APP_API_URL || 'https://master.oms-backend.vebholic.com');

export const AI_AGENT = ['local', 'master', 'development']?.includes(import.meta.env?.VITE_APP_ENV);

export const VITE_APP_ENV = import.meta.env?.VITE_APP_ENV;

export const firebaseConfigKey = {
  apiKey: import.meta.env?.VITE_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env?.VITE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env?.VITE_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env?.VITE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env?.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env?.VITE_APP_FIREBASE_APP_ID,
  measurementId: import.meta.env?.VITE_APP_FIREBASE_MEASUREMENT_ID
};

export const firebaseCloudMessagingToken =
  import.meta.env?.VITE_APP_FIREBASE_CLOUD_MESSAGING_TOKEN