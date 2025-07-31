import express from 'express';
import {
    assignProjectToUser,
    getAllAssignedProjects,
    getAssignedProjectsByUserId} from '../controllers/assignedProjectController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { get } from 'mongoose';
const router = express.Router();
// Admin-only: Assign a project to a user
router.post('/assign', protect, adminOnly, assignProjectToUser);
// Get all assigned projects with populated user and project data
router.get('/allAssigned', protect, getAllAssignedProjects);
// Get assigned projects by user ID
router.get('/user/:userId', getAssignedProjectsByUserId); 

export default router;
