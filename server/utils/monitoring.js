/**
 * Monitoring and health check utilities for AssessAI platform
 */

const os = require("os");
const mongoose = require("mongoose");
const { version } = require("../package.json");

/**
 * System information for health checks
 */
const getSystemInfo = () => {
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    memory: {
      total:
        Math.round((os.totalmem() / (1024 * 1024 * 1024)) * 100) / 100 + " GB",
      free:
        Math.round((os.freemem() / (1024 * 1024 * 1024)) * 100) / 100 + " GB",
      usage: Math.round((1 - os.freemem() / os.totalmem()) * 10000) / 100 + "%",
    },
    uptime: Math.round(os.uptime() / 3600) + " hours",
    processUptime: Math.round(process.uptime() / 60) + " minutes",
  };
};

/**
 * Database connection status
 */
const getDatabaseStatus = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
    99: "uninitialized",
  };

  return {
    status: states[state] || "unknown",
    connected: state === 1,
    host: mongoose.connection.host || "N/A",
    name: mongoose.connection.name || "N/A",
    models: Object.keys(mongoose.models).length,
  };
};

/**
 * Application health check
 */
const healthCheck = async () => {
  try {
    // Check database connection
    const dbStatus = getDatabaseStatus();

    // Check system resources
    const systemInfo = getSystemInfo();

    // Check memory usage
    const memoryUsage = process.memoryUsage();

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version,
      environment: process.env.NODE_ENV,
      database: dbStatus,
      system: systemInfo,
      memory: {
        rss: Math.round((memoryUsage.rss / (1024 * 1024)) * 100) / 100 + " MB",
        heapTotal:
          Math.round((memoryUsage.heapTotal / (1024 * 1024)) * 100) / 100 +
          " MB",
        heapUsed:
          Math.round((memoryUsage.heapUsed / (1024 * 1024)) * 100) / 100 +
          " MB",
        external:
          Math.round((memoryUsage.external / (1024 * 1024)) * 100) / 100 +
          " MB",
      },
    };
  } catch (error) {
    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
};

/**
 * Simple health check for load balancers
 */
const simpleHealthCheck = async () => {
  try {
    // Check database connection
    const dbStatus = getDatabaseStatus();

    return {
      success: true,
      status: dbStatus.connected ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version,
      environment: process.env.NODE_ENV,
    };
  } catch (error) {
    return {
      success: false,
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
};

/**
 * API status check
 */
const apiStatus = async () => {
  const startTime = process.hrtime();

  try {
    // Check database connection
    const dbStatus = getDatabaseStatus();

    // Calculate response time
    const hrtime = process.hrtime(startTime);
    const responseTime = hrtime[0] * 1000 + hrtime[1] / 1000000;

    return {
      success: true,
      status: dbStatus.connected ? "operational" : "degraded",
      responseTime: Math.round(responseTime) + " ms",
      timestamp: new Date().toISOString(),
      version,
      environment: process.env.NODE_ENV,
    };
  } catch (error) {
    // Calculate response time even for errors
    const hrtime = process.hrtime(startTime);
    const responseTime = hrtime[0] * 1000 + hrtime[1] / 1000000;

    return {
      success: false,
      status: "error",
      responseTime: Math.round(responseTime) + " ms",
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
};

module.exports = {
  healthCheck,
  simpleHealthCheck,
  apiStatus,
  getSystemInfo,
  getDatabaseStatus,
};
