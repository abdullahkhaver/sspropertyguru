import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Gallery', gallerySchema);
