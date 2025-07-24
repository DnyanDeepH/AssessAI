const UAParser = require("ua-parser-js");

/**
 * Middleware to detect browser and device information
 * Adds browser and device info to the request object
 * Enhanced with security checks for exam sessions
 */
const browserDetection = (req, res, next) => {
  try {
    const userAgent = req.headers["user-agent"];
    const parser = new UAParser(userAgent);

    // Parse user agent
    const browser = parser.getBrowser();
    const device = parser.getDevice();
    const os = parser.getOS();
    const engine = parser.getEngine();

    // Get client IP address
    const clientIp =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
      req.ip;

    // Add comprehensive browser and device info to request object
    req.browserInfo = {
      browser: {
        name: browser.name || "Unknown",
        version: browser.version || "Unknown",
        major: browser.major || "Unknown",
      },
      device: {
        model: device.model || "Unknown",
        type: device.type || "desktop",
        vendor: device.vendor || "Unknown",
      },
      os: {
        name: os.name || "Unknown",
        version: os.version || "Unknown",
      },
      engine: {
        name: engine.name || "Unknown",
        version: engine.version || "Unknown",
      },
      userAgent,
      clientIp: Array.isArray(clientIp) ? clientIp[0] : clientIp,
      timestamp: new Date().toISOString(),
    };

    // Security checks for suspicious patterns
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /headless/i,
      /phantom/i,
      /selenium/i,
      /webdriver/i,
    ];

    req.browserInfo.isSuspicious = suspiciousPatterns.some((pattern) =>
      pattern.test(userAgent)
    );

    // Check if it's a mobile device (important for exam security)
    req.browserInfo.isMobile =
      device.type === "mobile" || device.type === "tablet";

    // Add security headers based on browser detection
    if (req.path.includes("/exams/")) {
      // Stricter headers for exam routes
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("X-Content-Type-Options", "nosniff");

      // Prevent caching of exam content
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }

    next();
  } catch (error) {
    console.error("Browser detection error:", error);
    // If parsing fails, continue with minimal info
    req.browserInfo = {
      error: "Failed to parse user agent",
      userAgent: req.headers["user-agent"] || "Unknown",
      clientIp: req.ip,
      timestamp: new Date().toISOString(),
      isSuspicious: true, // Flag as suspicious if we can't parse
    };
    next();
  }
};

module.exports = browserDetection;
