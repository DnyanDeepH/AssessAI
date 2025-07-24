const express = require("express");
const router = express.Router();

// Import controllers
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
} = require("../controllers/authController");

// Import middleware
const { authenticate, refreshToken } = require("../middleware/auth");
const {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateRefreshToken,
} = require("../middleware/validation");

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
router.post("/register", validateRegistration, register);

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
router.post("/login", validateLogin, login);

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
router.post("/refresh", validateRefreshToken, refreshToken);

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
router.post("/logout", authenticate, logout);

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
router.get("/me", authenticate, getMe);

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
router.put("/profile", authenticate, validateProfileUpdate, updateProfile);

/**
 * @desc    Change user password
 * @route   PUT /api/auth/password
 * @access  Private
 */
router.put("/password", authenticate, validatePasswordChange, changePassword);

module.exports = router;
