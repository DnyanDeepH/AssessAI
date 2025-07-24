const jwt = require("jsonwebtoken");
const User = require("../models/User");

// In-memory token blacklist (in production, use Redis or database)
let tokenBlacklist = new Set();

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "1h",
  });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

// Verify JWT token middleware
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "NO_TOKEN",
          message: "Access denied. No token provided.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_BLACKLISTED",
          message: "Token has been invalidated. Please log in again.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "Token is valid but user no longer exists.",
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            code: "USER_INACTIVE",
            message: "User account is inactive.",
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (jwtError) {
      // Handle JWT specific errors
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          error: {
            code: "TOKEN_EXPIRED",
            message: "Token has expired.",
            timestamp: new Date().toISOString(),
          },
        });
      } else if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          error: {
            code: "MALFORMED_TOKEN",
            message: "Invalid token format.",
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        // Re-throw to be caught by outer catch block
        throw jwtError;
      }
    }
  } catch (error) {
    // Handle database errors and other unexpected errors
    console.error("Authentication middleware error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "AUTH_ERROR",
        message: "Authentication failed due to server error.",
        timestamp: new Date().toISOString(),
      },
    });
  }
};

// Refresh token functionality
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: "NO_REFRESH_TOKEN",
          message: "Refresh token is required.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Get user from database
    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_REFRESH_TOKEN",
          message: "Invalid refresh token or user not found.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Generate new tokens
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        user: user.toJSON(),
      },
    });
  } catch (jwtError) {
    // Handle JWT specific errors
    if (
      jwtError.name === "TokenExpiredError" ||
      jwtError.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_REFRESH_TOKEN",
          message: "Invalid or expired refresh token.",
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // Handle other errors (database, etc.)
      console.error("Refresh token error:", jwtError);
      return res.status(500).json({
        success: false,
        error: {
          code: "REFRESH_ERROR",
          message: "Token refresh failed due to server error.",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
};

// Add token to blacklist
const addToBlacklist = (token) => {
  tokenBlacklist.add(token);
};

// Check if token is blacklisted
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

// Clear blacklist (for testing)
const clearBlacklist = () => {
  tokenBlacklist = new Set();
};

module.exports = {
  authenticate,
  generateToken,
  generateRefreshToken,
  refreshToken,
  addToBlacklist,
  isTokenBlacklisted,
  clearBlacklist,
};
