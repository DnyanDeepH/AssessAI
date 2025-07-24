const express = require("express");
const router = express.Router();
const multer = require("multer");

// Use appropriate controller and upload middleware based on environment
const aiController =
  process.env.NODE_ENV === "production"
    ? require("../controllers/aiControllerServerless")
    : require("../controllers/aiController");

const upload = require("../middleware/upload");

const { authenticate } = require("../middleware/auth");
const { body, param } = require("express-validator");
const { validationResult } = require("express-validator");

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
        details: errors.array(),
        timestamp: new Date().toISOString(),
      },
    });
  }
  next();
};

// AI service status and health routes (public for monitoring)
router.get(
  "/status",
  process.env.NODE_ENV === "production"
    ? aiController.getStatus
    : aiController.getServiceStatus
);
router.get(
  "/test",
  process.env.NODE_ENV === "production"
    ? aiController.testService
    : aiController.testServiceHealth
);

// Protected routes - require authentication
router.use(authenticate);

// File upload and question generation
router.post(
  "/upload-and-generate",
  upload.single("document"),
  [
    body("questionCount")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("Question count must be between 1 and 20"),
    body("difficulty")
      .optional()
      .isIn(["easy", "medium", "hard"])
      .withMessage("Difficulty must be easy, medium, or hard"),
    body("topic")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Topic must be between 1 and 100 characters"),
  ],
  handleValidationErrors,
  aiController.uploadAndGenerate
);

// Text input question generation
router.post(
  "/generate-from-text",
  [
    body("text")
      .notEmpty()
      .withMessage("Text content is required")
      .isLength({ min: 100, max: 50000 })
      .withMessage("Text must be between 100 and 50,000 characters"),
    body("questionCount")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("Question count must be between 1 and 20"),
    body("difficulty")
      .optional()
      .isIn(["easy", "medium", "hard"])
      .withMessage("Difficulty must be easy, medium, or hard"),
    body("topic")
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage("Topic must be between 1 and 100 characters"),
  ],
  handleValidationErrors,
  aiController.generateFromText
);

// Practice session management
router.get(
  "/session/:sessionId",
  [
    param("sessionId")
      .matches(/^practice_\d+_[a-z0-9]+$/)
      .withMessage("Invalid session ID format"),
  ],
  handleValidationErrors,
  aiController.getSession
);

router.post(
  "/session/:sessionId/submit",
  [
    param("sessionId")
      .matches(/^practice_\d+_[a-z0-9]+$/)
      .withMessage("Invalid session ID format"),
    body("answers")
      .isObject()
      .withMessage("Answers must be an object")
      .custom((answers) => {
        // Validate that all answer values are valid options (A, B, C, D)
        const validOptions = ["A", "B", "C", "D"];
        for (const [questionId, answer] of Object.entries(answers)) {
          if (!validOptions.includes(answer)) {
            throw new Error(
              `Invalid answer "${answer}" for question ${questionId}. Must be A, B, C, or D`
            );
          }
        }
        return true;
      }),
  ],
  handleValidationErrors,
  aiController.submitSession
);

// Error handling middleware for file upload errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = "File upload error";
    let code = "FILE_UPLOAD_ERROR";

    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        message = "File size too large. Maximum size is 10MB";
        code = "FILE_TOO_LARGE";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files. Only one file is allowed";
        code = "TOO_MANY_FILES";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file field";
        code = "UNEXPECTED_FILE";
        break;
    }

    return res.status(400).json({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (error.message && error.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_FILE_TYPE",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Generic error handler
  console.error("AI routes error:", error);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;
