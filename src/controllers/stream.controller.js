import Stream from "../models/stream.model.js";

// Add or update stream
export const setStream = async (req, res) => {
  try {
    const { youtubeUrl, isActive } = req.body;
    let stream = await Stream.findOne();
    if (!stream) stream = new Stream({ youtubeUrl, isActive });
    else {
      stream.youtubeUrl = youtubeUrl;
      stream.isActive = isActive;
    }
    await stream.save();
    res.status(200).json({ success: true, stream });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get current stream
export const getStream = async (req, res) => {
  try {
    const stream = await Stream.findOne();
    res.status(200).json(stream || {});
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
