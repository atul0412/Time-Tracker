//// routes/auth.js
import express from 'express';
import { registerUser, loginUser, getAllUsers, deleteUser } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/getAlluser', protect, getAllUsers);
router.delete('/:id', protect, deleteUser);

export default router;
