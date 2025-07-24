/**
 * Health check routes for AssessAI platform
 * Provides detailed health information for monitoring and alerting
 */

const express = require("express");
const { getHealthInfo } = require("../utils/healthCheck");
const { getMetrics } = require("../utils/metrics");
const { checkDependencies } = require("../utils/dependencyCheck");

const router = express.Router();

/**
 * @route   GET /api/health/detailed
 * @desc    Get detailed health information
 * @access  Public
 */
router.get("/detailed", async (req, res) => {
  try {
    const healthInfo = await getHealthInfo();
    const dependencyChecks = await checkDependencies();
    const metrics = await getMetrics();

    const overallStatus =
      healthInfo.status === "healthy" && dependencyChecks.allHealthy
        ? "healthy"
        : "unhealthy";

    res.status(overallStatus === "healthy" ? 200 : 503).json({
      success: overallStatus === "healthy",
      timestamp: new Date().toISOString(),
      status: overallStatus,
      checks: dependencyChecks.checks,
      metrics: metrics,
      system: healthInfo.system,
      process: healthInfo.process,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      timestamp: new Date().toISOString(),
      status: "unhealthy",
      error: {
        message: "Health check failed",
        details: error.message,
      },
    });
  }
});

/**
 * @route   GET /api/health/ready
 * @desc    Readiness probe for Kubernetes/Docker
 * @access  Public
 */
router.get("/ready", async (req, res) => {
  try {
    const dependencyChecks = await checkDependencies();

    if (dependencyChecks.allHealthy) {
      res.status(200).json({
        success: true,
        status: "ready",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        success: false,
        status: "not ready",
        timestamp: new Date().toISOString(),
        failedChecks: dependencyChecks.checks
          .filter((check) => check.status !== "healthy")
          .map((check) => check.name),
      });
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "not ready",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/health/live
 * @desc    Liveness probe for Kubernetes/Docker
 * @access  Public
 */
router.get("/live", (req, res) => {
  // Simple liveness check - if the server can respond, it's alive
  res.status(200).json({
    success: true,
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
