// /src/routes/auth.route.js
import express from 'express';
import {
  signup,
  signin,
  getMe,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../controllers/auth.controller.js';
import { upload } from '../middleware/multer.js';
import protect from "../middleware/auth.middleware.js"
const router = express.Router();

// Conditional multer middleware - only process if Content-Type is multipart/form-data
const conditionalUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return upload.single('avatar')(req, res, next);
  }
  // Skip multer for JSON requests
  next();
};

router.post('/signup', conditionalUpload, signup);
router.post('/signin', signin);
router.get('/me/:id', getMe);

router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
export default router;
