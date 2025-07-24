/**
 * Dependency health check utility for AssessAI platform
 * Checks the health of external dependencies and services
 */

const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Check the health of all system dependencies
 * @returns {Object} Dependency health status
 */
const checkDependencies = async () => {
  const checks = [];

  // Check database connectivity
  const dbCheck = await checkDatabase();
  checks.push(dbCheck);

  // Check file system
  const fsCheck = await checkFileSystem();
  checks.push(fsCheck);

  // Check Gemini API
  const geminiCheck = await checkGeminiAPI();
  checks.push(geminiCheck);

  // Determine overall health
  const allHealthy = checks.every((check) => check.status === "healthy");

  return {
    allHealthy,
    checks: checks.reduce((acc, check) => {
      acc[check.name] = check;
      return acc;
    }, {}),
  };
};

/**
 * Check database connectivity and performance
 * @returns {Object} Database health status
 */
const checkDatabase = async () => {
  const startTime = Date.now();

  try {
    // Check connection state
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      return {
        name: "database",
        status: "unhealthy",
        responseTime: `${Date.now() - startTime}ms`,
        details: {
          isConnected: false,
          readyState: mongoose.connection.readyState,
          error: "Database not connected",
        },
      };
    }

    // Perform a simple query to test responsiveness
    await mongoose.connection.db.admin().ping();

    const responseTime = Date.now() - startTime;

    return {
      name: "database",
      status: "healthy",
      responseTime: `${responseTime}ms`,
      details: {
        isConnected: true,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        collections: Object.keys(mongoose.connection.collections).length,
      },
    };
  } catch (error) {
    return {
      name: "database",
      status: "unhealthy",
      responseTime: `${Date.now() - startTime}ms`,
      details: {
        isConnected: false,
        error: error.message,
      },
    };
  }
};

/**
 * Check file system accessibility and permissions
 * @returns {Object} File system health status
 */
const checkFileSystem = async () => {
  const startTime = Date.now();

  try {
    const uploadPath = process.env.UPLOAD_PATH || "./uploads";
    const logsPath = "./logs";

    // Check if upload directory exists and is writable
    const uploadCheck = await checkDirectory(uploadPath);
    const logsCheck = await checkDirectory(logsPath);

    const responseTime = Date.now() - startTime;

    return {
      name: "fileSystem",
      status:
        uploadCheck.writable && logsCheck.writable ? "healthy" : "unhealthy",
      responseTime: `${responseTime}ms`,
      details: {
        uploadsDirectory: uploadCheck,
        logsDirectory: logsCheck,
      },
    };
  } catch (error) {
    return {
      name: "fileSystem",
      status: "unhealthy",
      responseTime: `${Date.now() - startTime}ms`,
      details: {
        error: error.message,
      },
    };
  }
};

/**
 * Check directory existence and permissions
 * @param {String} dirPath - Directory path to check
 * @returns {Object} Directory status
 */
const checkDirectory = async (dirPath) => {
  try {
    const stats = await fs.stat(dirPath);

    // Try to create a test file to check write permissions
    const testFile = path.join(dirPath, ".health-check-test");
    await fs.writeFile(testFile, "test");
    await fs.unlink(testFile);

    return {
      exists: true,
      writable: true,
      isDirectory: stats.isDirectory(),
      size: stats.size,
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      // Directory doesn't exist, try to create it
      try {
        await fs.mkdir(dirPath, { recursive: true });
        return {
          exists: true,
          writable: true,
          isDirectory: true,
          created: true,
        };
      } catch (createError) {
        return {
          exists: false,
          writable: false,
          error: createError.message,
        };
      }
    }

    return {
      exists: true,
      writable: false,
      error: error.message,
    };
  }
};

/**
 * Check Gemini API connectivity and configuration
 * @returns {Object} Gemini API health status
 */
const checkGeminiAPI = async () => {
  const startTime = Date.now();

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        name: "geminiApi",
        status: "unhealthy",
        responseTime: `${Date.now() - startTime}ms`,
        details: {
          isConfigured: false,
          error: "API key not configured",
        },
      };
    }

    // Initialize Gemini AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Perform a simple test request
    const result = await model.generateContent("Test connection");

    const responseTime = Date.now() - startTime;

    return {
      name: "geminiApi",
      status: "healthy",
      responseTime: `${responseTime}ms`,
      details: {
        isConfigured: true,
        lastCheck: new Date().toISOString(),
        model: "gemini-pro",
      },
    };
  } catch (error) {
    return {
      name: "geminiApi",
      status: "unhealthy",
      responseTime: `${Date.now() - startTime}ms`,
      details: {
        isConfigured: !!process.env.GEMINI_API_KEY,
        error: error.message,
      },
    };
  }
};

module.exports = {
  checkDependencies,
  checkDatabase,
  checkFileSystem,
  checkGeminiAPI,
};
