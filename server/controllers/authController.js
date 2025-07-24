const { validationResult } = require("express-validator");
const User = require("../models/User");
const {
  generateToken,
  generateRefreshToken,
  addToBlacklist,
} = require("../middleware/auth");

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please provide valid information.",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: "USER_EXISTS",
          message: "User with this email already exists.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || "student",
    });

    // Generate tokens
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update last login
    await user.updateLastLogin();

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        token,
        refreshToken,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "REGISTRATION_ERROR",
        message: "Registration failed due to server error.",
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please provide valid credentials.",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Generate tokens
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update last login
    await user.updateLastLogin();

    res.json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        refreshToken,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "LOGIN_ERROR",
        message: "Login failed due to server error.",
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      // Add token to blacklist
      addToBlacklist(token);

      // In production, you might want to store this in Redis with expiration
      // or maintain a database table for blacklisted tokens
    }

    res.json({
      success: true,
      message: "Logout successful.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "LOGOUT_ERROR",
        message: "Logout failed due to server error.",
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "PROFILE_ERROR",
        message: "Failed to retrieve user profile.",
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please provide valid information.",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { name, phone, dateOfBirth } = req.body;

    // Find and update user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Update fields
    if (name) user.name = name.trim();
    if (phone !== undefined) user.profile.phone = phone.trim();
    if (dateOfBirth) user.profile.dateOfBirth = new Date(dateOfBirth);

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "UPDATE_PROFILE_ERROR",
        message: "Failed to update profile.",
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please provide valid password information.",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Find user with password
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_CURRENT_PASSWORD",
          message: "Current password is incorrect.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "CHANGE_PASSWORD_ERROR",
        message: "Failed to change password.",
        timestamp: new Date().toISOString(),
      },
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
};
