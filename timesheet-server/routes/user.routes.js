//// routes/auth.js
import express from "express";
import {
  registerUser,
  loginUser,
  getAllUsers,
  deleteUser,
  forgotPassword,
  resetPassword,
  updateUser,
  logoutUser,
} from "../controllers/userController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.get("/getAlluser", protect, getAllUsers);
router.delete("/:id", protect, deleteUser);
router.put('/:id', protect, adminOnly, updateUser);


router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
