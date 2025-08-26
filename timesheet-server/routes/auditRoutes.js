import express from 'express';
import {
  getAuditLogs,
  getAuditStats,
  getAuditLogById,
  exportAuditLogs,
  cleanupAuditLogs
} from '../controllers/auditController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const validateQuery = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  
  next();
};

// Apply authentication to all routes
router.use(protect);

/**
 * @route   GET /api/audit
 * @desc    Get audit logs with filtering and pagination
 * @access  Private (Admin/Manager)
 */
router.get(
  '/',
  adminOnly,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('userId').optional().isMongoId().withMessage('Invalid user ID format'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date'),
    // UPDATED: Removed 'VIEW' from action validation since it's not in your schema
    query('action').optional().isIn(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'UNKNOWN']).withMessage('Invalid action type'),
    query('status').optional().isIn(['SUCCESS', 'FAILURE', 'ERROR']).withMessage('Invalid status type'),
    query('resource').optional().isLength({ min: 1, max: 50 }).withMessage('Resource must be between 1 and 50 characters'),
    query('search').optional().isLength({ max: 200 }).withMessage('Search term too long')
  ],
  validateQuery,
  getAuditLogs
);

/**
 * @route   GET /api/audit/stats
 * @desc    Get audit log statistics
 * @access  Private (Admin/Manager)
 */
router.get(
  '/stats',
  adminOnly,
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date')
  ],
  validateQuery,
  getAuditStats
);

/**
 * @route   GET /api/audit/export
 * @desc    Export audit logs to CSV or JSON
 * @access  Private (Admin/Manager)
 */
router.get(
  '/export',
  adminOnly,
  [
    query('format').optional().isIn(['csv', 'json']).withMessage('Format must be csv or json'),
    query('userId').optional().isMongoId().withMessage('Invalid user ID format'),
    query('resource').optional().isLength({ min: 1, max: 50 }).withMessage('Resource must be between 1 and 50 characters'),
    query('action').optional().isIn(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'UNKNOWN']).withMessage('Invalid action type'),
    query('status').optional().isIn(['SUCCESS', 'FAILURE', 'ERROR']).withMessage('Invalid status type'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date')
  ],
  validateQuery,
  exportAuditLogs
);

/**
 * @route   GET /api/audit/:id
 * @desc    Get a specific audit log by ID
 * @access  Private (Admin/Manager)
 */
router.get(
  '/:id',
  adminOnly,
  [
    param('id').isMongoId().withMessage('Invalid audit log ID')
  ],
  validateQuery,
  getAuditLogById
);

/**
 * @route   DELETE /api/audit/cleanup
 * @desc    Clean up old audit logs
 * @access  Private (Admin/Manager)
 */
router.delete(
  '/cleanup',
  adminOnly,
  [
    body('daysToKeep').optional().isInt({ min: 1, max: 365 }).withMessage('Days to keep must be between 1 and 365')
  ],
  validateQuery,
  cleanupAuditLogs
);

/**
 * @route   GET /api/audit/user/:userId
 * @desc    Get audit logs for a specific user
 * @access  Private (Admin/Manager)
 */
router.get(
  '/user/:userId',
  adminOnly,
  [
    param('userId').isMongoId().withMessage('Invalid user ID format'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date'),
    query('action').optional().isIn(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'UNKNOWN']).withMessage('Invalid action type'),
    query('status').optional().isIn(['SUCCESS', 'FAILURE', 'ERROR']).withMessage('Invalid status type')
  ],
  validateQuery,
  (req, res, next) => {
    // Set userId from params to query for the controller to use
    req.query.userId = req.params.userId;
    next();
  },
  getAuditLogs
);

/**
 * @route   GET /api/audit/resource/:resource
 * @desc    Get audit logs for a specific resource
 * @access  Private (Admin/Manager)
 */
router.get(
  '/resource/:resource',
  adminOnly,
  [
    param('resource').isLength({ min: 1, max: 50 }).withMessage('Resource must be between 1 and 50 characters'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date'),
    query('action').optional().isIn(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'UNKNOWN']).withMessage('Invalid action type'),
    query('status').optional().isIn(['SUCCESS', 'FAILURE', 'ERROR']).withMessage('Invalid status type')
  ],
  validateQuery,
  (req, res, next) => {
    // Set resource from params to query for the controller to use
    req.query.resource = req.params.resource;
    next();
  },
  getAuditLogs
);

export default router;
