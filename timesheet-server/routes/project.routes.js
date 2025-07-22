import express from 'express';
import {
  createProject,
  getAllProjects,
  deleteProject
} from '../controllers/ProjectController.js';

import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin-only: Create a project
router.post('/create', protect, adminOnly, createProject);

// Public or authenticated users: Get all projects
router.get('/allProject', protect, getAllProjects);

// Admin-only: Delete a project
router.delete('/delete/:id', protect, adminOnly, deleteProject);

export default router;
