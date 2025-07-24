const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;

    if (!this.apiKey) {
      console.warn(
        "GEMINI_API_KEY not found in environment variables. AI features will be disabled."
      );
      this.isEnabled = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
      this.isEnabled = true;
    } catch (error) {
      console.error("Failed to initialize Gemini API:", error.message);
      this.isEnabled = false;
    }
  }

  /**
   * Check if Gemini service is available
   * @returns {boolean} - Service availability status
   */
  isAvailable() {
    return this.isEnabled;
  }

  /**
   * Generate multiple choice questions from text content
   * @param {string} text - Text content to generate questions from
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generated questions result
   */
  async generateMCQs(text, options = {}) {
    if (!this.isEnabled) {
      throw new Error("Gemini API service is not available");
    }

    const {
      questionCount = 5,
      difficulty = "medium",
      topic = "general",
      language = "english",
    } = options;

    try {
      const prompt = this.buildMCQPrompt(text, {
        questionCount,
        difficulty,
        topic,
        language,
      });

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();

      return this.parseMCQResponse(generatedText);
    } catch (error) {
      throw new Error(`MCQ generation failed: ${error.message}`);
    }
  }

  /**
   * Build structured prompt for MCQ generation
   * @param {string} text - Source text
   * @param {Object} options - Generation options
   * @returns {string} - Formatted prompt
   */
  buildMCQPrompt(text, options) {
    const { questionCount, difficulty, topic, language } = options;

    return `
You are an expert educator tasked with creating high-quality multiple choice questions (MCQs) from the provided text content.

**Instructions:**
1. Generate exactly ${questionCount} multiple choice questions based on the provided text
2. Each question should have exactly 4 options (A, B, C, D)
3. Only one option should be correct
4. Questions should be at ${difficulty} difficulty level
5. Focus on ${topic} concepts if applicable
6. Use ${language} language
7. Ensure questions test understanding, not just memorization
8. Make incorrect options plausible but clearly wrong
9. Avoid questions that can be answered without reading the text

**Text Content:**
${text}

**Required Output Format (JSON):**
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": {
        "A": "First option",
        "B": "Second option", 
        "C": "Third option",
        "D": "Fourth option"
      },
      "correctAnswer": "A",
      "explanation": "Brief explanation of why this answer is correct",
      "difficulty": "${difficulty}",
      "topic": "Relevant topic/concept"
    }
  ],
  "metadata": {
    "totalQuestions": ${questionCount},
    "difficulty": "${difficulty}",
    "generatedAt": "${new Date().toISOString()}",
    "sourceLength": ${text.length}
  }
}

**Important:** 
- Return ONLY valid JSON, no additional text or formatting
- Ensure all questions are directly answerable from the provided text
- Make sure the JSON is properly formatted and parseable
- Each question should be unique and test different concepts
`;
  }

  /**
   * Parse Gemini API response and validate MCQ format
   * @param {string} responseText - Raw response from Gemini
   * @returns {Object} - Parsed and validated MCQ data
   */
  parseMCQResponse(responseText) {
    try {
      // Clean the response text (remove any markdown formatting)
      let cleanedText = responseText.trim();

      // Remove markdown code blocks if present
      cleanedText = cleanedText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");

      // Parse JSON
      const parsedData = JSON.parse(cleanedText);

      // Validate structure
      const validationResult = this.validateMCQStructure(parsedData);

      if (!validationResult.isValid) {
        throw new Error(
          `Invalid MCQ structure: ${validationResult.errors.join(", ")}`
        );
      }

      return {
        success: true,
        data: parsedData,
        errors: [],
        warnings: validationResult.warnings || [],
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        errors: [`Failed to parse MCQ response: ${error.message}`],
        warnings: [],
      };
    }
  }

  /**
   * Validate MCQ structure and content
   * @param {Object} data - Parsed MCQ data
   * @returns {Object} - Validation result
   */
  validateMCQStructure(data) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check top-level structure
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

    // Check metadata
    if (!data.metadata || typeof data.metadata !== "object") {
      result.warnings.push("Metadata is missing or invalid");
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate a single MCQ question
   * @param {Object} question - Question object
   * @param {number} questionNumber - Question number for error reporting
   * @returns {Array<string>} - Array of validation errors
   */
  validateSingleQuestion(question, questionNumber) {
    const errors = [];

    if (!question || typeof question !== "object") {
      errors.push(`Question ${questionNumber}: Invalid question object`);
      return errors;
    }

    // Check required fields
    if (!question.question || typeof question.question !== "string") {
      errors.push(
        `Question ${questionNumber}: Missing or invalid question text`
      );
    }

    if (!question.options || typeof question.options !== "object") {
      errors.push(`Question ${questionNumber}: Missing or invalid options`);
    } else {
      // Check options structure
      const requiredOptions = ["A", "B", "C", "D"];
      const providedOptions = Object.keys(question.options);

      if (providedOptions.length !== 4) {
        errors.push(`Question ${questionNumber}: Must have exactly 4 options`);
      }

      requiredOptions.forEach((option) => {
        if (!providedOptions.includes(option)) {
          errors.push(`Question ${questionNumber}: Missing option ${option}`);
        }
        if (
          question.options[option] &&
          typeof question.options[option] !== "string"
        ) {
          errors.push(
            `Question ${questionNumber}: Option ${option} must be a string`
          );
        }
      });
    }

    if (!question.correctAnswer || typeof question.correctAnswer !== "string") {
      errors.push(
        `Question ${questionNumber}: Missing or invalid correct answer`
      );
    } else if (!["A", "B", "C", "D"].includes(question.correctAnswer)) {
      errors.push(
        `Question ${questionNumber}: Correct answer must be A, B, C, or D`
      );
    }

    // Optional but recommended fields
    if (!question.explanation) {
      // This is a warning, not an error
    }

    return errors;
  }

  /**
   * Generate questions with retry logic and fallback options
   * @param {string} text - Source text
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result with retry information
   */
  async generateMCQsWithRetry(text, options = {}) {
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.generateMCQs(text, options);

        if (result.success) {
          return {
            ...result,
            metadata: {
              ...result.data.metadata,
              attempts: attempt,
              retries: attempt - 1,
            },
          };
        }

        lastError = new Error(`Generation failed: ${result.errors.join(", ")}`);
      } catch (error) {
        lastError = error;
        console.warn(
          `MCQ generation attempt ${attempt} failed:`,
          error.message
        );

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    // All retries failed
    return {
      success: false,
      data: null,
      errors: [`Failed after ${maxRetries} attempts: ${lastError.message}`],
      warnings: [],
      metadata: {
        attempts: maxRetries,
        retries: maxRetries,
        failed: true,
      },
    };
  }

  /**
   * Get service health and status information
   * @returns {Object} - Service status
   */
  getServiceStatus() {
    return {
      isEnabled: this.isEnabled,
      hasApiKey: !!this.apiKey,
      model: this.isEnabled ? "gemini-2.5-pro" : null,
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * Test the service with a simple prompt
   * @returns {Promise<Object>} - Test result
   */
  async testService() {
    if (!this.isEnabled) {
      return {
        success: false,
        error: "Service is not enabled",
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const testPrompt =
        'Generate a simple test response to verify the API is working. Respond with: {"status": "working", "message": "API is functional"}';
      const result = await this.model.generateContent(testPrompt);
      const response = await result.response;

      return {
        success: true,
        response: response.text(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = new GeminiService();
