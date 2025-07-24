const Submission = require("../models/Submission");

/**
 * Enhanced exam security middleware
 * Implements comprehensive anti-cheating measures and session monitoring
 */
class ExamSecurityMiddleware {
  /**
   * Main security middleware for exam routes
   */
  static examSecurityCheck = async (req, res, next) => {
    try {
      const { id: examId } = req.params;
      const studentId = req.user.id;
      const browserInfo = req.browserInfo;

      // Find active submission
      const submission = await Submission.findOne({
        examId,
        studentId,
        isCompleted: false,
      });

      if (!submission) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NO_ACTIVE_SESSION",
            message: "No active exam session found",
          },
        });
      }

      // Perform security checks
      const securityChecks = await ExamSecurityMiddleware.performSecurityChecks(
        submission,
        browserInfo,
        req
      );

      // If critical security violations, block access
      if (securityChecks.blockAccess) {
        await ExamSecurityMiddleware.logSecurityViolation(
          submission,
          securityChecks,
          req
        );

        return res.status(403).json({
          success: false,
          error: {
            code: "SECURITY_VIOLATION",
            message: "Access denied due to security policy violation",
            details: securityChecks.violations,
          },
        });
      }

      // Log warnings but allow access
      if (securityChecks.warnings.length > 0) {
        await ExamSecurityMiddleware.logSecurityWarning(
          submission,
          securityChecks,
          req
        );
      }

      // Update session tracking
      await ExamSecurityMiddleware.updateSessionTracking(
        submission,
        browserInfo
      );

      // Add security info to request
      req.examSecurity = securityChecks;
      req.examSession = submission;

      next();
    } catch (error) {
      console.error("Exam security check error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "SECURITY_CHECK_ERROR",
          message: "Failed to perform security checks",
        },
      });
    }
  };

  /**
   * Perform comprehensive security checks
   */
  static async performSecurityChecks(submission, browserInfo, req) {
    const checks = {
      blockAccess: false,
      warnings: [],
      violations: [],
      score: 0, // Security score (0-100, lower is more suspicious)
    };

    // Check 1: Browser consistency
    if (
      submission.userAgent &&
      submission.userAgent !== browserInfo.userAgent
    ) {
      checks.warnings.push("Browser change detected");
      checks.score += 20;
    }

    // Check 2: IP address consistency
    if (submission.ipAddress && submission.ipAddress !== browserInfo.clientIp) {
      checks.warnings.push("IP address change detected");
      checks.score += 15;
    }

    // Check 3: Suspicious user agent
    if (browserInfo.isSuspicious) {
      checks.violations.push("Suspicious browser detected");
      checks.blockAccess = true;
      checks.score += 50;
    }

    // Check 4: Multiple rapid requests (potential automation)
    const recentActivity = await ExamSecurityMiddleware.checkRecentActivity(
      submission._id
    );
    if (recentActivity.isRapid) {
      checks.warnings.push("Rapid request pattern detected");
      checks.score += 25;
    }

    // Check 5: Session duration anomalies
    const sessionDuration = Date.now() - submission.startedAt.getTime();
    const maxDuration = 8 * 60 * 60 * 1000; // 8 hours max
    if (sessionDuration > maxDuration) {
      checks.violations.push("Session duration exceeded maximum limit");
      checks.blockAccess = true;
      checks.score += 30;
    }

    // Check 6: Browser capabilities (JavaScript enabled, etc.)
    const jsEnabled = req.headers["x-js-enabled"];
    if (jsEnabled === "false") {
      checks.violations.push("JavaScript disabled");
      checks.blockAccess = true;
      checks.score += 40;
    }

    // Check 7: Screen resolution and window size (if provided)
    const screenInfo = req.headers["x-screen-info"];
    if (screenInfo) {
      try {
        const screen = JSON.parse(screenInfo);
        if (screen.width < 800 || screen.height < 600) {
          checks.warnings.push("Small screen resolution detected");
          checks.score += 10;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Check 8: Time zone consistency
    const timezone = req.headers["x-timezone"];
    if (submission.timezone && timezone && submission.timezone !== timezone) {
      checks.warnings.push("Timezone change detected");
      checks.score += 15;
    }

    return checks;
  }

  /**
   * Check for recent rapid activity patterns
   */
  static async checkRecentActivity(submissionId) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission || !submission.sessionEvents) {
        return { isRapid: false };
      }

      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Count events in the last 5 minutes
      const recentEvents = submission.sessionEvents.filter(
        (event) => event.timestamp >= fiveMinutesAgo
      );

      // More than 50 events in 5 minutes is suspicious
      return {
        isRapid: recentEvents.length > 50,
        eventCount: recentEvents.length,
      };
    } catch (error) {
      console.error("Error checking recent activity:", error);
      return { isRapid: false };
    }
  }

  /**
   * Log security violation
   */
  static async logSecurityViolation(submission, securityChecks, req) {
    try {
      submission.flaggedForReview = true;
      submission.reviewNotes =
        (submission.reviewNotes || "") +
        `\n[${new Date().toISOString()}] SECURITY VIOLATION: ${securityChecks.violations.join(
          ", "
        )}`;

      submission.sessionEvents.push({
        eventType: "security_violation",
        timestamp: new Date(),
        details: {
          violations: securityChecks.violations,
          securityScore: securityChecks.score,
          browserInfo: req.browserInfo,
          endpoint: req.path,
        },
      });

      await submission.save();

      // Log to console for monitoring
      console.warn(
        `SECURITY VIOLATION - Student: ${submission.studentId}, Exam: ${
          submission.examId
        }, Violations: ${securityChecks.violations.join(", ")}`
      );
    } catch (error) {
      console.error("Error logging security violation:", error);
    }
  }

  /**
   * Log security warning
   */
  static async logSecurityWarning(submission, securityChecks, req) {
    try {
      submission.sessionEvents.push({
        eventType: "security_warning",
        timestamp: new Date(),
        details: {
          warnings: securityChecks.warnings,
          securityScore: securityChecks.score,
          browserInfo: req.browserInfo,
          endpoint: req.path,
        },
      });

      await submission.save();

      // Log to console for monitoring
      console.info(
        `SECURITY WARNING - Student: ${submission.studentId}, Exam: ${
          submission.examId
        }, Warnings: ${securityChecks.warnings.join(", ")}`
      );
    } catch (error) {
      console.error("Error logging security warning:", error);
    }
  }

  /**
   * Update session tracking information
   */
  static async updateSessionTracking(submission, browserInfo) {
    try {
      // Update tracking fields
      submission.ipAddress = browserInfo.clientIp;
      submission.userAgent = browserInfo.userAgent;
      submission.lastActivity = new Date();

      // Store browser info if not already stored
      if (!submission.browserInfo) {
        submission.browserInfo = {
          browser: browserInfo.browser,
          device: browserInfo.device,
          os: browserInfo.os,
          initialIp: browserInfo.clientIp,
          initialUserAgent: browserInfo.userAgent,
        };
      }

      await submission.save();
    } catch (error) {
      console.error("Error updating session tracking:", error);
    }
  }

  /**
   * Middleware to track session activity
   */
  static trackActivity = async (req, res, next) => {
    try {
      if (req.examSession) {
        req.examSession.sessionEvents.push({
          eventType: "activity",
          timestamp: new Date(),
          details: {
            endpoint: req.path,
            method: req.method,
            browserInfo: req.browserInfo,
          },
        });

        req.examSession.lastActivity = new Date();
        await req.examSession.save();
      }
      next();
    } catch (error) {
      console.error("Error tracking activity:", error);
      next(); // Continue even if tracking fails
    }
  };

  /**
   * Middleware to validate exam window timing
   */
  static validateExamWindow = async (req, res, next) => {
    try {
      const { id: examId } = req.params;

      // Get exam details
      const Exam = require("../models/Exam");
      const exam = await Exam.findById(examId);

      if (!exam) {
        return res.status(404).json({
          success: false,
          error: {
            code: "EXAM_NOT_FOUND",
            message: "Exam not found",
          },
        });
      }

      const now = new Date();

      // Check if exam is within allowed time window
      if (exam.startTime && now < exam.startTime) {
        return res.status(403).json({
          success: false,
          error: {
            code: "EXAM_NOT_STARTED",
            message: "Exam has not started yet",
            startTime: exam.startTime,
          },
        });
      }

      if (exam.endTime && now > exam.endTime) {
        return res.status(403).json({
          success: false,
          error: {
            code: "EXAM_ENDED",
            message: "Exam has ended",
            endTime: exam.endTime,
          },
        });
      }

      req.exam = exam;
      next();
    } catch (error) {
      console.error("Error validating exam window:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Failed to validate exam window",
        },
      });
    }
  };
}

module.exports = ExamSecurityMiddleware;
