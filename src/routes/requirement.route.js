// server/src/routes/requirement.routes.js
import express from 'express';
import {
  addRequirement,
  getAllRequirements,
  deleteRequirement,
} from '../controllers/requirement.controller.js';

const router = express.Router();

router.post('/', addRequirement);
router.get('/', getAllRequirements);
router.delete('/:id', deleteRequirement);

export default router;
