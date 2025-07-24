/**
 * Monitoring middleware for AssessAI platform
 * Tracks API performance metrics and logs request information
 */

const winston = require("winston");
const config = require("../config");
const { recordRequest, recordError } = require("../utils/metrics");

// Get the appropriate logger based on environment
const logger =
  config.logger ||
  winston.createLogger({
    level: "info",
    format: winston.format.json(),
    defaultMeta: { service: "assessai-api" },
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    ],
  });

/**
 * Middleware to monitor API requests and performance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const monitorRequest = (req, res, next) => {
  // Skip monitoring for health check endpoints to avoid noise
  if (
    req.path === "/health" ||
    req.path.startsWith("/api/health") ||
    req.path === "/metrics"
  ) {
    return next();
  }

  const startTime = Date.now();
  const requestId = generateRequestId();

  // Add request ID to response headers
  res.setHeader("X-Request-ID", requestId);

  // Store request start time and ID
  req.requestStartTime = startTime;
  req.requestId = requestId;

  // Log request
  logger.info("API Request", {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // Capture response metrics when the response is finished
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? "warn" : "info";

    // Record metrics
    recordRequest(req.method, req.path, res.statusCode, duration);

    // Record error if status code indicates an error
    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? "server_error" : "client_error";
      recordError(errorType, `${req.method} ${req.path} - ${res.statusCode}`);
    }

    logger.log(level, "API Response", {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get("content-length") || 0,
    });
  });

  next();
};

/**
 * Generate a unique request ID
 * @returns {String} Unique request ID
 */
const generateRequestId = () => {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

module.exports = monitorRequest;
