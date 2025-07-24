const aiService = require("../services/aiService");
const textExtractionService =
  process.env.NODE_ENV === "production"
    ? require("../services/textExtractionServerless")
    : require("../services/textExtraction");

/**
 * Serverless-compatible AI Controller
 * Handles AI-powered question generation for both regular and serverless environments
 */
class AIControllerServerless {
  /**
   * Upload document and generate practice questions (serverless compatible)
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

      let extractedText;
      let fileInfo;
      let textStats;

      try {
        // Handle both buffer (serverless) and file path (regular) uploads
        if (file.buffer) {
          // Serverless environment - file is in memory
          extractedText = await textExtractionService.extractTextFromBuffer(
            file.buffer,
            file.originalname
          );

          fileInfo = {
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            uploadedAt: new Date().toISOString(),
          };
        } else {
          // Regular environment - file is on disk
          const fileProcessingService = require("../services/fileProcessing");
          const processingResult =
            await fileProcessingService.processUploadedFile(file);

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

          extractedText = processingResult.data.text;
          fileInfo = processingResult.data.fileInfo;
        }

        // Validate extracted text
        const isValidText =
          textExtractionService.validateTextContent(extractedText);

        if (!isValidText) {
          return res.status(400).json({
            success: false,
            error: {
              code: "INVALID_TEXT_CONTENT",
              message:
                "Text content is not suitable for question generation. Please ensure the document contains sufficient readable text (at least 100 characters with meaningful content).",
              timestamp: new Date().toISOString(),
            },
          });
        }

        // Sanitize text and get statistics
        const sanitizedText = textExtractionService.sanitizeText(extractedText);
        textStats = textExtractionService.getTextStatistics(sanitizedText);

        // Generate questions using AI service
        const mcqResult = await aiService.generateMCQs(sanitizedText, {
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
            fileInfo,
            textStats,
            generatedAt: new Date().toISOString(),
            parameters: {
              questionCount: parseInt(questionCount),
              difficulty,
              topic,
            },
          },
        };

        // Store session in memory/cache (in production, you might want to use Redis)
        // For now, we'll return it directly to the client

        res.status(200).json({
          success: true,
          message: "Questions generated successfully",
          data: {
            session: practiceSession,
            summary: {
              questionsGenerated: mcqResult.data.questions.length,
              sourceFile: fileInfo.originalName,
              textLength: textStats.characterCount,
              wordCount: textStats.wordCount,
              difficulty,
              topic,
            },
          },
        });
      } catch (extractionError) {
        console.error("Text extraction error:", extractionError);
        return res.status(400).json({
          success: false,
          error: {
            code: "TEXT_EXTRACTION_FAILED",
            message: "Failed to extract text from the uploaded file",
            details: extractionError.message,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("AI upload and generate error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred during question generation",
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

      // Validate text content
      const isValidText = textExtractionService.validateTextContent(text);

      if (!isValidText) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_TEXT_CONTENT",
            message:
              "Text content is not suitable for question generation. Please ensure the text contains sufficient readable content (at least 100 characters with meaningful content).",
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Sanitize text and get statistics
      const sanitizedText = textExtractionService.sanitizeText(text);
      const textStats = textExtractionService.getTextStatistics(sanitizedText);

      // Generate questions using AI service
      const mcqResult = await aiService.generateMCQs(sanitizedText, {
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
          textStats,
          generatedAt: new Date().toISOString(),
          parameters: {
            questionCount: parseInt(questionCount),
            difficulty,
            topic,
          },
        },
      };

      res.status(200).json({
        success: true,
        message: "Questions generated successfully",
        data: {
          session: practiceSession,
          summary: {
            questionsGenerated: mcqResult.data.questions.length,
            textLength: textStats.characterCount,
            wordCount: textStats.wordCount,
            difficulty,
            topic,
          },
        },
      });
    } catch (error) {
      console.error("AI generate from text error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred during question generation",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Get practice session
   * GET /api/ai/session/:sessionId
   */
  async getSession(req, res) {
    try {
      const { sessionId } = req.params;

      // In a real implementation, you would retrieve this from a database or cache
      // For now, return a not found response since we're not storing sessions
      res.status(404).json({
        success: false,
        error: {
          code: "SESSION_NOT_FOUND",
          message: "Practice session not found or expired",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Get session error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve practice session",
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

      // In a real implementation, you would:
      // 1. Retrieve the session from database/cache
      // 2. Calculate the score
      // 3. Store the results
      // 4. Return detailed feedback

      res.status(404).json({
        success: false,
        error: {
          code: "SESSION_NOT_FOUND",
          message: "Practice session not found or expired",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Submit session error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit practice session",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get AI service status
   * GET /api/ai/status
   */
  async getStatus(req, res) {
    try {
      const status = aiService.getServiceStatus();

      res.status(200).json({
        success: true,
        data: {
          ...status,
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("AI status error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "STATUS_CHECK_FAILED",
          message: "Failed to check AI service status",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Test AI service
   * POST /api/ai/test
   */
  async testService(req, res) {
    try {
      const testResult = await aiService.testService();

      res.status(200).json({
        success: true,
        message: "AI service test completed",
        data: testResult,
      });
    } catch (error) {
      console.error("AI test error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "SERVICE_TEST_FAILED",
          message: "AI service test failed",
          details: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}

module.exports = new AIControllerServerless();
