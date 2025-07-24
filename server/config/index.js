/**
 * Main configuration file for AssessAI server
 */

const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database configuration
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/assessai",

  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  jwtExpire: process.env.JWT_EXPIRE || "24h",

  // Google Gemini API configuration
  geminiApiKey: process.env.GEMINI_API_KEY,

  // File upload configuration
  maxFileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ["pdf", "txt", "docx"],

  // Rate limiting
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // limit each IP to 100 requests per windowMs

  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",

  // Logger configuration (will be set up by monitoring middleware)
  logger: null,
};

module.exports = config;
