import Stream from "../models/stream.model.js";

// Add or update stream
export const setStream = async (req, res) => {
  try {
    const { youtubeUrl, isActive } = req.body;
    
    // Default isActive to true if not provided
    const activeStatus = isActive !== undefined ? isActive : true;
    
    console.log('[setStream] Received:', { youtubeUrl, isActive, activeStatus });
    
    let stream = await Stream.findOne();
    if (!stream) {
      stream = new Stream({ youtubeUrl, isActive: activeStatus });
      console.log('[setStream] Creating new stream');
    } else {
      stream.youtubeUrl = youtubeUrl;
      stream.isActive = activeStatus;
      console.log('[setStream] Updating existing stream');
    }
    
    await stream.save();
    console.log('[setStream] Saved stream:', stream);
    
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
