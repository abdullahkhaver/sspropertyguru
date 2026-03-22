import express from "express";
import {
  deleteUser,
  getAllUsers,
  getUserById,
  editUser,
} from '../controllers/user.controller.js';

const router = express.Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", editUser);
router.delete("/:id", deleteUser);

export default router;
