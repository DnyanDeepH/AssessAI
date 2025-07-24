const aiService = require("../services/aiService");
const fileProcessingService = require("../services/fileProcessing");
const upload = require("../middleware/upload");

/**
 * AI Practice Zone Controller
 * Handles AI-powered question generation and practice sessions
 */
class AIController {
  /**
   * Upload document and generate practice questions
   * POST /api/ai/upload-and-generate
   */
  async uploadAndGenerate(req, res) {
    try {
      // File upload is handled by multer middleware
      const file = req.file;
      const {
        questionCount = 5,
        difficulty = "medium",
        topic = "general",
      } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: {
            code: "NO_FILE_UPLOADED",
            message: "Please upload a file (PDF, TXT, or DOCX)",
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Process uploaded file
      const processingResult = await fileProcessingService.processUploadedFile(
        file
      );

      if (!processingResult.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "FILE_PROCESSING_FAILED",
            message: "Failed to process uploaded file",
            details: processingResult.errors,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Validate text for AI processing
      const textValidation = fileProcessingService.validateTextForAI(
        processingResult.data.text
      );

      if (!textValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_TEXT_CONTENT",
            message: "Text content is not suitable for question generation",
            details: textValidation.errors,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Generate questions using AI service
      const mcqResult = await aiService.generateMCQs(
        processingResult.data.text,
        {
          questionCount: parseInt(questionCount),
          difficulty,
          topic,
        }
      );

      if (!mcqResult.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: "MCQ_GENERATION_FAILED",
            message: "Failed to generate questions",
            details: mcqResult.errors,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Create practice session
      const sessionId = this.generateSessionId();
      const practiceSession = {
        sessionId,
        userId: req.user.id,
        questions: mcqResult.data.questions,
        metadata: {
          ...mcqResult.data.metadata,
          fileInfo: processingResult.data.fileInfo,
          textStats: processingResult.data.textStats,
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        isActive: true,
      };

      // Store session in memory (in production, use Redis or database)
      this.storePracticeSession(sessionId, practiceSession);

      res.status(201).json({
        success: true,
        data: {
          sessionId,
          questions: mcqResult.data.questions,
          metadata: practiceSession.metadata,
          expiresAt: practiceSession.expiresAt,
        },
        warnings: mcqResult.warnings || [],
      });
    } catch (error) {
      console.error("Upload and generate error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Generate questions from text input
   * POST /api/ai/generate-from-text
   */
  async generateFromText(req, res) {
    try {
      const {
        text,
        questionCount = 5,
        difficulty = "medium",
        topic = "general",
      } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_TEXT_INPUT",
            message: "Text content is required",
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Validate text for AI processing
      const textValidation = fileProcessingService.validateTextForAI(text);

      if (!textValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_TEXT_CONTENT",
            message: "Text content is not suitable for question generation",
            details: textValidation.errors,
            suggestions: textValidation.suggestions,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Generate questions using AI service
      const mcqResult = await aiService.generateMCQs(text, {
        questionCount: parseInt(questionCount),
        difficulty,
        topic,
      });

      if (!mcqResult.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: "MCQ_GENERATION_FAILED",
            message: "Failed to generate questions",
            details: mcqResult.errors,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Create practice session
      const sessionId = this.generateSessionId();
      const practiceSession = {
        sessionId,
        userId: req.user.id,
        questions: mcqResult.data.questions,
        metadata: {
          ...mcqResult.data.metadata,
          textStats: fileProcessingService.getTextStatistics(text),
          inputMethod: "text",
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        isActive: true,
      };

      // Store session
      this.storePracticeSession(sessionId, practiceSession);

      res.status(201).json({
        success: true,
        data: {
          sessionId,
          questions: mcqResult.data.questions,
          metadata: practiceSession.metadata,
          expiresAt: practiceSession.expiresAt,
        },
        warnings: mcqResult.warnings || [],
      });
    } catch (error) {
      console.error("Generate from text error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Get practice session details
   * GET /api/ai/session/:sessionId
   */
  async getSession(req, res) {
    try {
      const { sessionId } = req.params;
      const session = this.getPracticeSession(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: {
            code: "SESSION_NOT_FOUND",
            message: "Practice session not found or expired",
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check if session belongs to current user
      if (session.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: "ACCESS_DENIED",
            message: "You do not have access to this practice session",
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        this.removePracticeSession(sessionId);
        return res.status(410).json({
          success: false,
          error: {
            code: "SESSION_EXPIRED",
            message: "Practice session has expired",
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.json({
        success: true,
        data: {
          sessionId: session.sessionId,
          questions: session.questions,
          metadata: session.metadata,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          isActive: session.isActive,
        },
      });
    } catch (error) {
      console.error("Get session error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Submit practice session answers
   * POST /api/ai/session/:sessionId/submit
   */
  async submitSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { answers } = req.body;

      if (!answers || typeof answers !== "object") {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_ANSWERS",
            message: "Answers object is required",
            timestamp: new Date().toISOString(),
          },
        });
      }

      const session = this.getPracticeSession(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: {
            code: "SESSION_NOT_FOUND",
            message: "Practice session not found or expired",
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (session.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: "ACCESS_DENIED",
            message: "You do not have access to this practice session",
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Calculate results
      const results = this.calculatePracticeResults(session.questions, answers);

      // Update session
      session.isActive = false;
      session.submittedAt = new Date();
      session.answers = answers;
      session.results = results;

      res.json({
        success: true,
        data: {
          sessionId,
          results,
          submittedAt: session.submittedAt,
        },
      });
    } catch (error) {
      console.error("Submit session error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Get AI service status
   * GET /api/ai/status
   */
  async getServiceStatus(req, res) {
    try {
      const status = aiService.getServiceStatus();

      res.json({
        success: true,
        data: {
          ...status,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Get service status error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Test AI service health
   * GET /api/ai/health
   */
  async testServiceHealth(req, res) {
    try {
      const healthCheck = await aiService.testService();

      res.json({
        success: true,
        data: healthCheck,
      });
    } catch (error) {
      console.error("Test service health error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "HEALTH_CHECK_FAILED",
          message: "AI service health check failed",
          details: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Helper methods

  /**
   * Generate unique session ID
   * @returns {string} - Unique session ID
   */
  generateSessionId() {
    return (
      "practice_" +
      Date.now() +
      "_" +
      Math.random().toString(36).substring(2, 11)
    );
  }

  /**
   * Store practice session (in-memory storage for demo)
   * In production, use Redis or database
   * @param {string} sessionId - Session ID
   * @param {Object} session - Session data
   */
  storePracticeSession(sessionId, session) {
    if (!global.practiceSessions) {
      global.practiceSessions = new Map();
    }
    global.practiceSessions.set(sessionId, session);

    // Auto-cleanup expired sessions
    setTimeout(() => {
      this.removePracticeSession(sessionId);
    }, 2 * 60 * 60 * 1000); // 2 hours
  }

  /**
   * Get practice session
   * @param {string} sessionId - Session ID
   * @returns {Object|null} - Session data or null
   */
  getPracticeSession(sessionId) {
    if (!global.practiceSessions) {
      return null;
    }
    return global.practiceSessions.get(sessionId) || null;
  }

  /**
   * Remove practice session
   * @param {string} sessionId - Session ID
   */
  removePracticeSession(sessionId) {
    if (global.practiceSessions) {
      global.practiceSessions.delete(sessionId);
    }
  }

  /**
   * Calculate practice session results
   * @param {Array} questions - Questions array
   * @param {Object} answers - User answers
   * @returns {Object} - Results summary
   */
  calculatePracticeResults(questions, answers) {
    let correctCount = 0;
    const questionResults = [];

    questions.forEach((question) => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;

      if (isCorrect) {
        correctCount++;
      }

      questionResults.push({
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      });
    });

    const totalQuestions = questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    return {
      totalQuestions,
      correctAnswers: correctCount,
      incorrectAnswers: totalQuestions - correctCount,
      percentage,
      grade: this.calculateGrade(percentage),
      questionResults,
    };
  }

  /**
   * Calculate grade based on percentage
   * @param {number} percentage - Score percentage
   * @returns {string} - Letter grade
   */
  calculateGrade(percentage) {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  }
}

module.exports = new AIController();
