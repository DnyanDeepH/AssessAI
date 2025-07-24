const express = require("express");
const router = express.Router();
const {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  assignExam,
} = require("../controllers/examController");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  bulkDeleteUsers,
  bulkUpdateUsers,
  importUsersFromCSV,
  exportUsersToCSV,
  getUserStats,
} = require("../controllers/userController");
const {
  getDashboard,
  getSystemHealth,
} = require("../controllers/adminController");
const {
  getExamResults,
  getStudentExamResults,
  getStudentAllResults,
  getPlatformAnalytics,
} = require("../controllers/analyticsController");
const {
  getSessionAnalytics,
  getSessionEvents,
  getSessionTimeline,
} = require("../controllers/sessionController");
const {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkDeleteQuestions,
  bulkUpdateQuestions,
  importQuestionsFromCSV,
  exportQuestionsToCSV,
  getQuestionStats,
} = require("../controllers/questionController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roleCheck");
const {
  validateUserCreation,
  validateUserUpdate,
  validateBulkUserOperation,
  validateBulkUserUpdate,
  validateQuestionCreation,
  validateQuestionUpdate,
  validateBulkQuestionOperation,
  validateBulkQuestionUpdate,
} = require("../middleware/validation");
const multer = require("multer");

// Configure multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"), false);
    }
  },
});

// Apply authentication middleware to all admin routes
router.use(authenticate);

// Apply admin role check to all routes
router.use(requireAdmin);

// Dashboard Routes

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin only)
 */
router.get("/dashboard", getDashboard);

/**
 * @route   GET /api/admin/system-health
 * @desc    Get system health and performance metrics
 * @access  Private (Admin only)
 */
router.get("/system-health", getSystemHealth);

// Exam Management Routes

/**
 * @route   POST /api/admin/exams
 * @desc    Create a new exam
 * @access  Private (Admin only)
 */
router.post("/exams", createExam);

/**
 * @route   GET /api/admin/exams
 * @desc    Get all exams with pagination and filtering
 * @access  Private (Admin only)
 */
router.get("/exams", getExams);

/**
 * @route   GET /api/admin/exams/:id
 * @desc    Get exam by ID
 * @access  Private (Admin only)
 */
router.get("/exams/:id", getExamById);

/**
 * @route   PUT /api/admin/exams/:id
 * @desc    Update exam
 * @access  Private (Admin only)
 */
router.put("/exams/:id", updateExam);

/**
 * @route   DELETE /api/admin/exams/:id
 * @desc    Delete exam (soft delete)
 * @access  Private (Admin only)
 */
router.delete("/exams/:id", deleteExam);

/**
 * @route   POST /api/admin/exams/:id/assign
 * @desc    Assign exam to students
 * @access  Private (Admin only)
 */
router.post("/exams/:id/assign", assignExam);

/**
 * @route   GET /api/admin/exams/:id/session-analytics
 * @desc    Get session analytics for an exam
 * @access  Private (Admin only)
 */
router.get("/exams/:id/session-analytics", getSessionAnalytics);

/**
 * @route   GET /api/admin/submissions/:id/session-events
 * @desc    Get detailed session events for a submission
 * @access  Private (Admin only)
 */
router.get("/submissions/:id/session-events", getSessionEvents);

/**
 * @route   GET /api/admin/submissions/:id/timeline
 * @desc    Get session timeline for admin review
 * @access  Private (Admin only)
 */
router.get("/submissions/:id/timeline", getSessionTimeline);

/**
 * @route   GET /api/admin/exams/:id/results
 * @desc    Get detailed exam results and analytics
 * @access  Private (Admin only)
 */
router.get("/exams/:id/results", getExamResults);

/**
 * @route   GET /api/admin/exams/:examId/students/:studentId/results
 * @desc    Get individual student's detailed results for an exam
 * @access  Private (Admin only)
 */
router.get("/exams/:examId/students/:studentId/results", getStudentExamResults);

/**
 * @route   GET /api/admin/students/:id/results
 * @desc    Get all results for a student
 * @access  Private (Admin only)
 */
router.get("/students/:id/results", getStudentAllResults);

/**
 * @route   GET /api/admin/analytics/platform
 * @desc    Get comprehensive platform analytics
 * @access  Private (Admin only)
 */
router.get("/analytics/platform", getPlatformAnalytics);

// User Management Routes

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination, search, and filtering
 * @access  Private (Admin only)
 */
router.get("/users", getUsers);

/**
 * @route   GET /api/admin/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get("/users/stats", getUserStats);

/**
 * @route   GET /api/admin/users/export
 * @desc    Export users to CSV
 * @access  Private (Admin only)
 */
router.get("/users/export", exportUsersToCSV);

/**
 * @route   POST /api/admin/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post("/users", validateUserCreation, createUser);

/**
 * @route   POST /api/admin/users/import
 * @desc    Import users from CSV
 * @access  Private (Admin only)
 */
router.post("/users/import", upload.single("csvFile"), importUsersFromCSV);

/**
 * @route   PUT /api/admin/users/bulk
 * @desc    Bulk update users
 * @access  Private (Admin only)
 */
router.put("/users/bulk", validateBulkUserUpdate, bulkUpdateUsers);

/**
 * @route   DELETE /api/admin/users/bulk
 * @desc    Bulk delete users
 * @access  Private (Admin only)
 */
router.delete("/users/bulk", validateBulkUserOperation, bulkDeleteUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get("/users/:id", getUserById);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put("/users/:id", validateUserUpdate, updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 */
router.delete("/users/:id", deleteUser);

// Question Management Routes

/**
 * @route   GET /api/admin/questions
 * @desc    Get all questions with pagination, search, and filtering
 * @access  Private (Admin only)
 */
router.get("/questions", getQuestions);

/**
 * @route   GET /api/admin/questions/stats
 * @desc    Get question statistics
 * @access  Private (Admin only)
 */
router.get("/questions/stats", getQuestionStats);

/**
 * @route   GET /api/admin/questions/export
 * @desc    Export questions to CSV
 * @access  Private (Admin only)
 */
router.get("/questions/export", exportQuestionsToCSV);

/**
 * @route   POST /api/admin/questions
 * @desc    Create new question
 * @access  Private (Admin only)
 */
router.post("/questions", validateQuestionCreation, createQuestion);

/**
 * @route   POST /api/admin/questions/import
 * @desc    Import questions from CSV
 * @access  Private (Admin only)
 */
router.post(
  "/questions/import",
  upload.single("csvFile"),
  importQuestionsFromCSV
);

/**
 * @route   PUT /api/admin/questions/bulk
 * @desc    Bulk update questions
 * @access  Private (Admin only)
 */
router.put("/questions/bulk", validateBulkQuestionUpdate, bulkUpdateQuestions);

/**
 * @route   DELETE /api/admin/questions/bulk
 * @desc    Bulk delete questions
 * @access  Private (Admin only)
 */
router.delete(
  "/questions/bulk",
  validateBulkQuestionOperation,
  bulkDeleteQuestions
);

/**
 * @route   GET /api/admin/questions/:id
 * @desc    Get question by ID
 * @access  Private (Admin only)
 */
router.get("/questions/:id", getQuestionById);

/**
 * @route   PUT /api/admin/questions/:id
 * @desc    Update question
 * @access  Private (Admin only)
 */
router.put("/questions/:id", validateQuestionUpdate, updateQuestion);

/**
 * @route   DELETE /api/admin/questions/:id
 * @desc    Delete question (soft delete)
 * @access  Private (Admin only)
 */
router.delete("/questions/:id", deleteQuestion);

module.exports = router;
