/**
 * Health check routes for AssessAI platform
 */

const express = require("express");
const router = express.Router();
const {
  getDetailedHealth,
  getApiStatus,
} = require("../controllers/healthController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roleCheck");

// Public routes
router.get("/status", getApiStatus);

// Protected routes
router.get("/detailed", authenticate, requireAdmin, getDetailedHealth);

module.exports = router;
