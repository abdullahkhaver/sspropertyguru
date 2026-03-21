import express from 'express';
import {
  createDistrict,
  getDistricts,
} from '../controllers/district.controller.js';

const router = express.Router();

router.post('/', createDistrict);
router.get('/', getDistricts);

export default router;
