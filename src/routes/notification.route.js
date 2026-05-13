import express from 'express';
import { sendPushNotification } from '../utils/firebase.js';
import User from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { getNotifications, deleteNotification } from '../controllers/notification.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

// 📨 In-app notification routes
router.get('/', protect, getNotifications);
router.delete('/:id', protect, deleteNotification);

// 🧪 Test push notification for a specific user
// POST /api/v1/notifications/test
router.post('/test', async (req, res) => {
    try {
        const { userId, title, body } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        const user = await User.findById(userId);
        if (!user || !user.fcmToken) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found or has no FCM token' 
            });
        }

        const result = await sendPushNotification(
            user.fcmToken,
            title || '🏠 SS Property Guru Test',
            body || 'This is a test notification. If you see this, push is working!',
            { type: 'test' }
        );

        if (result) {
            return res.json(ApiResponse.success(result, 'Test notification sent!'));
        } else {
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to send notification. Check server logs for FIREBASE_SERVICE_ACCOUNT status.' 
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
