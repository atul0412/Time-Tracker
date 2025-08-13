import express from 'express';
import {
    assignProjectToUser,
    deassignProjectFromUser,
    deassignProjectByIds,
    getAllAssignedProjects,
    getAssignedProjectsByUserId,
    getAssignmentById
} from '../controllers/assignedProjectController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin-only: Assign a project to a user
router.post('/assign', protect, adminOnly, assignProjectToUser);

// Admin-only: Deassign project from user (by assignment ID) - Main deassign function
router.delete('/deassign/:assignmentId', protect, adminOnly, deassignProjectFromUser);

// Admin-only: Alternative deassign by user and project IDs
router.delete('/deassign-by-ids', protect, adminOnly, deassignProjectByIds);

// Get all assigned projects with populated user and project data
router.get('/allAssigned', protect, getAllAssignedProjects);

// Get assigned projects by user ID
router.get('/user/:userId', protect, getAssignedProjectsByUserId);

// Get assignment details by assignment ID
router.get('/assignment/:assignmentId', protect, getAssignmentById);

export default router;
