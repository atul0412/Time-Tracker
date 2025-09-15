import AuditLog from "../models/AuditLog.js";
import jwt from "jsonwebtoken";

// Helper function to extract user info (modified to exclude email from logs)
const extractUserInfo = (req, resData = null) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return {
        userId: decoded.userId,
        userEmail: decoded.email, // Keep for database storage but won't show in messages
        userName: decoded.name || decoded.firstName || ''
      };
    }
    
    if (resData && resData.user) {
      return {
        userId: resData.user._id,
        userEmail: resData.user.email, // Keep for database storage
        userName: resData.user.name || resData.user.firstName || ''
      };
    }
  } catch (error) {
    // Handle token errors silently
  }
  return null;
};

// Map HTTP methods to actions
const methodToAction = {
  POST: "CREATE",
  PUT: "UPDATE",
  PATCH: "UPDATE",
  DELETE: "DELETE",
};

// Extract resource type from URL
const extractResourceFromUrl = (url) => {
  const segments = url.split("/").filter(Boolean);

  // Handle specific assignment endpoints
  if (url.includes("/assignproject") || url.includes("/assign-project")) {
    return "assignproject";
  }

  if (segments.includes("api")) {
    const apiIndex = segments.indexOf("api");
    return segments[apiIndex + 1] || "unknown";
  }
  return segments[0] || "unknown";
};

// Extract resource ID from URL or request body
const extractResourceId = (req) => {
  if (req.params.id) return req.params.id;
  if (req.params.assignmentId) return req.params.assignmentId;
  if (req.body && req.body._id) return req.body._id;
  if (req.body && req.body.id) return req.body.id;
  if (req.body && req.body.projectId) return req.body.projectId;
  if (req.body && req.body.userId) return req.body.userId;
  return null;
};

// UPDATED: Generate customized audit messages based on resource and action
const generateAuditMessage = (
  action,
  resource,
  userEmail,
  userName,
  status,
  responseData,
  requestData = null
) => {
  const userIdentifier = userName || "Unknown User";

  if (status === "FAILURE") {
    return `Failed to ${action.toLowerCase()} ${resource.toLowerCase()} by ${userIdentifier}`;
  }

  switch (action) {
    case "LOGIN":
      return `${userIdentifier} logged in successfully`;
    case "LOGOUT":
      return `${userIdentifier} logged out successfully`;

    case "CREATE":
      // Customize messages based on resource type
      switch (resource.toLowerCase()) {
        case "users":
        case "register": // Handle both /users and /register endpoints
          // Extract new user name from response data
          const newUserName =
            responseData?.user?.name ||
            responseData?.user?.firstName ||
            responseData?.name ||
            responseData?.firstName ||
            requestData?.name || // Fallback to request data
            requestData?.firstName ||
            "New Employee";
          return `New employee ${newUserName} added successfully`;

        case "projects":
          const projectName =
            responseData?.project?.name ||
            responseData?.name ||
            requestData?.name ||
            "New Project";
          return `New project ${projectName} created successfully`;

        case "timesheets":
          // UPDATED: Show who created the timesheet
          const timesheetCreatedBy =
            responseData?.user?.name ||
            responseData?.user?.firstName ||
            responseData?.createdBy ||
            requestData?.userName ||
            userName ||
            "User";
          return `${timesheetCreatedBy} created a new timesheet successfully`;

        case "assignproject":
          // UPDATED: Extract project name, assigned user name, and assignedBy
          const assignedProjectName =
            responseData?.project?.name ||
            responseData?.data?.project?.name ||
            responseData?.assignment?.project?.name ||
            requestData?.projectName ||
            "Project";

          const assignedUserName =
            responseData?.user?.name ||
            responseData?.data?.user?.name ||
            responseData?.assignment?.user?.name ||
            requestData?.userName ||
            "User";

          const assignedBy =
            responseData?.assignedBy ||
            responseData?.data?.assignedBy ||
            userName ||
            "Admin";

          return `${assignedUserName} is assigned to ${assignedProjectName} project assigned by ${assignedBy} successfully`;

        default:
          return `${
            resource.charAt(0).toUpperCase() + resource.slice(1)
          } created successfully`;
      }

    case "UPDATE":
      // Customize update messages
      switch (resource.toLowerCase()) {
        case "users":
          const updatedUserName =
            responseData?.user?.name ||
            responseData?.user?.firstName ||
            responseData?.name ||
            responseData?.firstName ||
            requestData?.name ||
            requestData?.firstName ||
            "Employee";
          return `Employee ${updatedUserName} information updated successfully`;

        case "projects":
          const updatedProjectName =
            responseData?.project?.name ||
            responseData?.name ||
            requestData?.name ||
            "Project";
          return `Project ${updatedProjectName} updated successfully`;

        case "timesheets":
          // UPDATED: Show who updated the timesheet
          const timesheetUpdatedBy =
            responseData?.user?.name ||
            responseData?.user?.firstName ||
            responseData?.updatedBy ||
            requestData?.userName ||
            userName ||
            "User";
          return `${timesheetUpdatedBy} updated their timesheet successfully`;

        case "assignproject":
          // UPDATED: Handle project assignment updates
          const updatedAssignedProjectName =
            responseData?.project?.name ||
            responseData?.data?.project?.name ||
            requestData?.projectName ||
            "Project";

          const updatedAssignedUserName =
            responseData?.user?.name ||
            responseData?.data?.user?.name ||
            requestData?.userName ||
            "User";

          const updatedBy =
            responseData?.assignedBy ||
            responseData?.data?.assignedBy ||
            userName ||
            "Admin";

          return `Project assignment updated: ${updatedAssignedProjectName} to ${updatedAssignedUserName} by ${updatedBy}`;

        default:
          return `${
            resource.charAt(0).toUpperCase() + resource.slice(1)
          } updated successfully`;
      }

    case "DELETE":
      // Customize delete messages
      switch (resource.toLowerCase()) {
        case "users":
          const deletedUserName =
            responseData?.user?.name ||
            responseData?.name ||
            requestData?.name ||
            "Employee";
          return `Employee ${deletedUserName} removed successfully`;

        case "projects":
          const deletedProjectName =
            responseData?.project?.name ||
            responseData?.name ||
            requestData?.name ||
            "Project";
          return `Project ${deletedProjectName} deleted successfully`;

        case "timesheets":
          // UPDATED: Show who deleted the timesheet
          const timesheetDeletedBy =
            responseData?.user?.name ||
            responseData?.user?.firstName ||
            responseData?.deletedBy ||
            requestData?.userName ||
            userName ||
            "User";
          return `${timesheetDeletedBy} deleted their timesheet successfully`;

        case "assignproject":
          // UPDATED: Handle project assignment removal
          const removedAssignedProjectName =
            responseData?.project?.name ||
            responseData?.data?.project?.name ||
            responseData?.removedAssignment?.project?.name ||
            requestData?.projectName ||
            "Project";

          const removedAssignedUserName =
            responseData?.user?.name ||
            responseData?.data?.user?.name ||
            responseData?.removedAssignment?.user?.name ||
            requestData?.userName ||
            "User";

          const deassignedBy =
            responseData?.deassignedBy ||
            responseData?.data?.deassignedBy ||
            userName ||
            "Admin";

          return `${removedAssignedUserName} is removed from ${removedAssignedProjectName} project by ${deassignedBy}`;

        default:
          return `${
            resource.charAt(0).toUpperCase() + resource.slice(1)
          } deleted successfully`;
      }

    default:
      return `${action} performed on ${resource.toLowerCase()}`;
  }
};

