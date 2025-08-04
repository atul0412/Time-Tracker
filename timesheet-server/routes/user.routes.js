//// routes/auth.js
import express from "express";
import {
  registerUser,
  loginUser,
  getAllUsers,
  deleteUser,
  forgotPassword,
  resetPassword,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getAlluser", protect, getAllUsers);
router.delete("/:id", protect, deleteUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
