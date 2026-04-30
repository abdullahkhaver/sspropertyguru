import Gallery from '../models/gallery.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import fs from 'fs';

export const getGallery = async (req, res) => {
  try {
    const items = await Gallery.find().sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, items, 'Gallery fetched'));
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const addGalleryItem = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
    if (!req.file) return res.status(400).json({ success: false, message: 'Image is required' });

    const uploaded = await uploadOnCloudinary(req.file.path, 'gallery', 'image');
    if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    if (!uploaded?.url) return res.status(500).json({ success: false, message: 'Image upload failed' });

    const item = await Gallery.create({ title, image: uploaded.url });
    return res.status(201).json(new ApiResponse(201, item, 'Gallery item added'));
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    return res.status(200).json(new ApiResponse(200, null, 'Deleted successfully'));
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
