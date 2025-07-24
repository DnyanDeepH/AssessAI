const textExtractionService = require("./textExtraction");
const fileValidationService = require("./fileValidation");

class FileProcessingService {
  /**
   * Process uploaded file: validate, extract text, and cleanup
   * @param {Object} file - Multer file object
   * @returns {Promise<Object>} - Processing result
   */
  async processUploadedFile(file) {
    const result = {
      success: false,
      data: null,
      errors: [],
      warnings: [],
    };

    try {
      // Step 1: Validate file
      const validationResult = await fileValidationService.validateFile(file);

      if (!validationResult.isValid) {
        result.errors = validationResult.errors;
        result.warnings = validationResult.warnings;

        // Cleanup invalid file
        await textExtractionService.cleanupFile(file.path);
        return result;
      }

      // Add validation warnings to result
      result.warnings = validationResult.warnings;

      // Step 2: Extract text content
      const extractedText = await textExtractionService.extractText(
        file.path,
        file.originalname
      );

      // Step 3: Validate extracted text
      if (!textExtractionService.validateTextContent(extractedText)) {
        result.errors.push("Extracted text content is invalid or insufficient");
        await textExtractionService.cleanupFile(file.path);
        return result;
      }

      // Step 4: Sanitize text content
      const sanitizedText = textExtractionService.sanitizeText(extractedText);

      // Step 5: Prepare result data
      result.success = true;
      result.data = {
        text: sanitizedText,
        fileInfo: fileValidationService.getFileInfo(file),
        textStats: this.getTextStatistics(sanitizedText),
      };

      // Step 6: Cleanup uploaded file
      await textExtractionService.cleanupFile(file.path);
    } catch (error) {
      result.errors.push(`File processing failed: ${error.message}`);

      // Ensure cleanup even on error
      try {
        await textExtractionService.cleanupFile(file.path);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError.message);
      }
    }

    return result;
  }

  /**
   * Get statistics about extracted text
   * @param {string} text - Extracted text
   * @returns {Object} - Text statistics
   */
  getTextStatistics(text) {
    if (!text) {
      return {
        characterCount: 0,
        wordCount: 0,
        lineCount: 0,
        paragraphCount: 0,
      };
    }

    const lines = text.split("\n");
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const paragraphs = text
      .split(/\n\s*\n/)
      .filter((para) => para.trim().length > 0);

    return {
      characterCount: text.length,
      wordCount: words.length,
      lineCount: lines.length,
      paragraphCount: paragraphs.length,
    };
  }

  /**
   * Validate text content for AI processing
   * @param {string} text - Text to validate
   * @returns {Object} - Validation result
   */
  validateTextForAI(text) {
    const result = {
      isValid: true,
      errors: [],
      suggestions: [],
    };

    if (!text || typeof text !== "string") {
      result.isValid = false;
      result.errors.push("No text content provided");
      return result;
    }

    const trimmedText = text.trim();

    // Check minimum length for meaningful question generation
    if (trimmedText.length < 100) {
      result.isValid = false;
      result.errors.push(
        "Text content is too short for meaningful question generation (minimum 100 characters)"
      );
    }

    // Check maximum length for API limits
    if (trimmedText.length > 50000) {
      result.isValid = false;
      result.errors.push(
        "Text content is too long for processing (maximum 50,000 characters)"
      );
    }

    // Check for meaningful content
    const wordCount = trimmedText.split(/\s+/).length;
    if (wordCount < 20) {
      result.isValid = false;
      result.errors.push(
        "Text content has insufficient words for question generation (minimum 20 words)"
      );
    }

    // Suggestions for better results
    if (wordCount < 100) {
      result.suggestions.push(
        "More content would help generate better questions"
      );
    }

    if (!/[.!?]/.test(trimmedText)) {
      result.suggestions.push(
        "Content with complete sentences would improve question quality"
      );
    }

    return result;
  }

  /**
   * Prepare text for AI processing by chunking if necessary
   * @param {string} text - Text to prepare
   * @param {number} maxChunkSize - Maximum chunk size (default: 30000 characters)
   * @returns {Array<string>} - Array of text chunks
   */
  prepareTextForAI(text, maxChunkSize = 30000) {
    if (!text || text.length <= maxChunkSize) {
      return [text];
    }

    const chunks = [];

    // First try to split by sentences
    const sentences = text
      .split(/[.!?]+/)
      .filter((sentence) => sentence.trim().length > 0);

    // If we have sentences, use sentence-based chunking
    if (sentences.length > 1) {
      let currentChunk = "";

      for (const sentence of sentences) {
        const sentenceWithPunctuation = sentence.trim() + ".";

        if ((currentChunk + sentenceWithPunctuation).length <= maxChunkSize) {
          currentChunk += (currentChunk ? " " : "") + sentenceWithPunctuation;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk);
          }
          currentChunk = sentenceWithPunctuation;
        }
      }

      if (currentChunk) {
        chunks.push(currentChunk);
      }
    } else {
      // If no sentence boundaries, split by words or characters
      const words = text.split(/\s+/);

      if (words.length > 1) {
        // Split by words
        let currentChunk = "";

        for (const word of words) {
          if ((currentChunk + " " + word).length <= maxChunkSize) {
            currentChunk += (currentChunk ? " " : "") + word;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk);
            }
            currentChunk = word;
          }
        }

        if (currentChunk) {
          chunks.push(currentChunk);
        }
      } else {
        // Last resort: split by character count
        for (let i = 0; i < text.length; i += maxChunkSize) {
          chunks.push(text.slice(i, i + maxChunkSize));
        }
      }
    }

    return chunks.length > 0 ? chunks : [text];
  }
}

module.exports = new FileProcessingService();
