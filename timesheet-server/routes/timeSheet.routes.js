import express from 'express';
import {
  submitTimesheet,
  getUserTimesheets,
  updateTimesheet,
  deleteTimesheet
} from '../controllers/timeSheetController.js';
import { adminOnly, protect } from '../middleware/authMiddleware.js';


const router = express.Router();

// Submit a timesheet (user)
router.post('/create-timesheet', protect, submitTimesheet);

// Get all timesheets for the logged-in user
router.get('/my', protect, getUserTimesheets);

// Admin-only: Update a specific timesheet
router.put('/:id', protect, adminOnly,  updateTimesheet);

// Admin-only: Delete a specific timesheet
router.delete('/:id', protect, adminOnly, deleteTimesheet);

export default router;