export const auditLogger = (options = {}) => {
  return (req, res, next) => {
    // CRITICAL: Skip irrelevant requests that cause duplicates
    const skipEndpoints = [
      "/favicon.ico",
      "/robots.txt",
      "/sitemap.xml",
      "/health",
      "/ping",
      "/apple-touch-icon",
      ".css",
      ".js",
      ".png",
      ".jpg",
      ".ico",
    ];

    // Skip if URL matches any skip patterns
    if (skipEndpoints.some((endpoint) => req.originalUrl.includes(endpoint))) {
      return next();
    }

    // Skip OPTIONS requests (CORS preflight)
    if (req.method === "OPTIONS") {
      return next();
    }

    // CRITICAL: Prevent duplicate logging for same request
    if (req.auditLogged) {
      return next();
    }
    req.auditLogged = true;

    const originalJson = res.json;
    const originalSend = res.send;

    let responseData = null;
    let statusCode = null;
    let auditLogged = false; // Prevent multiple logs per response

    res.json = function (data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson.call(this, data);
    };

    res.send = function (data) {
      if (!responseData) {
        responseData = data;
        statusCode = res.statusCode;
      }
      return originalSend.call(this, data);
    };

    next();

    res.on("finish", async () => {
      // Prevent multiple finish events from logging
      if (auditLogged) return;
      auditLogged = true;

      try {
        let action = methodToAction[req.method];
        let resource = extractResourceFromUrl(req.originalUrl);

        // FIXED: Handle specific endpoints
        if (req.originalUrl.includes("/register")) {
          action = "CREATE";
          resource = "users";
        }

        // Handle assignment endpoints
        if (
          req.originalUrl.includes("/assignproject") ||
          req.originalUrl.includes("/assign-project")
        ) {
          resource = "assignproject";
        }

        // FIXED: Consistent resource naming for auth operations
        if (req.originalUrl.includes("/login")) {
          action = "LOGIN";
          resource = "auth";
        }

        if (req.originalUrl.includes("/logout")) {
          action = "LOGOUT";
          resource = "auth";
        }

        if (!action) return;

        // UPDATED: Enhanced user info extraction with fallback
        let userInfo = extractUserInfo(req, responseData);

        // CRITICAL: Fallback to req.user if user info extraction failed
        if (!userInfo || !userInfo.userName) {
          if (req.user) {
            userInfo = {
              userId: req.user.id || req.user.id,
              userEmail: req.user.email || "anonymous",
              userName: req.user.name || req.user.firstName || "Unknown User",
            };
          }
        }

        // For login/logout, try to get user info from response
        if (action === "LOGIN" ) {
          if (responseData && responseData.user) {
            userInfo = {
              userId: responseData.user.id,
              userEmail: responseData.user.email,
              userName: responseData.user.name || "",
            };
          }
        }
        userInfo = userInfo || {};
        const status = statusCode >= 400 ? "FAILURE" : "SUCCESS";

        const auditData = {
          userId: userInfo.userId || null,
          userName: userInfo.userName || "",
          userEmail: userInfo.userEmail || "anonymous",
          action: action,
          resource: resource,
          resourceId: extractResourceId(req),
          method: req.method,
          message: generateAuditMessage(
            action,
            resource,
            userInfo.userEmail,
            userInfo.userName,
            status,
            responseData,
            req.body
          ),
          // IP ADDRESS REMOVED AS REQUESTED
          userAgent: req.get("User-Agent"),
          sessionId: req.sessionID,
          status: status,
          errorMessage: statusCode >= 400 ? JSON.stringify(responseData) : null,
        };

        await AuditLog.create(auditData);
        console.log(
          `Audit Log Created: ${action} on ${resource} by ${
            userInfo.userName || "Unknown User"
          }`
        );
      } catch (error) {
        console.error("Audit logging failed:", error);
      }
    });
  };
};

export default auditLogger;
