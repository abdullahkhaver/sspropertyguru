import express from 'express';
import {
  createArea,
  getAreas,
  getAreaById,
  updateArea,
  deleteArea,
} from '../controllers/area.controller.js';

const router = express.Router();

router.post('/', createArea); // Create
router.get('/', getAreas); // Get all
router.get('/:id', getAreaById); // Get single
router.put('/:id', updateArea); // Update
router.delete('/:id', deleteArea); // Delete

export default router;
