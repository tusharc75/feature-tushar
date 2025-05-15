import { useEffect, useRef } from 'react';
import axiosInstance from 'src/axios/axiosInstance';

let lastLatitude: number | null = null;
let lastLongitude: number | null = null;
let lastUpdateTime: number = 0;

const TIME_INTERVAL = 5 * 60 * 1000;

export const useLiveLocationTracking = (user: any, isOffline: boolean) => {
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || isOffline || !localStorage.getItem('token')) return;

    const now = () => new Date().getTime();

    const sendLocation = async (latitude: number, longitude: number, forceUpdate = false) => {
      const currentTime = now();
      const locationChanged = latitude !== lastLatitude || longitude !== lastLongitude;

      try {
        if (locationChanged || forceUpdate) {
          if (locationChanged) {
            // INSERT new record
            await axiosInstance().post('user/live-location', {
              latitude,
              longitude,
            });
            lastLatitude = latitude;
            lastLongitude = longitude;
          } else if (forceUpdate && currentTime - lastUpdateTime >= TIME_INTERVAL) {
            // UPDATE time of same location
            await axiosInstance().put('user/live-location', {
              latitude,
              longitude,
            });
          }

          lastUpdateTime = currentTime;
        }
      } catch (err) {
        console.error('Live location update failed:', err);
      }
    };

    const startTracking = () => {
      if (!navigator.geolocation || watchIdRef.current !== null) return;

      // Track movement
      watchIdRef.current = navigator.geolocation.watchPosition(
        ({ coords: { latitude, longitude } }) => {
          sendLocation(latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: false }
      );

      // Timer for periodic updates even if not moving
      intervalRef.current = setInterval(() => {
        if (lastLatitude !== null && lastLongitude !== null) {
          sendLocation(lastLatitude, lastLongitude, true);
        }
      }, TIME_INTERVAL);
    };

    const stopTracking = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const checkPermissionsAndTrack = async () => {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });

        if (status.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(
            () => startTracking(),
            () => stopTracking()
          );
        } else if (status.state === 'granted') {
          startTracking();
        } else {
          stopTracking();
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
      }
    };

    checkPermissionsAndTrack();

    return () => {
      stopTracking();
    };
  }, [user, isOffline]);
};
