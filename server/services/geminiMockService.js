/**
 * Mock Gemini Service for development and testing
 * This service simulates the Gemini API responses for development purposes
 */
class GeminiMockService {
  constructor() {
    this.isEnabled = true;
    this.mockDelay = 2000; // Simulate API delay
  }

  /**
   * Check if service is available
   * @returns {boolean} - Always true for mock service
   */
  isAvailable() {
    return this.isEnabled;
  }

  /**
   * Generate mock MCQs from text content
   * @param {string} text - Text content to generate questions from
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Mock generated questions result
   */
  async generateMCQs(text, options = {}) {
    const {
      questionCount = 5,
      difficulty = "medium",
      topic = "general",
      language = "english",
    } = options;

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, this.mockDelay));

    // Generate mock questions based on text content
    const mockQuestions = this.generateMockQuestions(
      text,
      questionCount,
      difficulty,
      topic
    );

    return {
      success: true,
      data: {
        questions: mockQuestions,
        metadata: {
          totalQuestions: questionCount,
          difficulty: difficulty,
          generatedAt: new Date().toISOString(),
          sourceLength: text.length,
          isMock: true,
        },
      },
      errors: [],
      warnings: ["This is a mock response for development purposes"],
    };
  }

  /**
   * Generate mock questions with retry logic
   * @param {string} text - Source text
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result
   */
  async generateMCQsWithRetry(text, options = {}) {
    // Mock service doesn't need retries, but we'll simulate it
    const result = await this.generateMCQs(text, options);

    return {
      ...result,
      metadata: {
        ...result.data.metadata,
        attempts: 1,
        retries: 0,
      },
    };
  }

  /**
   * Generate mock questions based on text analysis
   * @param {string} text - Source text
   * @param {number} count - Number of questions to generate
   * @param {string} difficulty - Question difficulty
   * @param {string} topic - Question topic
   * @returns {Array} - Array of mock questions
   */
  generateMockQuestions(text, count, difficulty, topic) {
    const questions = [];
    const words = text.split(/\s+/).filter((word) => word.length > 3);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);

    // Generate questions based on text content
    for (let i = 0; i < count; i++) {
      const questionTemplates = this.getQuestionTemplates(difficulty);
      const template = questionTemplates[i % questionTemplates.length];

      // Pick random content from text
      const randomSentence =
        sentences[Math.floor(Math.random() * sentences.length)];
      const randomWords = this.getRandomWords(words, 4);

      const question = {
        id: i + 1,
        question: template.question.replace(
          "{content}",
          randomSentence.trim().substring(0, 50) + "..."
        ),
        options: {
          A: template.options.correct.replace("{word}", randomWords[0]),
          B: template.options.wrong1.replace("{word}", randomWords[1]),
          C: template.options.wrong2.replace("{word}", randomWords[2]),
          D: template.options.wrong3.replace("{word}", randomWords[3]),
        },
        correctAnswer: "A",
        explanation: template.explanation.replace("{word}", randomWords[0]),
        difficulty: difficulty,
        topic: topic,
      };

      questions.push(question);
    }

    return questions;
  }

  /**
   * Get question templates based on difficulty
   * @param {string} difficulty - Question difficulty level
   * @returns {Array} - Array of question templates
   */
  getQuestionTemplates(difficulty) {
    const templates = {
      easy: [
        {
          question:
            "Based on the text '{content}', what is the main concept discussed?",
          options: {
            correct: "The primary focus is on {word}",
            wrong1: "The text mainly discusses {word}",
            wrong2: "The central theme is {word}",
            wrong3: "The key topic is {word}",
          },
          explanation:
            "The correct answer is {word} as it appears most frequently in the context.",
        },
        {
          question: "Which term is most relevant to the content provided?",
          options: {
            correct: "{word} is directly mentioned",
            wrong1: "{word} is implied but not stated",
            wrong2: "{word} is unrelated to the topic",
            wrong3: "{word} contradicts the main idea",
          },
          explanation:
            "{word} is the most relevant term based on the text analysis.",
        },
      ],
      medium: [
        {
          question: "What can be inferred from the text '{content}'?",
          options: {
            correct: "The text suggests that {word} is important",
            wrong1: "The text indicates that {word} is irrelevant",
            wrong2: "The text proves that {word} is false",
            wrong3: "The text shows that {word} is outdated",
          },
          explanation:
            "Based on contextual analysis, {word} emerges as a significant concept.",
        },
        {
          question: "How does the text relate to the concept of {word}?",
          options: {
            correct: "It provides supporting evidence for {word}",
            wrong1: "It contradicts the idea of {word}",
            wrong2: "It is unrelated to {word}",
            wrong3: "It questions the validity of {word}",
          },
          explanation:
            "The text content aligns with and supports the concept of {word}.",
        },
      ],
      hard: [
        {
          question:
            "Analyze the relationship between the concepts presented in '{content}'. What is the most accurate conclusion?",
          options: {
            correct: "The concepts demonstrate a clear connection to {word}",
            wrong1: "The concepts are contradictory to {word}",
            wrong2: "The concepts are independent of {word}",
            wrong3: "The concepts disprove {word}",
          },
          explanation:
            "Through careful analysis, the interconnected concepts support the importance of {word}.",
        },
        {
          question:
            "What is the most sophisticated interpretation of the text's implications regarding {word}?",
          options: {
            correct: "The text provides nuanced support for {word}",
            wrong1: "The text offers superficial coverage of {word}",
            wrong2: "The text completely ignores {word}",
            wrong3: "The text misrepresents {word}",
          },
          explanation:
            "A deeper analysis reveals that the text offers sophisticated insights into {word}.",
        },
      ],
    };

    return templates[difficulty] || templates.medium;
  }

  /**
   * Get random words from text
   * @param {Array} words - Array of words
   * @param {number} count - Number of words to return
   * @returns {Array} - Array of random words
   */
  getRandomWords(words, count) {
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Validate MCQ structure (same as real service)
   * @param {Object} data - MCQ data to validate
   * @returns {Object} - Validation result
   */
  validateMCQStructure(data) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!data || typeof data !== "object") {
      result.isValid = false;
      result.errors.push("Response is not a valid object");
      return result;
    }

    if (!Array.isArray(data.questions)) {
      result.isValid = false;
      result.errors.push("Questions array is missing or invalid");
      return result;
    }

    if (data.questions.length === 0) {
      result.isValid = false;
      result.errors.push("No questions generated");
      return result;
    }

    // Validate each question
    data.questions.forEach((question, index) => {
      const questionErrors = this.validateSingleQuestion(question, index + 1);
      result.errors.push(...questionErrors);
    });

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate a single question (same as real service)
   * @param {Object} question - Question object
   * @param {number} questionNumber - Question number
   * @returns {Array} - Array of validation errors
   */
  validateSingleQuestion(question, questionNumber) {
    const errors = [];

    if (!question || typeof question !== "object") {
      errors.push(`Question ${questionNumber}: Invalid question object`);
      return errors;
    }

    if (!question.question || typeof question.question !== "string") {
      errors.push(
        `Question ${questionNumber}: Missing or invalid question text`
      );
    }

    if (!question.options || typeof question.options !== "object") {
      errors.push(`Question ${questionNumber}: Missing or invalid options`);
    } else {
      const requiredOptions = ["A", "B", "C", "D"];
      const providedOptions = Object.keys(question.options);

      if (providedOptions.length !== 4) {
        errors.push(`Question ${questionNumber}: Must have exactly 4 options`);
      }

      requiredOptions.forEach((option) => {
        if (!providedOptions.includes(option)) {
          errors.push(`Question ${questionNumber}: Missing option ${option}`);
        }
      });
    }

    if (
      !question.correctAnswer ||
      !["A", "B", "C", "D"].includes(question.correctAnswer)
    ) {
      errors.push(`Question ${questionNumber}: Invalid correct answer`);
    }

    return errors;
  }

  /**
   * Get service status
   * @returns {Object} - Service status
   */
  getServiceStatus() {
    return {
      isEnabled: this.isEnabled,
      hasApiKey: true,
      model: "mock-gemini-service",
      isMock: true,
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * Test the mock service
   * @returns {Promise<Object>} - Test result
   */
  async testService() {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      response: '{"status": "working", "message": "Mock API is functional"}',
      isMock: true,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new GeminiMockService();
