import express from "express"
import {getDashboardStats} from "../controllers/superAdminDashboard.controller.js";

const router = express.Router();

router.get('/', getDashboardStats);

export default router;
