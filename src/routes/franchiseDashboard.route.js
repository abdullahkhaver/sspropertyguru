import express from 'express';
import { getFranchiseDashboard } from '../controllers/franchiseDashboard.controller.js';

const router = express.Router();

router.get('/stats/:franchiseId', getFranchiseDashboard);

export default router;
