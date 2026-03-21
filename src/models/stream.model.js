import mongoose from 'mongoose';

const streamSchema = new mongoose.Schema({
  youtubeUrl: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Stream', streamSchema);
