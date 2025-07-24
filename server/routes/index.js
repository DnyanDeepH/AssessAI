/**
 * Main routes file for AssessAI platform
 */

const express = require("express");
const router = express.Router();
const { getSimpleHealth } = require("../controllers/healthController");

// Import route modules
const authRoutes = require("./auth");
const studentRoutes = require("./student");
const adminRoutes = require("./admin");
const aiRoutes = require("./aiRoutes");
const healthRoutes = require("./healthRoutes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/student", studentRoutes);
router.use("/admin", adminRoutes);
router.use("/ai", aiRoutes);
router.use("/health", healthRoutes);

// API documentation route
router.use("/api-docs", express.static("docs/api"));

// Root API route
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AssessAI API is running",
    version: "1.0.0",
    documentation: "/api/api-docs",
  });
});

// Export router
module.exports = router;
