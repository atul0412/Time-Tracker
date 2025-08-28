import express from 'express';
import {
  getAuditLogs,
  getAuditStats,
  getAuditLogById,
  exportAuditLogs,
  cleanupAuditLogs
} from '../controllers/auditController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

/**
 * @route   GET /api/audit
 * @desc    Get audit logs with filtering and pagination
 * @access  Private (Admin/Manager)
 */
router.get('/',protect, getAuditLogs);

/**
 * @route   GET /api/audit/stats
 * @desc    Get audit log statistics
 * @access  Private (Admin/Manager)
 */
router.get('/stats',protect, getAuditStats);

/**
 * @route   GET /api/audit/export
 * @desc    Export audit logs to CSV or JSON
 * @access  Private (Admin/Manager)
 */
router.get('/export',protect, exportAuditLogs);

/**
 * @route   GET /api/audit/:id
 * @desc    Get a specific audit log by ID
 * @access  Private (Admin/Manager)
 */
router.get('/:id',protect, getAuditLogById);


/**
 * @route   DELETE /api/audit/cleanup
 * @desc    Clean up old audit logs
 * @access  Private (Admin/Manager)
 */
router.delete('/cleanup',protect, cleanupAuditLogs);

export default router;
