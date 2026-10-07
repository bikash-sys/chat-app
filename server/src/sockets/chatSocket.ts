import { Server, Socket } from 'socket.io';
import { verifyFirebaseToken } from '../config/firebase.js';
import { User, IUser } from '../models/User.js';
import { Message } from '../models/Message.js';
import mongoose from 'mongoose';

interface SocketData {
  user: IUser;
  firebaseUid: string;
}

export const setupSocketIO = (io: Server): void => {
  // Socket.IO Authentication Middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        console.warn('[Socket Auth] Connection rejected: Missing token');
        return next(new Error('Authentication token missing'));
      }

      const decodedToken = await verifyFirebaseToken(token);
      if (!decodedToken || !decodedToken.uid) {
        console.warn('[Socket Auth] Connection rejected: Invalid token');
        return next(new Error('Invalid token'));
      }

      let user = await User.findOne({ firebaseUid: decodedToken.uid });
      if (!user) {
        // Fallback sync if user connects via socket first
        user = await User.create({
          firebaseUid: decodedToken.uid,
          phone: decodedToken.phone_number || '',
          name: '',
        });
      }

      (socket.data as SocketData).user = user;
      (socket.data as SocketData).firebaseUid = decodedToken.uid;
      next();
    } catch (error) {
      console.error('[Socket Auth Error]:', error);
      next(new Error('Socket authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket.data as SocketData).user;
    if (!user) return;

    const mongoIdStr = user._id.toString();
    const firebaseUid = user.firebaseUid;

    // Join user specific rooms
    socket.join(mongoIdStr);
    socket.join(firebaseUid);

    console.log(`[Socket] User connected: ${user.name || user.phone} (ID: ${mongoIdStr}, Socket: ${socket.id})`);

    // Handle incoming chat message
    socket.on('send_message', async (data: { receiverId: string; text: string }, callback?: Function) => {
      try {
        const { receiverId, text } = data;

        if (!text || !text.trim()) {
          if (callback) callback({ error: 'Message text cannot be empty' });
          return;
        }

        if (!receiverId) {
          if (callback) callback({ error: 'Receiver ID is required' });
          return;
        }

        // Find receiver by Mongo ID or Firebase UID
        let receiver = null;
        if (mongoose.Types.ObjectId.isValid(receiverId)) {
          receiver = await User.findById(receiverId);
        }
        if (!receiver) {
          receiver = await User.findOne({ firebaseUid: receiverId });
        }

        if (!receiver) {
          if (callback) callback({ error: 'Receiver user not found' });
          return;
        }

        // Save message to MongoDB
        const newMessage = await Message.create({
          senderId: user._id,
          receiverId: receiver._id,
          text: text.trim(),
        });

        const messagePayload = {
          _id: newMessage._id,
          senderId: newMessage.senderId,
          receiverId: newMessage.receiverId,
          text: newMessage.text,
          createdAt: newMessage.createdAt,
        };

        // Emit to receiver's rooms
        io.to(receiver._id.toString())
          .to(receiver.firebaseUid)
          .emit('receive_message', messagePayload);

        // Emit to sender's rooms (so multi-device/tab or sender sees immediate echo)
        io.to(mongoIdStr)
          .to(firebaseUid)
          .emit('receive_message', messagePayload);

        if (callback) {
          callback({ success: true, message: messagePayload });
        }
      } catch (err) {
        console.error('[Socket send_message Error]:', err);
        if (callback) callback({ error: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${user.phone} (${socket.id})`);
    });
  });
};
