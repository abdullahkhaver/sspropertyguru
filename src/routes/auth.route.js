// /src/routes/auth.route.js
import express from 'express';
import { signup, signin , getMe} from '../controllers/auth.controller.js';
import { upload } from '../middleware/multer.js';
import protect from "../middleware/auth.middleware.js"
const router = express.Router();

// Signup with avatar upload
router.post('/signup', upload.single('avatar'), signup);

// Signin without upload
router.post('/signin', signin);

router.get('/me/:id', getMe);
export default router;
