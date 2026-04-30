import express from 'express';
import { getGallery, addGalleryItem, deleteGalleryItem } from '../controllers/gallery.controller.js';
import { upload } from '../middleware/multer.js';

const router = express.Router();

router.get('/', getGallery);
router.post('/', upload.single('image'), addGalleryItem);
router.delete('/:id', deleteGalleryItem);

export default router;
