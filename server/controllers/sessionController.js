const Submission = require("../models/Submission");

/**
 * Controller for handling exam session monitoring and security
 */
class SessionController {
  /**
   * Track session activity
   * @route POST /api/student/exams/:id/track-activity
   */
  static trackSessionActivity = async (req, res) => {
    try {
      const { activityType, details } = req.body;
      const submission = req.examSession;

      if (!submission) {
        return res.status(404).json({
          success: false,
          error: {
            code: "SESSION_NOT_FOUND",
            message: "Active exam session not found",
          },
        });
      }

      // Validate activity type
      const validActivityTypes = [
        "focus_lost",
        "focus_gained",
        "tab_switch",
        "window_resize",
        "idle",
        "active",
        "mouse_movement",
        "key_press",
      ];

      if (!validActivityTypes.includes(activityType)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_ACTIVITY_TYPE",
            message: "Invalid activity type",
          },
        });
      }

      // Add activity event
      submission.sessionEvents.push({
        eventType: activityType,
        timestamp: new Date(),
        details: {
          ...details,
          browserInfo: req.browserInfo,
          endpoint: req.path,
        },
      });

      // Update last activity
      submission.lastActivity = new Date();

      // Check for suspicious patterns
      await SessionController.checkSuspiciousActivity(submission, activityType);

      await submission.save();

      res.json({
        success: true,
        message: "Activity tracked successfully",
        data: {
          activityType,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Error tracking session activity:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "TRACKING_ERROR",
          message: "Failed to track session activity",
          details: error.message,
        },
      });
    }
  };

  /**
   * Get session security status
   * @route GET /api/student/exams/:id/security-status
   */
  static getSecurityStatus = async (req, res) => {
    try {
      const submission = req.examSession;

      if (!submission) {
        return res.status(404).json({
          success: false,
          error: {
            code: "SESSION_NOT_FOUND",
            message: "Active exam session not found",
          },
        });
      }

      // Calculate security metrics
      const securityMetrics = await SessionController.calculateSecurityMetrics(
        submission
      );

      res.json({
        success: true,
        data: {
          securityScore: submission.securityScore || 0,
          flaggedForReview: submission.flaggedForReview,
          metrics: securityMetrics,
          lastActivity: submission.lastActivity,
          sessionDuration: Date.now() - submission.startedAt.getTime(),
        },
      });
    } catch (error) {
      console.error("Error getting security status:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "SECURITY_STATUS_ERROR",
          message: "Failed to get security status",
          details: error.message,
        },
      });
    }
  };

  /**
   * Report suspicious activity
   * @route POST /api/student/exams/:id/report-suspicious
   */
  static reportSuspiciousActivity = async (req, res) => {
    try {
      const { activityType, description, evidence } = req.body;
      const submission = req.examSession;

      if (!submission) {
        return res.status(404).json({
          success: false,
          error: {
            code: "SESSION_NOT_FOUND",
            message: "Active exam session not found",
          },
        });
      }

      // Flag submission for review
      submission.flaggedForReview = true;
      submission.reviewNotes =
        (submission.reviewNotes || "") +
        `\n[${new Date().toISOString()}] SUSPICIOUS ACTIVITY REPORTED: ${activityType} - ${description}`;

      // Add security event
      submission.sessionEvents.push({
        eventType: "security_violation",
        timestamp: new Date(),
        details: {
          activityType,
          description,
          evidence,
          reportedBy: "system",
          browserInfo: req.browserInfo,
        },
      });

      // Increase security score
      submission.securityScore = Math.min(
        (submission.securityScore || 0) + 25,
        100
      );

      await submission.save();

      // Log for monitoring
      console.warn(
        `SUSPICIOUS ACTIVITY REPORTED - Student: ${submission.studentId}, Exam: ${submission.examId}, Activity: ${activityType}`
      );

      res.json({
        success: true,
        message: "Suspicious activity reported successfully",
        data: {
          flaggedForReview: submission.flaggedForReview,
          securityScore: submission.securityScore,
        },
      });
    } catch (error) {
      console.error("Error reporting suspicious activity:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "REPORT_ERROR",
          message: "Failed to report suspicious activity",
          details: error.message,
        },
      });
    }
  };

  /**
   * Check for suspicious activity patterns
   */
  static async checkSuspiciousActivity(submission, activityType) {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Get recent events
      const recentEvents = submission.sessionEvents.filter(
        (event) => event.timestamp >= fiveMinutesAgo
      );

      // Check for excessive focus loss
      const focusLossEvents = recentEvents.filter(
        (event) => event.eventType === "focus_lost"
      );

      if (focusLossEvents.length > 10) {
        submission.flaggedForReview = true;
        submission.reviewNotes =
          (submission.reviewNotes || "") +
          `\n[${now.toISOString()}] SUSPICIOUS: Excessive focus loss events (${
            focusLossEvents.length
          } in 5 minutes)`;
        submission.securityScore = Math.min(
          (submission.securityScore || 0) + 20,
          100
        );
      }

      // Check for rapid tab switching
      const tabSwitchEvents = recentEvents.filter(
        (event) => event.eventType === "tab_switch"
      );

      if (tabSwitchEvents.length > 20) {
        submission.flaggedForReview = true;
        submission.reviewNotes =
          (submission.reviewNotes || "") +
          `\n[${now.toISOString()}] SUSPICIOUS: Excessive tab switching (${
            tabSwitchEvents.length
          } in 5 minutes)`;
        submission.securityScore = Math.min(
          (submission.securityScore || 0) + 30,
          100
        );
      }

      // Check for long idle periods
      if (activityType === "idle") {
        const lastActiveEvent = submission.sessionEvents
          .filter((event) => event.eventType === "active")
          .sort((a, b) => b.timestamp - a.timestamp)[0];

        if (lastActiveEvent) {
          const idleDuration =
            now.getTime() - lastActiveEvent.timestamp.getTime();
          const maxIdleTime = 10 * 60 * 1000; // 10 minutes

          if (idleDuration > maxIdleTime) {
            submission.sessionEvents.push({
              eventType: "security_warning",
              timestamp: now,
              details: {
                warning: "Extended idle period detected",
                idleDuration: idleDuration,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error("Error checking suspicious activity:", error);
    }
  }

  /**
   * Calculate security metrics for a submission
   */
  static async calculateSecurityMetrics(submission) {
    try {
      const events = submission.sessionEvents || [];
      const now = new Date();

      // Count different event types
      const eventCounts = events.reduce((counts, event) => {
        counts[event.eventType] = (counts[event.eventType] || 0) + 1;
        return counts;
      }, {});

      // Calculate session duration
      const sessionDuration = now.getTime() - submission.startedAt.getTime();

      // Calculate activity patterns
      const focusLossCount = eventCounts.focus_lost || 0;
      const tabSwitchCount = eventCounts.tab_switch || 0;
      const securityViolationCount = eventCounts.security_violation || 0;
      const securityWarningCount = eventCounts.security_warning || 0;

      // Calculate risk score
      let riskScore = 0;
      riskScore += focusLossCount * 2;
      riskScore += tabSwitchCount * 1;
      riskScore += securityViolationCount * 10;
      riskScore += securityWarningCount * 5;

      // Normalize risk score (0-100)
      riskScore = Math.min(riskScore, 100);

      return {
        eventCounts,
        sessionDuration,
        focusLossCount,
        tabSwitchCount,
        securityViolationCount,
        securityWarningCount,
        riskScore,
        totalEvents: events.length,
        averageEventsPerMinute: events.length / (sessionDuration / (1000 * 60)),
      };
    } catch (error) {
      console.error("Error calculating security metrics:", error);
      return {
        error: "Failed to calculate security metrics",
      };
    }
  }

  /**
   * Get session analytics for an exam
   * @route GET /api/admin/exams/:id/session-analytics
   */
  static getSessionAnalytics = async (req, res) => {
    try {
      const { id: examId } = req.params;

      // Get all submissions for the exam
      const submissions = await Submission.find({ examId, isCompleted: true })
        .populate("studentId", "name email")
        .sort({ submittedAt: -1 });

      if (submissions.length === 0) {
        return res.json({
          success: true,
          data: {
            totalSubmissions: 0,
            analytics: {},
            flaggedSubmissions: [],
          },
        });
      }

      // Calculate analytics
      const analytics = {
        totalSubmissions: submissions.length,
        flaggedCount: submissions.filter((s) => s.flaggedForReview).length,
        averageSecurityScore:
          submissions.reduce((sum, s) => sum + (s.securityScore || 0), 0) /
          submissions.length,
        securityDistribution: {
          low: submissions.filter((s) => (s.securityScore || 0) < 30).length,
          medium: submissions.filter(
            (s) => (s.securityScore || 0) >= 30 && (s.securityScore || 0) < 70
          ).length,
          high: submissions.filter((s) => (s.securityScore || 0) >= 70).length,
        },
        commonViolations: {},
        deviceTypes: {},
        browsers: {},
      };

      // Analyze common violations and device/browser patterns
      submissions.forEach((submission) => {
        // Count device types
        if (submission.browserInfo?.device?.type) {
          const deviceType = submission.browserInfo.device.type;
          analytics.deviceTypes[deviceType] =
            (analytics.deviceTypes[deviceType] || 0) + 1;
        }

        // Count browsers
        if (submission.browserInfo?.browser?.name) {
          const browserName = submission.browserInfo.browser.name;
          analytics.browsers[browserName] =
            (analytics.browsers[browserName] || 0) + 1;
        }

        // Count violations
        submission.sessionEvents?.forEach((event) => {
          if (
            event.eventType === "security_violation" &&
            event.details?.violations
          ) {
            event.details.violations.forEach((violation) => {
              analytics.commonViolations[violation] =
                (analytics.commonViolations[violation] || 0) + 1;
            });
          }
        });
      });

      // Get flagged submissions
      const flaggedSubmissions = submissions
        .filter((s) => s.flaggedForReview)
        .map((s) => ({
          id: s._id,
          student: s.studentId,
          securityScore: s.securityScore,
          reviewNotes: s.reviewNotes,
          submittedAt: s.submittedAt,
        }));

      res.json({
        success: true,
        data: {
          analytics,
          flaggedSubmissions,
        },
      });
    } catch (error) {
      console.error("Error getting session analytics:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "ANALYTICS_ERROR",
          message: "Failed to get session analytics",
          details: error.message,
        },
      });
    }
  };

  /**
   * Get session events for a submission
   * @route GET /api/admin/submissions/:id/session-events
   */
  static getSessionEvents = async (req, res) => {
    try {
      const { id: submissionId } = req.params;

      const submission = await Submission.findById(submissionId)
        .populate("examId", "title")
        .populate("studentId", "name email");

      if (!submission) {
        return res.status(404).json({
          success: false,
          error: {
            code: "SUBMISSION_NOT_FOUND",
            message: "Submission not found",
          },
        });
      }

      // Filter and format events
      const events = submission.sessionEvents
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((event) => ({
          eventType: event.eventType,
          timestamp: event.timestamp,
          details: event.details,
          timeFromStart:
            event.timestamp.getTime() - submission.startedAt.getTime(),
        }));

      res.json({
        success: true,
        data: {
          submission: {
            id: submission._id,
            exam: submission.examId,
            student: submission.studentId,
            startedAt: submission.startedAt,
            submittedAt: submission.submittedAt,
            flaggedForReview: submission.flaggedForReview,
            securityScore: submission.securityScore,
          },
          events,
          totalEvents: events.length,
        },
      });
    } catch (error) {
      console.error("Error getting session events:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "EVENTS_ERROR",
          message: "Failed to get session events",
          details: error.message,
        },
      });
    }
  };

  /**
   * Get session timeline for admin review
   * @route GET /api/admin/submissions/:id/timeline
   */
  static getSessionTimeline = async (req, res) => {
    try {
      const { id: submissionId } = req.params;

      const submission = await Submission.findById(submissionId)
        .populate("examId", "title")
        .populate("studentId", "name email");

      if (!submission) {
        return res.status(404).json({
          success: false,
          error: {
            code: "SUBMISSION_NOT_FOUND",
            message: "Submission not found",
          },
        });
      }

      // Sort events by timestamp
      const timeline = submission.sessionEvents
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((event) => ({
          eventType: event.eventType,
          timestamp: event.timestamp,
          details: event.details,
          timeFromStart:
            event.timestamp.getTime() - submission.startedAt.getTime(),
        }));

      // Calculate security metrics
      const securityMetrics = await SessionController.calculateSecurityMetrics(
        submission
      );

      res.json({
        success: true,
        data: {
          submission: {
            id: submission._id,
            exam: submission.examId,
            student: submission.studentId,
            startedAt: submission.startedAt,
            submittedAt: submission.submittedAt,
            flaggedForReview: submission.flaggedForReview,
            reviewNotes: submission.reviewNotes,
            securityScore: submission.securityScore,
            browserInfo: submission.browserInfo,
          },
          timeline,
          securityMetrics,
        },
      });
    } catch (error) {
      console.error("Error getting session timeline:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "TIMELINE_ERROR",
          message: "Failed to get session timeline",
          details: error.message,
        },
      });
    }
  };
}

module.exports = SessionController;
