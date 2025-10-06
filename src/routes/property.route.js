// routes/property.routes.js
import express from 'express';
import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getMyProperties,
} from '../controllers/property.controller.js';
import protect from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.js';

const router = express.Router();

// Public routes
router.get('/', getProperties); // GET all with filters/search
router.get('/:id', getPropertyById); // GET single
router.get("/my-properties", getMyProperties);

// Protected routes (only logged-in users/agents can modify)
// router.post('/', protect, createProperty); // Create
// router.put('/:id', protect, updateProperty); // Update
// router.delete('/:id', protect, deleteProperty); // Delete

// Testing without Middleware
router.post(
  '/',
  upload.fields([
    { name: 'images', maxCount: 4 },
    { name: 'video', maxCount: 1 },
  ]),
  createProperty,
);
router.put(
  '/:id',
  upload.fields([
    { name: 'images', maxCount: 4 },
    { name: 'video', maxCount: 1 },
  ]),
  updateProperty,
);
router.delete('/:id',  deleteProperty);

export default router;
