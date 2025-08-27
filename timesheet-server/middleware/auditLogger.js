import AuditLog from '../models/AuditLog.js';
import jwt from 'jsonwebtoken';

// Helper function to extract user info from token (UPDATED)
const extractUserInfo = (req) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return {
        userId: decoded.userId,
        userEmail: decoded.email,
        userName: decoded.name || decoded.firstName || '' // Add userName from token
      };
    }
  } catch (error) {
    // Handle token errors silently for audit logging
  }
  return null;
};

// Map HTTP methods to actions (removed GET/VIEW)
const methodToAction = {
  'POST': 'CREATE',
  'PUT': 'UPDATE',
  'PATCH': 'UPDATE',
  'DELETE': 'DELETE'
};

// Extract resource type from URL
const extractResourceFromUrl = (url) => {
  const segments = url.split('/').filter(Boolean);
  if (segments.includes('api')) {
    const apiIndex = segments.indexOf('api');
    return segments[apiIndex + 1] || 'unknown';
  }
  return segments[0] || 'unknown';
};

// Extract resource ID from URL or request body
const extractResourceId = (req) => {
  if (req.params.id) return req.params.id;
  if (req.body && req.body._id) return req.body._id;
  if (req.body && req.body.id) return req.body.id;
  return null;
};

// Generate context-aware audit message (UPDATED to use userName when available)
const generateAuditMessage = (action, resource, userEmail, userName, status, responseData, req) => {
  const resourceName = resource.charAt(0).toUpperCase() + resource.slice(1);
  const userIdentifier = userName ? `${userName} (${userEmail})` : userEmail;
  
  // Handle failure cases
  if (status === 'FAILURE') {
    return `Failed to ${action.toLowerCase()} ${resourceName.toLowerCase()} by ${userIdentifier}`;
  }

  // Generate success messages based on action and response
  switch (action) {
    case 'CREATE':
      if (responseData?.message) {
        return responseData.message;
      }
      if (responseData?.success) {
        return `${resourceName} created successfully by ${userIdentifier}`;
      }
      return `${resourceName} created by ${userIdentifier}`;

    case 'UPDATE':
      if (responseData?.message) {
        return responseData.message;
      }
      if (responseData?.success) {
        return `${resourceName} updated successfully by ${userIdentifier}`;
      }
      return `${resourceName} updated by ${userIdentifier}`;

    case 'DELETE':
      if (responseData?.message) {
        return responseData.message;
      }
      if (responseData?.success) {
        return `${resourceName} deleted successfully by ${userIdentifier}`;
      }
      return `${resourceName} deleted by ${userIdentifier}`;

    case 'LOGIN':
      if (responseData?.message) {
        return responseData.message;
      }
      return `User ${userIdentifier} logged in successfully`;

    case 'LOGOUT':
      if (responseData?.message) {
        return responseData.message;
      }
      return `User ${userIdentifier} logged out successfully`;

    default:
      if (responseData?.message) {
        return responseData.message;
      }
      return `${action} performed on ${resourceName.toLowerCase()} by ${userIdentifier}`;
  }
};

export const auditLogger = (options = {}) => {
  return async (req, res, next) => {
    // Skip certain endpoints if specified
    const skipEndpoints = options.skipEndpoints || ['/health', '/ping'];
    if (skipEndpoints.some(endpoint => req.originalUrl.includes(endpoint))) {
      return next();
    }

    const userInfo = extractUserInfo(req);
    
    // Skip audit logging if no user info (for public endpoints)
    if (!userInfo && options.requireAuth !== false) {
      return next();
    }

    // Skip GET requests (VIEW actions) - only log CREATE, UPDATE, DELETE
    const action = methodToAction[req.method];
    if (!action) {
      return next();
    }

    // Capture the original res.json and res.send functions
    const originalJson = res.json;
    const originalSend = res.send;
    
    let responseData = null;
    let statusCode = null;

    // Override res.json to capture response
    res.json = function(data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson.call(this, data);
    };

    // Override res.send to capture response
    res.send = function(data) {
      if (!responseData) {
        responseData = data;
        statusCode = res.statusCode;
      }
      return originalSend.call(this, data);
    };

    // Continue with the request
    next();

    // Log audit trail after response is sent
    res.on('finish', async () => {
      try {
        const resource = extractResourceFromUrl(req.originalUrl);
        const userEmail = userInfo?.userEmail || 'anonymous';
        const userName = userInfo?.userName || ''; // Extract userName
        const status = statusCode >= 400 ? 'FAILURE' : 'SUCCESS';

        // UPDATED: Include userName in audit data
        const auditData = {
          userId: userInfo?.userId || null,
          userName: userName, // NEW: Include userName field
          userEmail: userEmail,
          action: action,
          resource: resource,
          resourceId: extractResourceId(req),
          method: req.method,
          message: generateAuditMessage(action, resource, userEmail, userName, status, responseData, req),
          ipAddress: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
          userAgent: req.get('User-Agent'),
          sessionId: req.sessionID,
          status: status,
          errorMessage: statusCode >= 400 ? JSON.stringify(responseData) : null
        };

        await AuditLog.create(auditData);
      } catch (error) {
        console.error('Audit logging failed:', error);
        // Don't let audit logging failures affect the main application
      }
    });
  };
};

export default auditLogger;
