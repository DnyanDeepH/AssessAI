/**
 * Health check controller for AssessAI platform
 */

const {
  healthCheck,
  simpleHealthCheck,
  apiStatus,
} = require("../utils/monitoring");

/**
 * @desc    Get detailed health check
 * @route   GET /api/health/detailed
 * @access  Admin
 */
const getDetailedHealth = async (req, res) => {
  try {
    const health = await healthCheck();

    if (health.status === "healthy") {
      return res.status(200).json({
        success: true,
        data: health,
      });
    } else {
      return res.status(503).json({
        success: false,
        data: health,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        message: "Health check failed",
        details: error.message,
      },
    });
  }
};

/**
 * @desc    Get simple health check for load balancers
 * @route   GET /health
 * @access  Public
 */
const getSimpleHealth = async (req, res) => {
  try {
    const health = await simpleHealthCheck();

    if (health.success) {
      return res.status(200).json(health);
    } else {
      return res.status(503).json(health);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: "error",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};

/**
 * @desc    Get API status
 * @route   GET /api/status
 * @access  Public
 */
const getApiStatus = async (req, res) => {
  try {
    const status = await apiStatus();

    if (status.success) {
      return res.status(200).json(status);
    } else {
      return res.status(503).json(status);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: "error",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};

module.exports = {
  getDetailedHealth,
  getSimpleHealth,
  getApiStatus,
};
