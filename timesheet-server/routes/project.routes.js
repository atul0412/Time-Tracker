import express from 'express';
import {
  createProject,
  getAllProjects,
  deleteProject,
  getProjectById,
  updateProject,
  getMyProjects,
} from '../controllers/ProjectController.js';

import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin-only: Create a project
router.post('/create', protect, adminOnly, createProject);


// Public or authenticated users: Get all projects
router.get('/allProject', getAllProjects);

// Get project by ID
router.get('/:id', protect, getProjectById);

// Admin-only: Delete a project
router.delete('/delete/:id', protect, adminOnly, deleteProject);

// Admin-only: Update a project
router.put('/:id', protect, adminOnly, updateProject);

// Show projects assigned to logged-in user
router.get('/my-projects/:id', protect, getMyProjects);




export default router;
