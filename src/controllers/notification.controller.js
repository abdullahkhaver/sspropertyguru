import Notification from '../models/notification.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// 📨 Get Notifications
export const getNotifications = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: 'Unauthorized - User not found in request' });
    }

    const notifications = await Notification.find({
      $or: [{ recipient: req.user._id }, { recipient: 'all' }],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name')
      .lean();

    res
      .status(200)
      .json(new ApiResponse(200, notifications, 'Notifications fetched'));
  } catch (err) {
    console.error('❌ Error fetching notifications:', err);
    res
      .status(500)
      .json({ message: 'Error fetching notifications', error: err.message });
  }
};

// 🗑️ Delete Notification
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if notification exists
    const notification = await Notification.findById(id);
    if (!notification) {
      return next(new ApiError(404, 'Notification not found'));
    }

    // Ensure only recipient or admin can delete
    if (
      notification.recipient.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return next(
        new ApiError(403, 'Not authorized to delete this notification'),
      );
    }

    await Notification.findByIdAndDelete(id);

    res
      .status(200)
      .json(new ApiResponse(200, null, 'Notification deleted successfully'));
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    next(new ApiError(500, 'Error deleting notification'));
  }
};
