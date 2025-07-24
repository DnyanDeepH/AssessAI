const geminiService = require("./geminiService");
const geminiMockService = require("./geminiMockService");

/**
 * Unified AI Service that can switch between real and mock implementations
 * This allows for development and testing without requiring actual API keys
 */
class AIService {
  constructor() {
    this.useMock =
      process.env.NODE_ENV === "test" || process.env.USE_MOCK_AI === "true";
    this.service = this.useMock ? geminiMockService : geminiService;

    // Fallback to mock if real service is not available
    if (!this.useMock && !this.service.isAvailable()) {
      console.warn(
        "Real AI service not available, falling back to mock service"
      );
      this.service = geminiMockService;
      this.useMock = true;
    }
  }

  /**
   * Check if AI service is available
   * @returns {boolean} - Service availability
   */
  isAvailable() {
    return this.service.isAvailable();
  }

  /**
   * Generate MCQs from text content
   * @param {string} text - Text content
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generated questions
   */
  async generateMCQs(text, options = {}) {
    try {
      return await this.service.generateMCQsWithRetry(text, options);
    } catch (error) {
      // If real service fails, try mock service as fallback
      if (!this.useMock) {
        console.warn(
          "Real AI service failed, trying mock service:",
          error.message
        );
        return await geminiMockService.generateMCQsWithRetry(text, options);
      }
      throw error;
    }
  }

  /**
   * Validate MCQ structure
   * @param {Object} data - MCQ data
   * @returns {Object} - Validation result
   */
  validateMCQStructure(data) {
    return this.service.validateMCQStructure(data);
  }

  /**
   * Get service status and information
   * @returns {Object} - Service status
   */
  getServiceStatus() {
    const status = this.service.getServiceStatus();
    return {
      ...status,
      usingMock: this.useMock,
      fallbackAvailable: !this.useMock,
    };
  }

  /**
   * Test the AI service
   * @returns {Promise<Object>} - Test result
   */
  async testService() {
    return await this.service.testService();
  }

  /**
   * Switch to mock service (for testing)
   */
  useMockService() {
    this.service = geminiMockService;
    this.useMock = true;
  }

  /**
   * Switch to real service (if available)
   */
  useRealService() {
    if (geminiService.isAvailable()) {
      this.service = geminiService;
      this.useMock = false;
    } else {
      throw new Error("Real AI service is not available");
    }
  }

  /**
   * Get current service type
   * @returns {string} - Service type ('real' or 'mock')
   */
  getServiceType() {
    return this.useMock ? "mock" : "real";
  }
}

module.exports = new AIService();
