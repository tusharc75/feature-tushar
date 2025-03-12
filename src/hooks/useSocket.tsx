import { useCallback, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { backendApi } from 'src/config';

interface UseSocketProps {
  namespace: string;

}


export const useSocket = ({ namespace }: UseSocketProps): Socket => {
  const token = localStorage.getItem('token');

  const [socket,setSocket] = useState<Socket>(null)
  // Memoize the socket instance
 useEffect(() => {
    const baseUrl = backendApi.replace('/api', '');
    const path = backendApi.includes('/api') ? '/api/socket.io' : '/socket.io';
    const fullNamespace = `${baseUrl}${namespace}`;

    // Check if a socket for this namespace already exists
 
    const s = io(fullNamespace, {
        path,
        auth: { token },
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
        transports: ['websocket', 'polling'],
      });

    
    s.on('connect', () => {
      setSocket(s)
    });

    s.connect()

    return () => {
      s.disconnect()
    }

  }, [namespace, token]);
  


  return socket;
};
