import express from 'express';
import {
  createEnquiry,
  getAllEnquiries,
  updateEnquiry,
  deleteEnquiry,
} from '../controllers/enquiry.controller.js';

const router = express.Router();

// User can submit request
router.post('/', createEnquiry);
router.get('/', getAllEnquiries);
router.put('/:id', updateEnquiry);
router.delete('/:id', deleteEnquiry);

export default router;
