import express from 'express';
import {
    assignProjectToUser,
    getAllAssignedProjects} from '../controllers/assignedProjectController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { get } from 'mongoose';
const router = express.Router();
// Admin-only: Assign a project to a user
router.post('/assign', protect, adminOnly, assignProjectToUser);
// ✅ NEW: Get all assigned projects with populated user and project data
router.get('/allAssigned', protect, getAllAssignedProjects);

export default router;
