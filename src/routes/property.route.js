// routes/property.routes.js
import express from 'express';
import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getPropertiesByFranchiseOrAgent,
} from '../controllers/property.controller.js';
import protect from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.js';
const router = express.Router();

// Public routes
router.get('/', getProperties);
router.get('/:id', getPropertyById); // GET single
// Fetch properties for a specific franchise
// Example: GET /api/properties/franchise/68e2a9439ec836ed502ee2b5
router.get('/franchise/:franchiseId', getPropertiesByFranchiseOrAgent);

//  Fetch properties for a specific agent
// Example: GET /api/properties/agent/68e2a8d39ec836ed502ee1b0
router.get('/agent/:agentId', getPropertiesByFranchiseOrAgent);

//  Fetch properties for a specific agent *within a franchise*
// Example: GET /api/properties/franchise/68e2a9439ec836ed502ee2b5/agent/68e2a8d39ec836ed502ee1b0
router.get(
  '/franchise/:franchiseId/agent/:agentId',
  getPropertiesByFranchiseOrAgent
);


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
