import { io, Socket } from 'socket.io-client';
import { auth } from '../config/firebase';
import { API_BASE_URL } from '../utils/config';
import { ChatMessage } from '../types';

let socket: Socket | null = null;

export const initSocket = async (): Promise<Socket | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  let token: string | null = null;
  try {
    token = await currentUser.getIdToken(true);
  } catch (e) {
    console.error('[Socket] Failed to get fresh ID token:', e);
  }

  if (socket && socket.connected) {
    return socket;
  }

  socket = io(API_BASE_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('[Socket.IO] Connected to backend server:', socket?.id);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket.IO] Connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket.IO] Disconnected:', reason);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const sendMessageViaSocket = (
  receiverId: string,
  text: string,
  callback?: (response: { success?: boolean; message?: ChatMessage; error?: string }) => void
): void => {
  if (!socket || !socket.connected) {
    if (callback) callback({ error: 'Socket is not connected to server' });
    return;
  }

  socket.emit('send_message', { receiverId, text }, callback);
};
