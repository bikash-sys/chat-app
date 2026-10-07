import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/mobile_chat_db';
    await mongoose.connect(connStr);
    console.log(`[MongoDB] Connected successfully to ${mongoose.connection.host}`);
  } catch (error) {
    console.error('[MongoDB] Connection error:', (error as Error).message);
    console.warn('[MongoDB] Please ensure MongoDB is running or configure MONGODB_URI in server/.env');
  }
};
