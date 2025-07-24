const { RateLimiterMemory } = require("rate-limiter-flexible");

/**
 * Rate limiter options for different endpoints
 */
const options = {
  // General API rate limiter
  general: {
    points: 100, // Number of points
    duration: 60, // Per second
  },

  // Authentication endpoints rate limiter (more strict)
  auth: {
    points: 5, // Number of points
    duration: 60, // Per second
    blockDuration: 60 * 10, // Block for 10 minutes if exceeded
  },

  // Exam submission endpoints rate limiter
  exam: {
    points: 20, // Number of points
    duration: 60, // Per second
  },
};

// Create rate limiters
const generalLimiter = new RateLimiterMemory(options.general);
const authLimiter = new RateLimiterMemory(options.auth);
const examLimiter = new RateLimiterMemory(options.exam);

/**
 * Middleware factory for rate limiting
 * @param {string} type - Type of rate limiter to use (general, auth, exam)
 * @returns {Function} - Express middleware function
 */
const rateLimiter = (type = "general") => {
  let limiter;

  switch (type) {
    case "auth":
      limiter = authLimiter;
      break;
    case "exam":
      limiter = examLimiter;
      break;
    default:
      limiter = generalLimiter;
  }

  return async (req, res, next) => {
    try {
      // Use IP as key for rate limiting
      const key = req.ip;
      await limiter.consume(key);
      next();
    } catch (error) {
      // Rate limit exceeded
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests, please try again later",
          details: {
            retryAfter: error.msBeforeNext / 1000 || 60,
          },
        },
      });
    }
  };
};

module.exports = rateLimiter;
