import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from './../firebase';
import { AnyObject } from 'yup/lib/types';
import { firebaseCloudMessagingToken } from './../config';
import axiosInstance from '../axios/axiosInstance';

const vapidKey = firebaseCloudMessagingToken;

export const useFirebaseNotifications = (user: AnyObject) => {
  // Request permission and handle token + updates
  useEffect(() => {
    if (!user?._id) return;

    const requestAndSyncToken = async () => {
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        return;
      }

      try {
        const currentToken = await getToken(messaging, { vapidKey });
        console.log('✅ FCM token retrieved:', currentToken);
        if (!currentToken) {
          console.warn('No FCM token retrieved.');
          return;
        }

        if (currentToken !== user?.fcmToken) {
          try {
            await axiosInstance().put('/user/fcm-token', {
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

    requestAndSyncToken();
  }, [user?._id, user?.fcmToken]);

  // Handle incoming messages, When the app is in the foreground
  // useEffect(() => {
  //   const unsubscribe = onMessage(messaging, async (payload) => {
  //     const registration = await navigator.serviceWorker.getRegistration();
  //     if (registration) {
  //       registration.showNotification(payload.notification?.title ?? 'Notification', {
  //         body: payload.notification?.body,
  //         icon: '/logo-24x24.png',
  //         data: payload.data
  //       });
  //     }
  //   });

  //   return () => unsubscribe();
  // }, []);
};
