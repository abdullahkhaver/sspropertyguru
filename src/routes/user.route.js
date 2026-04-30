import express from "express";
import {
  deleteUser,
  getAllUsers,
  getUserById,
  editUser,
  updateFCMToken,
  removeFCMToken,
  createManager,
  getAllManagers,
} from '../controllers/user.controller.js';
import protect from '../middleware/auth.middleware.js';
import { upload } from "../middleware/multer.js";

const router = express.Router();

router.get("/", getAllUsers);
router.get("/managers", getAllManagers);
router.post("/managers", createManager);
router.get("/:id", getUserById);
router.put("/:id", upload.single('avatar'), editUser);
router.delete("/:id", deleteUser);
router.post("/fcm-token", protect, updateFCMToken);
router.delete("/fcm-token", protect, removeFCMToken);

export default router;
