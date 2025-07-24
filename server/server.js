const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const securityHeaders = require("./middleware/securityHeaders");
const rateLimiter = require("./middleware/rateLimiter");
const browserDetection = require("./middleware/browserDetection");
const monitorRequest = require("./middleware/monitoring");
const { getHealthInfo } = require("./utils/healthCheck");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());
app.use(securityHeaders);
app.use(browserDetection);

// Monitoring middleware
app.use(monitorRequest);

// Apply general rate limiting to all routes
app.use("/api/", rateLimiter("general"));

// Apply stricter rate limiting to auth routes
app.use("/api/auth/", rateLimiter("auth"));

// Apply exam-specific rate limiting to exam routes
app.use("/api/student/exams/", rateLimiter("exam"));

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const healthInfo = await getHealthInfo();
    res.status(200).json({
      success: true,
      message: "Server is running",
      ...healthInfo,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Server is unhealthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      error: error.message,
    });
  }
});

// Import routes
const routes = require("./routes");

// Mount API routes
app.use("/api", routes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Route not found",
    },
  });
});

// Error handler middleware
app.use(errorHandler);

// Only start server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => {
      process.exit(1);
    });
  });
}

module.exports = app;
