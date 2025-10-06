// routes/franchise.routes.js
import express from 'express';
import {
  createFranchise,
  getAllFranchises,
  toggleFranchiseStatus,
  editFranchise,
  deleteFranchise,
} from '../controllers/franchise.controller.js';
import {upload} from '../middleware/multer.js';
const router = express.Router();

router.post('/create', upload.single('image'), createFranchise);
router.get('/', getAllFranchises);
router.put('/:id', editFranchise);
router.delete('/:id', deleteFranchise);
router.patch('/:id/toggle-status', toggleFranchiseStatus);

export default router;
