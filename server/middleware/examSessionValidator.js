const Submission = require("../models/Submission");

/**
 * Middleware to validate exam sessions
 * Ensures that the user has an active exam session before allowing access to exam endpoints
 */
const examSessionValidator = async (req, res, next) => {
  try {
    const { id: examId } = req.params;
    const studentId = req.user.id;
    const clientIp =
      req.headers["x-forwarded-for"] || req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

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
          code: "ACTIVE_SESSION_NOT_FOUND",
          message: "No active exam session found",
        },
      });
    }

    // Check if session is from a different device/location
    const isNewDevice = submission.userAgent !== userAgent;
    const isNewLocation = submission.ipAddress !== clientIp;

    if (isNewDevice || isNewLocation) {
      // Log the device/location change
      console.log(
        `Session device/location change detected for student ${studentId}, exam ${examId}`
      );

      // Flag submission for review
      submission.flaggedForReview = true;
      submission.reviewNotes =
        (submission.reviewNotes || "") +
        `\nDevice/location change at ${new Date().toISOString()}. Previous: ${
          submission.ipAddress
        }/${submission.userAgent}`;

      // Add event to session events
      submission.sessionEvents.push({
        eventType: isNewDevice ? "device_change" : "location_change",
        timestamp: new Date(),
        details: {
          previousIp: submission.ipAddress,
          previousUserAgent: submission.userAgent,
          currentIp: clientIp,
          currentUserAgent: userAgent,
        },
      });

      // Update tracking info
      submission.ipAddress = clientIp;
      submission.userAgent = userAgent;
      await submission.save();
    }

    // Add submission to request object
    req.examSession = submission;

    next();
  } catch (error) {
    console.error("Exam session validation error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "SESSION_VALIDATION_ERROR",
        message: "Failed to validate exam session",
        details: error.message,
      },
    });
  }
};

module.exports = examSessionValidator;
