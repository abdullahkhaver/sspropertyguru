// server/routes/stream.routes.js
import express from 'express';
import {
  setStream,
  getStream,
  deleteStream,
} from '../controllers/stream.controller.js';

const router = express.Router();

router.post('/set', setStream);
router.get('/current', getStream);
router.delete("/delete", deleteStream);
export default router;
