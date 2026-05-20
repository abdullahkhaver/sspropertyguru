import Stream from "../models/stream.model.js";
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { sendMulticastNotification } from '../utils/firebase.js';

// Helper to normalize YouTube URLs to the standard watch format
const getStandardYoutubeUrl = (url) => {
  if (!url) return url;
  let videoId = null;
  
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('youtube.com/live/')) {
    videoId = url.split('/live/')[1]?.split('?')[0];
  } else if (url.includes('/embed/')) {
    videoId = url.split('/embed/')[1]?.split('?')[0];
  } else {
    const videoIdMatch = url.match(/[?&]v=([^&]+)/);
    if (videoIdMatch) videoId = videoIdMatch[1];
  }
  
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url;
};

// Add or update stream
export const setStream = async (req, res) => {
  try {
    const { youtubeUrl, isActive } = req.body;
    
    // Default isActive to true if not provided
    const activeStatus = isActive !== undefined ? isActive : true;
    
    console.log('[setStream] Received:', { youtubeUrl, isActive, activeStatus });
    
    const normalizedUrl = getStandardYoutubeUrl(youtubeUrl);
    console.log('[setStream] Normalized URL:', normalizedUrl);
    
    let stream = await Stream.findOne();
    const wasInactive = !stream || !stream.isActive;
    
    if (!stream) {
      stream = new Stream({ youtubeUrl: normalizedUrl, isActive: activeStatus });
      console.log('[setStream] Creating new stream');
    } else {
      stream.youtubeUrl = normalizedUrl;
      stream.isActive = activeStatus;
      console.log('[setStream] Updating existing stream');
    }
    
    await stream.save();
    console.log('[setStream] Saved stream:', stream);
    
    // Send push notification to ALL users when stream becomes active
    if (activeStatus && wasInactive) {
      try {
        const allUsers = await User.find({
          fcmToken: { $exists: true, $ne: '' }
        }).select('fcmToken _id');

        if (allUsers.length > 0) {
          // Create in-app notifications
          const notifications = allUsers.map((u) => ({
            recipient: u._id,
            message: '🔴 Live Property Tour is now streaming! Watch now.',
            type: 'live_stream',
          }));
          await Notification.insertMany(notifications);

          // Send real push notifications
          const tokens = allUsers.map(u => u.fcmToken).filter(t => t && t.length > 10);
          if (tokens.length > 0) {
            sendMulticastNotification(
              tokens,
              '🔴 Live Property Tour!',
              'Property tour is streaming live now. Join and explore properties!',
              { type: 'live_stream', streamUrl: normalizedUrl }
            ).catch(err => console.error('Push notification failed:', err.message));
          }
          console.log(`[setStream] Notified ${allUsers.length} users about live stream.`);
        }
      } catch (notifErr) {
        console.error('[setStream] Notification error:', notifErr.message);
      }
    }
    
    res.status(200).json({ success: true, data: stream });
  } catch (err) {
    console.error('[setStream] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get current stream
export const getStream = async (req, res) => {
  try {
    const stream = await Stream.findOne();
    if (!stream) {
      return res.status(200).json({ 
        success: true, 
        data: { youtubeUrl: null, isActive: false } 
      });
    }
    res.status(200).json({ success: true, data: stream });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteStream = async (req, res) => {
  try {
    const stream = await Stream.findOne();
    if (!stream) {
      return res.status(404).json({ success: false, message: "No stream found to delete." });
    }

    await Stream.deleteOne({ _id: stream._id });
    res.status(200).json({ success: true, message: "Stream deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
