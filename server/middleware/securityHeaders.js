/**
 * Enhanced middleware to add security headers to API responses
 * Helps protect against common web vulnerabilities with exam-specific protections
 */
const securityHeaders = (req, res, next) => {
  // Prevent browsers from MIME-sniffing a response away from the declared content-type
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking attacks - stricter for exam routes
  if (req.path.includes("/exams/")) {
    res.setHeader("X-Frame-Options", "DENY");
  } else {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
  }

  // Enable the XSS filter built into most recent web browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Enhanced Content Security Policy for exam security
  if (req.path.includes("/exams/")) {
    // Stricter CSP for exam routes
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "connect-src 'self'; " +
        "img-src 'self' data:; " +
        "style-src 'self' 'unsafe-inline'; " +
        "font-src 'self'; " +
        "object-src 'none'; " +
        "media-src 'none'; " +
        "frame-src 'none'; " +
        "worker-src 'none'; " +
        "child-src 'none'; " +
        "form-action 'self'; " +
        "base-uri 'self';"
    );
  } else {
    // Standard CSP for other routes
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';"
    );
  }

  // Prevent pages from loading when they detect reflected XSS attacks
  res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");

  // Enhanced caching control for exam routes
  if (req.path.includes("/exams/")) {
    // Strict no-cache for exam content
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private, max-age=0"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

    // Additional exam-specific headers
    res.setHeader("X-Exam-Security", "enabled");
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  } else {
    // Standard caching control for API responses
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  // Prevent information disclosure
  res.setHeader("X-Powered-By", "AssessAI");
  res.removeHeader("X-Powered-By");

  // HSTS (HTTP Strict Transport Security) for HTTPS
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Prevent DNS prefetching
  res.setHeader("X-DNS-Prefetch-Control", "off");

  // Disable download of files
  if (req.path.includes("/exams/")) {
    res.setHeader("X-Download-Options", "noopen");
  }

  // Feature Policy / Permissions Policy for exam security
  if (req.path.includes("/exams/")) {
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), " +
        "accelerometer=(), gyroscope=(), magnetometer=(), " +
        "ambient-light-sensor=(), autoplay=(), encrypted-media=(), " +
        "fullscreen=(self), picture-in-picture=()"
    );
  }

  next();
};

module.exports = securityHeaders;
