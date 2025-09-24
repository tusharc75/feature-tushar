import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io-client/build/typed-events';
import { backendApi } from 'src/config';

interface UseSocketProps {
  namespace: string;
}

export const useSocket = ({ namespace }: UseSocketProps): Socket | null => {
  const token = localStorage.getItem('token');
  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);

  useEffect(() => {
    if (!token) return;

    // Only create once
    if (!socketRef.current) {
      const baseUrl = backendApi.replace('/api', '');
      const path = backendApi.includes('/api') ? '/api/socket.io' : '/socket.io';
      const fullNamespace = `${baseUrl}${namespace}`;

      const s = io(fullNamespace, {
        path,
        auth: { token },
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
        transports: ['websocket', 'polling'] // fallback enabled
      });

      socketRef.current = s;
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [namespace, token]);

  return socketRef.current;
};
