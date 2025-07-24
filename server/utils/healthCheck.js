/**
 * Health check utility for AssessAI platform
 * Provides system status information for monitoring tools
 */

const mongoose = require("mongoose");
const os = require("os");

/**
 * Get system health information
 * @returns {Object} Health status information
 */
const getHealthInfo = async () => {
  // Check database connection
  const dbStatus = {
    isConnected: mongoose.connection.readyState === 1,
    status: getConnectionStatus(mongoose.connection.readyState),
  };

  // Get system information
  const systemInfo = {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    freeMemory: os.freemem(),
    totalMemory: os.totalmem(),
    loadAverage: os.loadavg(),
  };

  // Get Node.js process information
  const processInfo = {
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };

  return {
    timestamp: new Date().toISOString(),
    status: dbStatus.isConnected ? "healthy" : "unhealthy",
    database: dbStatus,
    system: systemInfo,
    process: processInfo,
    environment: process.env.NODE_ENV,
  };
};

/**
 * Get database connection status description
 * @param {Number} state - Mongoose connection state
 * @returns {String} Connection status description
 */
const getConnectionStatus = (state) => {
  switch (state) {
    case 0:
      return "disconnected";
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "unknown";
  }
};

module.exports = {
  getHealthInfo,
};
