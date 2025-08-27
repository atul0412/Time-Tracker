import AuditLog from '../models/AuditLog.js';
import mongoose from 'mongoose';

/**
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      resource,
      action,
      startDate,
      endDate,
      status,
      search
    } = req.query;

    // Build filter object
    const filter = {};

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = userId;
    }

    if (resource) {
      filter.resource = { $regex: resource, $options: 'i' };
    }

    if (action) {
      filter.action = action;
    }

    if (status) {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // UPDATED: Search across multiple fields including userName
    if (search) {
      filter.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } }, // NEW: Search by userName
        { message: { $regex: search, $options: 'i' } },
        { resource: { $regex: search, $options: 'i' } },
        { errorMessage: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'userId',
        select: 'name email role', // Make sure your User schema has 'name' and 'email' fields
        strictPopulate: false
      },
      lean: true
    };

    let auditLogs = await AuditLog.paginate(filter, options);

    // CRITICAL FIX: Map populated data to flat structure for frontend
    if (auditLogs.docs) {
      auditLogs.docs = auditLogs.docs.map(log => ({
        ...log,
        // Use populated data if available, otherwise fall back to stored values
        userName: log.userId?.name || log.userName || 'Unknown User',
        userEmail: log.userId?.email || log.userEmail || 'No Email'
      }));
    }

    res.json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: auditLogs
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit logs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get audit log statistics
 */
export const getAuditStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Action statistics
    const actionStats = await AuditLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Resource statistics
    const resourceStats = await AuditLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$resource',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Status statistics
    const statusStats = await AuditLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // UPDATED: Top users by activity - now includes userName
    const topUsers = await AuditLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$userEmail',
          userName: { $first: '$userName' }, // NEW: Include userName in grouping
          count: { $sum: 1 },
          lastActivity: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // UPDATED: Recent failed attempts - include userName
    const recentFailures = await AuditLog.find({
      ...dateFilter,
      status: 'FAILURE'
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('userEmail userName action resource message createdAt errorMessage') // UPDATED: Include userName
      .lean();

    // Total count
    const totalLogs = await AuditLog.countDocuments(dateFilter);

    res.json({
      success: true,
      message: 'Audit statistics retrieved successfully',
      data: {
        summary: {
          totalLogs,
          actionStats,
          resourceStats,
          statusStats
        },
        topUsers,
        recentFailures
      }
    });
  } catch (error) {
    console.error('Error generating audit statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating audit statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get audit log by ID
 */
export const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid audit log ID'
      });
    }

    let auditLog = await AuditLog.findById(id)
      .populate('userId', 'name email role')
      .lean();

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    // ADDED: Map populated data for single log too
    auditLog = {
      ...auditLog,
      userName: auditLog.userId?.name || auditLog.userName || 'Unknown User',
      userEmail: auditLog.userId?.email || auditLog.userEmail || 'No Email'
    };

    res.json({
      success: true,
      message: 'Audit log retrieved successfully',
      data: auditLog
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit log',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Export audit logs to CSV or JSON
 */
export const exportAuditLogs = async (req, res) => {
  try {
    const {
      userId,
      resource,
      action,
      startDate,
      endDate,
      status,
      format = 'csv'
    } = req.query;

    // Build filter object
    const filter = {};

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = userId;
    }
    if (resource) filter.resource = resource;
    if (action) filter.action = action;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    let auditLogs = await AuditLog.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10000) // Limit export size
      .lean();

    // ADDED: Map populated data for export too
    auditLogs = auditLogs.map(log => ({
      ...log,
      userName: log.userId?.name || log.userName || 'Unknown User',
      userEmail: log.userId?.email || log.userEmail || 'No Email'
    }));

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.json"');
      return res.json(auditLogs);
    }

    // UPDATED: CSV format headers to include userName
    const csvHeaders = [
      'Timestamp',
      'User Name', // UPDATED: Better formatting
      'User Email',
      'Action',
      'Resource',
      'Resource ID',
      'Method',
      'Message',
      'Status',
      'IP Address',
      'User Agent',
      'Error Message'
    ].join(',');

    // UPDATED: CSV rows to include userName
    const csvRows = auditLogs.map(log => [
      new Date(log.createdAt).toISOString(),
      `"${log.userName || ''}"`, // NEW: Include userName
      `"${log.userEmail || ''}"`,
      log.action || '',
      log.resource || '',
      log.resourceId || '',
      log.method || '',
      `"${(log.message || '').replace(/"/g, '""')}"`,
      log.status || '',
      log.ipAddress || '',
      `"${(log.userAgent || '').substring(0, 100)}"`,
      `"${(log.errorMessage || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting audit logs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete old audit logs (cleanup)
 */
export const cleanupAuditLogs = async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysToKeep));

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Cleanup completed. Deleted ${result.deletedCount} audit logs older than ${daysToKeep} days`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up audit logs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
