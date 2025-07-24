const { body } = require("express-validator");

// Validation rules for user registration
const validateRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  body("role")
    .optional()
    .isIn(["student", "admin"])
    .withMessage("Role must be either 'student' or 'admin'"),
];

// Validation rules for user login
const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),
];

// Validation rules for profile update
const validateProfileUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),

  body("phone")
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Please provide a valid phone number"),

  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date of birth")
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();

      if (age < 13 || age > 120) {
        throw new Error("Age must be between 13 and 120 years");
      }

      return true;
    }),
];

// Validation rules for password change
const validatePasswordChange = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from current password");
      }
      return true;
    }),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Password confirmation does not match new password");
    }
    return true;
  }),
];

// Validation rules for refresh token
const validateRefreshToken = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

// Validation rules for user creation by admin
const validateUserCreation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  body("role")
    .optional()
    .isIn(["student", "admin"])
    .withMessage("Role must be either 'student' or 'admin'"),

  body("profile.phone")
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Please provide a valid phone number"),

  body("profile.dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date of birth")
    .custom((value) => {
      if (value) {
        const date = new Date(value);
        const now = new Date();
        const age = now.getFullYear() - date.getFullYear();

        if (age < 13 || age > 120) {
          throw new Error("Age must be between 13 and 120 years");
        }
      }
      return true;
    }),
];

// Validation rules for user update by admin
const validateUserUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name can only contain letters and spaces"),

  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("role")
    .optional()
    .isIn(["student", "admin"])
    .withMessage("Role must be either 'student' or 'admin'"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),

  body("profile.phone")
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage("Please provide a valid phone number"),

  body("profile.dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date of birth")
    .custom((value) => {
      if (value) {
        const date = new Date(value);
        const now = new Date();
        const age = now.getFullYear() - date.getFullYear();

        if (age < 13 || age > 120) {
          throw new Error("Age must be between 13 and 120 years");
        }
      }
      return true;
    }),
];

// Validation rules for bulk operations
const validateBulkUserOperation = [
  body("userIds")
    .isArray({ min: 1 })
    .withMessage("userIds must be a non-empty array")
    .custom((userIds) => {
      if (!userIds.every((id) => typeof id === "string" && id.length === 24)) {
        throw new Error("All userIds must be valid MongoDB ObjectIds");
      }
      return true;
    }),
];

// Validation rules for bulk update
const validateBulkUserUpdate = [
  body("userIds")
    .isArray({ min: 1 })
    .withMessage("userIds must be a non-empty array")
    .custom((userIds) => {
      if (!userIds.every((id) => typeof id === "string" && id.length === 24)) {
        throw new Error("All userIds must be valid MongoDB ObjectIds");
      }
      return true;
    }),

  body("updates").isObject().withMessage("updates must be an object"),

  body("updates.role")
    .optional()
    .isIn(["student", "admin"])
    .withMessage("Role must be either 'student' or 'admin'"),

  body("updates.isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
];

// Validation rules for question creation
const validateQuestionCreation = [
  body("questionText")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Question text must be between 10 and 1000 characters"),

  body("options")
    .isArray({ min: 4, max: 4 })
    .withMessage("Question must have exactly 4 options")
    .custom((options) => {
      // Check if all options are strings and not empty
      if (
        !options.every(
          (opt) => typeof opt === "string" && opt.trim().length > 0
        )
      ) {
        throw new Error("All options must be non-empty strings");
      }

      // Check for duplicate options
      const uniqueOptions = [...new Set(options.map((opt) => opt.trim()))];
      if (uniqueOptions.length !== 4) {
        throw new Error("All options must be unique");
      }

      return true;
    }),

  body("correctAnswer")
    .trim()
    .notEmpty()
    .withMessage("Correct answer is required")
    .custom((value, { req }) => {
      if (
        !req.body.options ||
        !req.body.options.map((opt) => opt.trim()).includes(value.trim())
      ) {
        throw new Error("Correct answer must be one of the provided options");
      }
      return true;
    }),

  body("topic")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Topic must be between 1 and 100 characters"),

  body("difficulty")
    .optional()
    .isIn(["easy", "medium", "hard"])
    .withMessage("Difficulty must be 'easy', 'medium', or 'hard'"),

  body("explanation")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Explanation cannot exceed 500 characters"),
];

// Validation rules for question update
const validateQuestionUpdate = [
  body("questionText")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Question text must be between 10 and 1000 characters"),

  body("options")
    .optional()
    .isArray({ min: 4, max: 4 })
    .withMessage("Question must have exactly 4 options")
    .custom((options) => {
      if (options) {
        // Check if all options are strings and not empty
        if (
          !options.every(
            (opt) => typeof opt === "string" && opt.trim().length > 0
          )
        ) {
          throw new Error("All options must be non-empty strings");
        }

        // Check for duplicate options
        const uniqueOptions = [...new Set(options.map((opt) => opt.trim()))];
        if (uniqueOptions.length !== 4) {
          throw new Error("All options must be unique");
        }
      }
      return true;
    }),

  body("correctAnswer")
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (value && req.body.options) {
        if (!req.body.options.map((opt) => opt.trim()).includes(value.trim())) {
          throw new Error("Correct answer must be one of the provided options");
        }
      } else if (value && !req.body.options) {
        // If updating only correctAnswer without options, we'll validate in the controller
        return true;
      }
      return true;
    }),

  body("topic")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Topic must be between 1 and 100 characters"),

  body("difficulty")
    .optional()
    .isIn(["easy", "medium", "hard"])
    .withMessage("Difficulty must be 'easy', 'medium', or 'hard'"),

  body("explanation")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Explanation cannot exceed 500 characters"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
];

// Validation rules for bulk question operations
const validateBulkQuestionOperation = [
  body("questionIds")
    .isArray({ min: 1 })
    .withMessage("questionIds must be a non-empty array")
    .custom((questionIds) => {
      if (
        !questionIds.every((id) => typeof id === "string" && id.length === 24)
      ) {
        throw new Error("All questionIds must be valid MongoDB ObjectIds");
      }
      return true;
    }),
];

// Validation rules for bulk question update
const validateBulkQuestionUpdate = [
  body("questionIds")
    .isArray({ min: 1 })
    .withMessage("questionIds must be a non-empty array")
    .custom((questionIds) => {
      if (
        !questionIds.every((id) => typeof id === "string" && id.length === 24)
      ) {
        throw new Error("All questionIds must be valid MongoDB ObjectIds");
      }
      return true;
    }),

  body("updates").isObject().withMessage("updates must be an object"),

  body("updates.topic")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Topic must be between 1 and 100 characters"),

  body("updates.difficulty")
    .optional()
    .isIn(["easy", "medium", "hard"])
    .withMessage("Difficulty must be 'easy', 'medium', or 'hard'"),

  body("updates.isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateRefreshToken,
  validateUserCreation,
  validateUserUpdate,
  validateBulkUserOperation,
  validateBulkUserUpdate,
  validateQuestionCreation,
  validateQuestionUpdate,
  validateBulkQuestionOperation,
  validateBulkQuestionUpdate,
};
