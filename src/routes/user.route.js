import express from "express";
import {
  deleteUser,
  getAllUsers,
  getUserById,
  editUser,
  updateFCMToken,
} from '../controllers/user.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", editUser);
router.delete("/:id", deleteUser);
router.post("/fcm-token", protect, updateFCMToken);

export default router;
