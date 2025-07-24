const express = require("express");
const router = express.Router();
const {
  getDashboardData,
  getExams,
  getUpcomingExams,
  startExam,
  saveAnswer,
  submitExam,
  getExamStatus,
  getExamSession,
} = require("../controllers/studentController");
const { getStudentOwnResults } = require("../controllers/analyticsController");
const {
  trackSessionActivity,
  getSecurityStatus,
  reportSuspiciousActivity,
} = require("../controllers/sessionController");
const { authenticate } = require("../middleware/auth");
const { requireStudent } = require("../middleware/roleCheck");
const examSessionValidator = require("../middleware/examSessionValidator");
const ExamSecurityMiddleware = require("../middleware/examSecurity");

// Apply authentication middleware to all student routes
router.use(authenticate);

// Apply student role check to all routes
router.use(requireStudent);

/**
 * @route   GET /api/student/dashboard
 * @desc    Get student dashboard data
 * @access  Private (Student only)
 */
router.get("/dashboard", getDashboardData);

/**
 * @route   GET /api/student/exams
 * @desc    Get all exams assigned to student
 * @access  Private (Student only)
 */
router.get("/exams", getExams);

/**
 * @route   GET /api/student/exams/upcoming
 * @desc    Get upcoming exams for student
 * @access  Private (Student only)
 */
router.get("/exams/upcoming", getUpcomingExams);

/**
 * @route   GET /api/student/exams/:id/status
 * @desc    Get exam session status
 * @access  Private (Student only)
 */
router.get("/exams/:id/status", getExamStatus);

/**
 * @route   POST /api/student/exams/:id/start
 * @desc    Start an exam session
 * @access  Private (Student only)
 */
router.post(
  "/exams/:id/start",
  ExamSecurityMiddleware.validateExamWindow,
  startExam
);

/**
 * @route   PUT /api/student/exams/:id/save-answer
 * @desc    Save answer during exam (auto-save functionality)
 * @access  Private (Student only)
 */
router.put(
  "/exams/:id/save-answer",
  ExamSecurityMiddleware.examSecurityCheck,
  ExamSecurityMiddleware.trackActivity,
  saveAnswer
);

/**
 * @route   POST /api/student/exams/:id/submit
 * @desc    Submit exam
 * @access  Private (Student only)
 */
router.post(
  "/exams/:id/submit",
  ExamSecurityMiddleware.examSecurityCheck,
  ExamSecurityMiddleware.trackActivity,
  submitExam
);

/**
 * @route   GET /api/student/exams/:id/session
 * @desc    Get current exam session details
 * @access  Private (Student only)
 */
router.get(
  "/exams/:id/session",
  ExamSecurityMiddleware.examSecurityCheck,
  getExamSession
);

/**
 * @route   POST /api/student/exams/:id/track-activity
 * @desc    Track exam session activity
 * @access  Private (Student only)
 */
router.post(
  "/exams/:id/track-activity",
  ExamSecurityMiddleware.examSecurityCheck,
  trackSessionActivity
);

/**
 * @route   GET /api/student/exams/:id/security-status
 * @desc    Get exam session security status
 * @access  Private (Student only)
 */
router.get(
  "/exams/:id/security-status",
  ExamSecurityMiddleware.examSecurityCheck,
  getSecurityStatus
);

/**
 * @route   POST /api/student/exams/:id/report-suspicious
 * @desc    Report suspicious activity during exam
 * @access  Private (Student only)
 */
router.post(
  "/exams/:id/report-suspicious",
  ExamSecurityMiddleware.examSecurityCheck,
  reportSuspiciousActivity
);

/**
 * @route   GET /api/student/exams/:id/results
 * @desc    Get student's own results for an exam
 * @access  Private (Student only)
 */
router.get("/exams/:id/results", getStudentOwnResults);

/**
 * @route   GET /api/student/results
 * @desc    Get all results for the current student
 * @access  Private (Student only)
 */
router.get("/results", async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      page = 1,
      limit = 10,
      sortBy = "submittedAt",
      sortOrder = "desc",
    } = req.query;

    // Get submissions with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const [submissions, totalSubmissions] = await Promise.all([
      require("../models/Submission")
        .find({ studentId, isCompleted: true })
        .populate("examId", "title durationInMinutes settings")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      require("../models/Submission").countDocuments({
        studentId,
        isCompleted: true,
      }),
    ]);

    // Calculate student analytics
    const studentAnalytics =
      await require("../controllers/analyticsController").calculateStudentAnalytics(
        studentId
      );

    res.json({
      success: true,
      data: {
        submissions: submissions.map((submission) => ({
          _id: submission._id,
          exam: {
            _id: submission.examId._id,
            title: submission.examId.title,
            durationInMinutes: submission.examId.durationInMinutes,
            showResults: submission.examId.settings.showResults,
          },
          score: submission.score,
          percentage: submission.percentage,
          timeSpent: submission.timeSpent,
          submittedAt: submission.submittedAt,
          attemptNumber: submission.attemptNumber,
        })),
        analytics: studentAnalytics,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalSubmissions / parseInt(limit)),
          totalSubmissions,
          hasNext: skip + submissions.length < totalSubmissions,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get student results error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "STUDENT_RESULTS_ERROR",
        message: "Failed to retrieve results",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

module.exports = router;
