import { getToken } from 'firebase/messaging';
import { messaging } from './../firebase';
import { AnyObject } from 'yup/lib/types';
import { FIREBASE_CONFIG } from './../config';
import axiosInstance from '../axios/axiosInstance';

export const requestAndSyncFcmToken = async (user: AnyObject) => {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('❌ Notification permission not granted:', permission);
    return;
  }
  try {
    const currentToken = await getToken(messaging, { vapidKey: FIREBASE_CONFIG.vapid });
    if (!currentToken) {
      console.warn('No FCM token retrieved.');
      return;
    }
    if (currentToken !== user?.fcmToken) {
      try {
        await axiosInstance().put('/user/cloud-message/fcm-token', {
          fcmToken: currentToken
        });
      } catch (error) {
        console.error('❌ Failed to update token', error);
      }
    }
  } catch (err) {
    console.error('❌ Error getting FCM token', err);
  }
};
