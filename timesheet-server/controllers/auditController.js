import AuditLog from "../models/AuditLog.js";
import Project from "../models/project.js";
import AssignedProject from "../models/assignedProject.js";
import mongoose from "mongoose";

/**
 * Get audit logs with role-based filtering and pagination
 */
export const getAuditLogs = async (req, res) => {
  try {
    const startTime = Date.now();
    const {
      page = 1,
      limit = 15,
      userId,
      resource,
      action,
      startDate,
      endDate,
      status,
      search,
      projectId,
    } = req.query;

    let baseFilter = {};
    let allowedUserIds = [];
    let allowedProjectIds = [];

    // ROLE-BASED FILTERING
    if (req.user.role === "admin") {
      // Admin can see all logs - no base filtering needed
    } else if (req.user.role === "project_manager") {
      try {
        // Get projects managed by this project manager
        const managedProjects = await Project.find({
          projectManagers: req.user._id,
        }).select("_id");
        allowedProjectIds = managedProjects.map((p) => p._id.toString());

        // Get users assigned to these projects
        const assignedUsers = await AssignedProject.find({
          project: { $in: allowedProjectIds },
        })
          .populate("user")
          .select("user");
        allowedUserIds = assignedUsers.map((a) => a.user._id.toString());
        allowedUserIds.push(req.user._id.toString());

        // Project view: if projectId is provided, restrict to that
        if (projectId && allowedProjectIds.includes(projectId)) {
          baseFilter = {
            $or: [
              { resource: "projects", resourceId: projectId },
              { resource: "assignproject", resourceId: projectId },
              { "metadata.projectId": projectId },
              { resourceId: projectId },
              { resource: "timesheets", userId: { $in: allowedUserIds } },
              { resource: "auth", userId: { $in: allowedUserIds } },
              { resource: "users", userId: { $in: allowedUserIds } },
            ],
          };
        } else {
          // All managed projects and users
          baseFilter = {
            $or: [
              { resource: "projects", resourceId: { $in: allowedProjectIds } },
              { resource: "assignproject", resourceId: { $in: allowedProjectIds } },
              {
                resource: "assignments",
                $or: [
                  { resourceId: { $in: allowedProjectIds } },
                  { "metadata.projectId": { $in: allowedProjectIds } },
                ],
              },
              { resource: "timesheets", userId: { $in: allowedUserIds } },
              { resource: "auth", userId: { $in: allowedUserIds } },
              { resource: "users", userId: { $in: allowedUserIds } },
              { userId: { $in: allowedUserIds } },
            ],
          };
        }
      } catch (error) {
        console.error("Error building project manager filter:", error);
        baseFilter = { userId: req.user._id };
        allowedUserIds = [req.user._id.toString()];
      }
    } else {
      baseFilter = { userId: req.user._id };
      allowedUserIds = [req.user._id.toString()];
    }

    // Build final filter with extra conditions from query string
    let finalFilter = { ...baseFilter };
    const additionalConditions = [];
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      if (req.user.role === "admin" || allowedUserIds.includes(userId)) {
        additionalConditions.push({ userId: userId });
      }
    }
    if (resource) additionalConditions.push({ resource: resource });
    if (action) additionalConditions.push({ action: action });
    if (status) additionalConditions.push({ status: status });
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      additionalConditions.push({ createdAt: dateFilter });
    }
    if (search) {
      additionalConditions.push({
        $or: [
          { userEmail: { $regex: search, $options: "i" } },
          { userName: { $regex: search, $options: "i" } },
          { message: { $regex: search, $options: "i" } },
          { resource: { $regex: search, $options: "i" } },
          { errorMessage: { $regex: search, $options: "i" } },
        ],
      });
    }
    if (additionalConditions.length > 0) {
      if (Object.keys(baseFilter).length > 0) {
        finalFilter = { $and: [baseFilter, ...additionalConditions] };
      } else {
        finalFilter = additionalConditions.length === 1 ? additionalConditions[0] : { $and: additionalConditions };
      }
    }

    // Paginate with populate and lean
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: { path: "userId", select: "name email role", strictPopulate: false },
      lean: true,
    };
    let auditLogs = await AuditLog.paginate(finalFilter, options);
    const queryTime = Date.now() - startTime;

    if (auditLogs.docs) {
      auditLogs.docs = auditLogs.docs.map((log) => ({
        ...log,
        userName: log.userId?.name || log.userName || "Unknown User",
        userEmail: log.userId?.email || log.userEmail || "No Email",
      }));
    }

    res.json({
      success: true,
      filter: finalFilter,
      message: "Audit logs retrieved successfully",
      data: auditLogs,
      userRole: req.user.role,
      queryTime: queryTime,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching audit logs",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};


/**
 * Get audit log statistics with role-based filtering
 */
export const getAuditStats = async (req, res) => {
  try {
    const startTime = Date.now();
    const { startDate, endDate, projectId } = req.query;

    let baseFilter = {};
    if (startDate || endDate) {
      baseFilter.createdAt = {};
      if (startDate) baseFilter.createdAt.$gte = new Date(startDate);
      if (endDate) baseFilter.createdAt.$lte = new Date(endDate);
    }

    let matchQuery = { ...baseFilter };

    if (req.user.role === "admin") {
      // Admin sees all stats
    } else if (req.user.role === "project_manager") {
      try {
        const managedProjects = await Project.find({
          projectManagers: req.user._id,
        }).select("_id");
        const projectIds = managedProjects.map((p) => p._id.toString());
        const assignedUsers = await AssignedProject.find({
          project: { $in: projectIds },
        })
          .populate("user")
          .select("user");
        const userIds = assignedUsers.map((a) => a.user._id.toString());
        userIds.push(req.user._id.toString());

        if (projectId && projectIds.includes(projectId)) {
          matchQuery = {
            ...baseFilter,
            $or: [
              { resource: "projects", resourceId: projectId },
              { resource: "assignproject", resourceId: projectId },
              { "metadata.projectId": projectId },
              { resourceId: projectId },
              { resource: "timesheets", userId: { $in: userIds } },
              { resource: "auth", userId: { $in: userIds } },
              { resource: "users", userId: { $in: userIds } },
            ],
          };
        } else {
          matchQuery = {
            ...baseFilter,
            $or: [
              { resource: "projects", resourceId: { $in: projectIds } },
              { resource: "assignproject", resourceId: { $in: projectIds } },
              {
                resource: "assignments",
                $or: [
                  { resourceId: { $in: projectIds } },
                  { "metadata.projectId": { $in: projectIds } },
                ],
              },
              { resource: "timesheets", userId: { $in: userIds } },
              { resource: "auth", userId: { $in: userIds } },
              { resource: "users", userId: { $in: userIds } },
              { userId: { $in: userIds } },
            ],
          };
        }
      } catch (error) {
        console.error("Error building project manager stats filter:", error);
        matchQuery = { ...baseFilter, userId: req.user._id };
      }
    } else {
      matchQuery = { ...baseFilter, userId: req.user._id };
    }

    const totalLogs = await AuditLog.countDocuments(matchQuery);
    const successCount = await AuditLog.countDocuments({ ...matchQuery, status: "SUCCESS" });
    const failureCount = await AuditLog.countDocuments({ ...matchQuery, status: "FAILURE" });
    const errorCount = await AuditLog.countDocuments({ ...matchQuery, status: "ERROR" });

    const uniqueUsersAgg = await AuditLog.aggregate([
      { $match: matchQuery },
      { $group: { _id: "$userId" } },
      { $count: "uniqueUsers" },
    ]);
    const uniqueUsers = uniqueUsersAgg.length > 0 ? uniqueUsersAgg[0].uniqueUsers : 0;

    const actionStats = await AuditLog.aggregate([
      { $match: matchQuery },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const resourceStats = await AuditLog.aggregate([
      { $match: matchQuery },
      { $group: { _id: "$resource", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const statusStats = [
      { _id: "SUCCESS", count: successCount },
      { _id: "FAILURE", count: failureCount },
      { _id: "ERROR", count: errorCount },
    ].filter((stat) => stat.count > 0);

    const topUsers = await AuditLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$userEmail",
          userName: { $first: "$userName" },
          count: { $sum: 1 },
          lastActivity: { $max: "$createdAt" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const recentFailures = await AuditLog.find({
      ...matchQuery,
      status: "FAILURE",
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("userEmail userName action resource message createdAt errorMessage")
      .lean();

    const queryTime = Date.now() - startTime;

    res.json({
      success: true,
      message: "Audit statistics retrieved successfully",
      data: {
        summary: {
          totalLogs,
          successCount,
          failureCount,
          errorCount,
          uniqueUsers,
          actionStats,
          resourceStats,
          statusStats,
        },
        topUsers,
        recentFailures,
      },
      queryTime: queryTime,
    });
  } catch (error) {
    console.error("Error generating audit statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error generating audit statistics",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

/**
 * Get audit log by ID (with role-based access)
 */
export const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid audit log ID",
      });
    }
    let auditLog = await AuditLog.findById(id)
      .populate("userId", "name email role")
      .lean();

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found",
      });
    }
    // Role-based access
    if (req.user.role !== "admin") {
      if (req.user.role === "project_manager") {
        const managedProjects = await Project.find({
          projectManagers: req.user._id,
        }).select("_id");
        const projectIds = managedProjects.map((p) => p._id.toString());
        const assignedUsers = await AssignedProject.find({
          project: { $in: projectIds },
        })
          .populate("user")
          .select("user");
        const userIds = assignedUsers.map((a) => a.user._id.toString());
        userIds.push(req.user._id.toString());
        const hasAccess =
          (auditLog.resource === "projects" &&
            projectIds.includes(auditLog.resourceId)) ||
          (auditLog.resource === "assignproject" &&
            projectIds.includes(auditLog.resourceId)) ||
          (auditLog.resource === "timesheets" &&
            userIds.includes(auditLog.userId?.toString())) ||
          (auditLog.resource === "auth" &&
            ["LOGIN", "LOGOUT"].includes(auditLog.action) &&
            userIds.includes(auditLog.userId?.toString())) ||
          (auditLog.resource === "users" &&
            userIds.includes(auditLog.userId?.toString()));
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: "Access denied to this audit log",
          });
        }
      } else {
        if (auditLog.userId?.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "Access denied to this audit log",
          });
        }
      }
    }
    auditLog = {
      ...auditLog,
      userName: auditLog.userId?.name || auditLog.userName || "Unknown User",
      userEmail: auditLog.userId?.email || auditLog.userEmail || "No Email",
    };
    res.json({
      success: true,
      message: "Audit log retrieved successfully",
      data: auditLog,
    });
  } catch (error) {
    console.error("Error fetching audit log:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching audit log",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

/**
 * Export audit logs to CSV or JSON (with role-based filtering)
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
      projectId,
      format = "csv",
    } = req.query;
    let filter = {};

    // Admin and managers: restrict by projectId if present!
    if (req.user.role === "admin") {
      // nothing
    } else if (req.user.role === "project_manager") {
      try {
        const managedProjects = await Project.find({
          projectManagers: req.user._id,
        }).select("_id");
        const projectIds = managedProjects.map((p) => p._id.toString());
        const assignedUsers = await AssignedProject.find({
          project: { $in: projectIds },
        })
          .populate("user")
          .select("user");
        const userIds = assignedUsers.map((a) => a.user._id.toString());
        userIds.push(req.user._id.toString());

        if (projectId && projectIds.includes(projectId)) {
          filter = {
            $or: [
              { resource: "projects", resourceId: projectId },
              { resource: "assignproject", resourceId: projectId },
              { "metadata.projectId": projectId },
              { resourceId: projectId },
              { resource: "timesheets", userId: { $in: userIds } },
              { resource: "auth", userId: { $in: userIds } },
              { resource: "users", userId: { $in: userIds } },
            ],
          };
        } else {
          filter = {
            $or: [
              { resource: "projects", resourceId: { $in: projectIds } },
              { resource: "assignproject", resourceId: { $in: projectIds } },
              {
                resource: "assignments",
                $or: [
                  { resourceId: { $in: projectIds } },
                  { "metadata.projectId": { $in: projectIds } },
                ],
              },
              { resource: "timesheets", userId: { $in: userIds } },
              { resource: "auth", userId: { $in: userIds } },
              { resource: "users", userId: { $in: userIds } },
              { userId: { $in: userIds } },
            ],
          };
        }
      } catch {
        filter = { userId: req.user._id };
      }
    } else {
      filter = { userId: req.user._id };
    }
    // Query string filters
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
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    auditLogs = auditLogs.map((log) => ({
      ...log,
      userName: log.userId?.name || log.userName || "Unknown User",
      userEmail: log.userId?.email || log.userEmail || "No Email",
    }));
    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", 'attachment; filename="audit-logs.json"');
      return res.json(auditLogs);
    }
    // CSV headers
    const csvHeaders = [
      "Timestamp",
      "User Name",
      "User Email",
      "Action",
      "Resource",
      "Resource ID",
      "Method",
      "Message",
      "Status",
    ].join(",");
    // CSV rows
    const csvRows = auditLogs.map((log) =>
      [
        new Date(log.createdAt).toISOString(),
        `"${log.userName || ""}"`,
        `"${log.userEmail || ""}"`,
        log.action || "",
        log.resource || "",
        log.resourceId || "",
        log.method || "",
        `"${(log.message || "").replace(/"/g, '""')}"`,
        log.status || "",
      ].join(",")
    );
    const csvContent = [csvHeaders, ...csvRows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="audit-logs.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting audit logs",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};

/**
 * Delete old audit logs (cleanup) - Admin only
 */
export const cleanupAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Admin only",
      });
    }
    const { daysToKeep = 90 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysToKeep));
    const result = await AuditLog.deleteMany({
      createdAt: { $lt: cutoffDate },
    });
    res.json({
      success: true,
      message: `Cleanup completed. Deleted ${result.deletedCount} audit logs older than ${daysToKeep} days`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error cleaning up audit logs:", error);
    res.status(500).json({
      success: false,
      message: "Error cleaning up audit logs",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};
