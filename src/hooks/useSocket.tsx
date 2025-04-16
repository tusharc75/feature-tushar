import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io-client/build/typed-events';
import { backendApi } from 'src/config';

const allConnections: Record<string, Socket<DefaultEventsMap, DefaultEventsMap>> = {};

interface UseSocketProps {
  namespace: string;
}

export const useSocket = ({ namespace }: UseSocketProps): Socket | null => {
  const token = localStorage.getItem('token');

  const [socket, setSocket] = useState<Socket>(null);
  // Memoize the socket instance
  useEffect(() => {
    if (token) {
      const baseUrl = backendApi.replace('/api', '');
      const path = backendApi.includes('/api') ? '/api/socket.io' : '/socket.io';
      const fullNamespace = `${baseUrl}${namespace}`;
      let s: Socket<DefaultEventsMap, DefaultEventsMap>;

      // Check if a socket for this namespace already exists
      if (allConnections[fullNamespace]) {
        s = allConnections[fullNamespace];
        if (!s.connected) {
          s.connect();
          s.on('connect', () => {
            setSocket(s);
          });
        } else {
          setSocket(s);
        }
      } else {
        s = io(fullNamespace, {
          path,
          auth: { token },
          reconnectionAttempts: 5,
          reconnectionDelay: 5000,
          transports: ['websocket', 'polling']
        });
        s.on('connect', () => {
          setSocket(s);
        });
        s.connect();
        allConnections[fullNamespace] = s;
      }

      return () => {
        s.disconnect();
      };
    }
  }, [namespace, token]);

  return socket;
};
