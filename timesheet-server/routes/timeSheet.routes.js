import express from 'express';
import {
  submitTimesheet,
  updateTimesheet,
  deleteTimesheet,
  getTimesheetsByProject,
  getTimesheetsByUserAndProject
} from '../controllers/timeSheetController.js';
import { adminOnly, protect } from '../middleware/authMiddleware.js';


const router = express.Router();

// Submit a timesheet (user)
router.post('/create-timesheet', protect, submitTimesheet);

router.get('/project/:id', getTimesheetsByProject);


// ✅ NEW: GET /timesheets/:userId/:projectId - Get timesheets by user + project
router.get('/:userId/:projectId', getTimesheetsByUserAndProject)

// Admin-only: Update a specific timesheet
router.put('/:id', protect,  updateTimesheet);

// Admin-only: Delete a specific timesheet
router.delete('/:id', protect, deleteTimesheet);

export default router;
