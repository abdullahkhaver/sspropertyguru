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

router.post('/signup', upload.single('avatar'), signup);
router.post('/signin', signin);
router.get('/me/:id', getMe);

router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
export default router;
