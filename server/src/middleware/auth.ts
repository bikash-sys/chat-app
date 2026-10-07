import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../config/firebase.js';
import { User, IUser } from '../models/User.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  firebaseUid?: string;
  phone?: string;
}

export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization token' });
      return;
    }

    const token = authHeader.split('Bearer ')[1].trim();
    if (!token) {
      res.status(401).json({ error: 'Unauthorized: Empty token provided' });
      return;
    }

    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken || !decodedToken.uid) {
      res.status(401).json({ error: 'Unauthorized: Invalid authentication token' });
      return;
    }

    req.firebaseUid = decodedToken.uid;
    req.phone = decodedToken.phone_number || '';

    // Find MongoDB user
    const mongoUser = await User.findOne({ firebaseUid: decodedToken.uid });
    if (mongoUser) {
      req.user = mongoUser;
    }

    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    res.status(401).json({ error: 'Unauthorized: Authentication failed' });
  }
};
