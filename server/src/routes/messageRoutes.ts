import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

const router = Router();

router.use(authenticateUser);

/**
 * GET /api/messages/:userId
 * Fetch message history between logged in user and target user
 */
router.get('/:userId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUid = req.firebaseUid;
    const rawTargetParam = req.params.userId;
    const targetParam = Array.isArray(rawTargetParam) ? rawTargetParam[0] : rawTargetParam;

    const currentUser = await User.findOne({ firebaseUid: currentUid });
    if (!currentUser) {
      res.status(404).json({ error: 'Current user not found' });
      return;
    }

    // Determine target user by Mongo ObjectId or firebaseUid
    let targetUser = null;
    if (mongoose.Types.ObjectId.isValid(targetParam)) {
      targetUser = await User.findById(targetParam);
    }
    if (!targetUser) {
      targetUser = await User.findOne({ firebaseUid: targetParam });
    }

    if (!targetUser) {
      res.status(404).json({ error: 'Target user not found' });
      return;
    }

    // Query messages where (sender = A AND receiver = B) OR (sender = B AND receiver = A)
    const messages = await Message.find({
      $or: [
        { senderId: currentUser._id, receiverId: targetUser._id },
        { senderId: targetUser._id, receiverId: currentUser._id },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(messages);
  } catch (error) {
    console.error('[Get Messages Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

export default router;
