import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socketInstance = null;

export const useSocket = (userId, onNotification) => {
  const onNotifRef = useRef(onNotification);
  onNotifRef.current = onNotification;

  useEffect(() => {
    if (!userId) return;

    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });
    }

    socketInstance.emit('join', userId);

    const handler = (notification) => {
      if (onNotifRef.current) onNotifRef.current(notification);
    };

    socketInstance.on('notification', handler);

    return () => {
      socketInstance.off('notification', handler);
    };
  }, [userId]);

  return socketInstance;
};
