// Role-based access control middleware

/**
 * Middleware to check if user has required role(s)
 * @param {...string} roles - Required roles (e.g., 'admin', 'student')
 * @returns {Function} Express middleware function
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated (should be set by auth middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: "NOT_AUTHENTICATED",
            message: "Authentication required. Please log in first.",
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check if user has required role
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: `Access denied. Required role(s): ${roles.join(
              ", "
            )}. Your role: ${req.user.role}`,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // User has required role, proceed
      next();
    } catch (error) {
      console.error("Role check middleware error:", error);
      return res.status(500).json({
        success: false,
        error: {
          code: "ROLE_CHECK_ERROR",
          message: "Role verification failed due to server error.",
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Middleware to check if user is an admin
 */
const requireAdmin = requireRole("admin");

/**
 * Middleware to check if user is a student
 */
const requireStudent = requireRole("student");

/**
 * Middleware to check if user is either admin or student (any authenticated user)
 */
const requireAuth = requireRole("admin", "student");

/**
 * Middleware to check if user can access their own resources or is an admin
 * Expects userId parameter in request params or body
 * @param {string} userIdField - Field name to check for user ID (default: 'userId')
 */
const requireOwnershipOrAdmin = (userIdField = "userId") => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: "NOT_AUTHENTICATED",
            message: "Authentication required. Please log in first.",
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Admin can access any resource
      if (req.user.role === "admin") {
        return next();
      }

      // Get user ID from params or body
      const targetUserId = req.params[userIdField] || req.body[userIdField];

      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_USER_ID",
            message: `User ID parameter '${userIdField}' is required.`,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check if user is accessing their own resource
      if (req.user._id.toString() !== targetUserId.toString()) {
        return res.status(403).json({
          success: false,
          error: {
            code: "ACCESS_DENIED",
            message: "You can only access your own resources.",
            timestamp: new Date().toISOString(),
          },
        });
      }

      next();
    } catch (error) {
      console.error("Ownership check middleware error:", error);
      return res.status(500).json({
        success: false,
        error: {
          code: "OWNERSHIP_CHECK_ERROR",
          message: "Resource access verification failed due to server error.",
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Middleware to check if user can access student resources
 * Students can only access their own resources, admins can access any
 */
const requireStudentAccess = requireOwnershipOrAdmin("studentId");

/**
 * Middleware to log access attempts for auditing
 */
const logAccess = (req, res, next) => {
  const logData = {
    timestamp: new Date().toISOString(),
    userId: req.user ? req.user._id : "anonymous",
    userRole: req.user ? req.user.role : "none",
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
  };

  console.log("Access Log:", JSON.stringify(logData));
  next();
};

module.exports = {
  requireRole,
  requireAdmin,
  requireStudent,
  requireAuth,
  requireOwnershipOrAdmin,
  requireStudentAccess,
  logAccess,
};
