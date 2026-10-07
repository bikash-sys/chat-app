import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = Router();

// Protect all user routes with Firebase auth middleware
router.use(authenticateUser);

/**
 * POST /api/users/sync
 * Sync or create user profile after Firebase auth
 */
router.post('/sync', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const firebaseUid = req.firebaseUid;
    if (!firebaseUid) {
      res.status(400).json({ error: 'Missing Firebase UID' });
      return;
    }

    const { phone, name, profilePicture } = req.body;
    const phoneToSave = phone || req.phone || '';

    let user = await User.findOne({ firebaseUid });

    if (!user) {
      user = await User.create({
        firebaseUid,
        phone: phoneToSave,
        name: name || '',
        profilePicture: profilePicture || '',
      });
      console.log(`[User Sync] Created new user: ${user._id} (${user.phone})`);
    } else {
      let updated = false;
      if (name !== undefined && name !== user.name) {
        user.name = name;
        updated = true;
      }
      if (phoneToSave && phoneToSave !== user.phone) {
        user.phone = phoneToSave;
        updated = true;
      }
      if (profilePicture !== undefined && profilePicture !== user.profilePicture) {
        user.profilePicture = profilePicture;
        updated = true;
      }
      if (updated) {
        await user.save();
        console.log(`[User Sync] Updated user profile: ${user._id}`);
      }
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('[User Sync Error]:', error);
    res.status(500).json({ error: 'Failed to sync user profile' });
  }
});

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const firebaseUid = req.firebaseUid;
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      res.status(444).json({ error: 'User profile not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * GET /api/users
 * Get list of registered users excluding current user
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUid = req.firebaseUid;
    const users = await User.find({ firebaseUid: { $ne: currentUid } })
      .select('_id firebaseUid phone name profilePicture createdAt updatedAt')
      .sort({ name: 1, phone: 1 });

    res.status(200).json(users);
  } catch (error) {
    console.error('[Get Users Error]:', error);
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

export default router;
