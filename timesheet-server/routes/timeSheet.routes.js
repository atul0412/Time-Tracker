import express from 'express';
import {
  submitTimesheet,
  updateTimesheet,
  deleteTimesheet,
  getTimesheetsByProject
} from '../controllers/timeSheetController.js';
import { adminOnly, protect } from '../middleware/authMiddleware.js';


const router = express.Router();

// Submit a timesheet (user)
router.post('/create-timesheet', protect, submitTimesheet);

router.get('/project/:id', getTimesheetsByProject);

// Admin-only: Update a specific timesheet
router.put('/:id', protect, adminOnly,  updateTimesheet);

// Admin-only: Delete a specific timesheet
router.delete('/:id', protect, adminOnly, deleteTimesheet);

export default router;
