import express from "express";
import {
  deleteUser,
  getAllUsers,
  editUser,
} from '../controllers/user.controller.js';

const router = express.Router();

router.get("/", getAllUsers);
router.put("/:id", editUser);
router.delete("/:id", deleteUser);

export default router;
