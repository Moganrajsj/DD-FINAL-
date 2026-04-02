import Pusher from 'pusher-js';

// Enable pusher logging for development
if (process.env.NODE_ENV !== 'production') {
  Pusher.logToConsole = true;
}

// Singleton Pusher instance
let pusherInstance = null;

export const getPusher = () => {
  if (!pusherInstance) {
    const key = process.env.REACT_APP_PUSHER_KEY || 'f15bb66e04d0fc4e9fe9'; // Fallback to avoid crashes, but should be in .env
    const cluster = process.env.REACT_APP_PUSHER_CLUSTER || 'ap2';
    
    pusherInstance = new Pusher(key, {
      cluster: cluster
    });
  }
  return pusherInstance;
};

// Legacy exports to prevent crashes while migrating components
export const socket = {
  emit: () => console.warn('socket.emit called but Socket.io is deprecated. Use API endpoints.'),
  on: () => console.warn('socket.on called but Socket.io is deprecated. Use getPusher().subscribe()'),
  off: () => {},
  connect: () => {},
  disconnect: () => {}
};

export const connectSocket = () => {};
export const disconnectSocket = () => {};
