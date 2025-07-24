const fs = require("fs").promises;
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

class TextExtractionServiceServerless {
  /**
   * Extract text from uploaded file buffer (serverless compatible)
   * @param {Buffer} fileBuffer - File buffer data
   * @param {string} originalName - Original filename
   * @returns {Promise<string>} - Extracted text content
   */
  async extractTextFromBuffer(fileBuffer, originalName) {
    try {
      const fileExtension = path.extname(originalName).toLowerCase();

      switch (fileExtension) {
        case ".pdf":
          return await this.extractFromPDFBuffer(fileBuffer);
        case ".txt":
          return await this.extractFromTXTBuffer(fileBuffer);
        case ".docx":
          return await this.extractFromDOCXBuffer(fileBuffer);
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }
    } catch (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF buffer
   * @param {Buffer} buffer - PDF file buffer
   * @returns {Promise<string>} - Extracted text
   */
  async extractFromPDFBuffer(buffer) {
    try {
      const data = await pdfParse(buffer);

      if (!data.text || data.text.trim().length === 0) {
        throw new Error("No text content found in PDF file");
      }

      return data.text.trim();
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from TXT buffer
   * @param {Buffer} buffer - TXT file buffer
   * @returns {Promise<string>} - Extracted text
   */
  async extractFromTXTBuffer(buffer) {
    try {
      const text = buffer.toString("utf8");

      if (!text || text.trim().length === 0) {
        throw new Error("No text content found in TXT file");
      }

      return text.trim();
    } catch (error) {
      throw new Error(`TXT extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from DOCX buffer
   * @param {Buffer} buffer - DOCX file buffer
   * @returns {Promise<string>} - Extracted text
   */
  async extractFromDOCXBuffer(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });

      if (!result.value || result.value.trim().length === 0) {
        throw new Error("No text content found in DOCX file");
      }

      return result.value.trim();
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${error.message}`);
    }
  }

  /**
   * Validate extracted text content
   * @param {string} text - Text to validate
   * @returns {boolean} - Whether text is valid
   */
  validateTextContent(text) {
    if (!text || typeof text !== "string") {
      return false;
    }

    const trimmedText = text.trim();

    // Check minimum length (at least 100 characters for meaningful content)
    if (trimmedText.length < 100) {
      return false;
    }

    // Check if text contains mostly meaningful words (not just special characters)
    const wordCount = trimmedText
      .split(/\s+/)
      .filter((word) => word.length > 2 && /[a-zA-Z]/.test(word)).length;

    return wordCount >= 20; // At least 20 meaningful words
  }

  /**
   * Sanitize extracted text content
   * @param {string} text - Text to sanitize
   * @returns {string} - Sanitized text
   */
  sanitizeText(text) {
    if (!text) return "";

    return (
      text
        // Remove excessive whitespace
        .replace(/\s+/g, " ")
        // Remove control characters except newlines and tabs
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        // Normalize newlines
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        // Remove excessive newlines (more than 2 consecutive)
        .replace(/\n{3,}/g, "\n\n")
        // Trim and ensure single space between words
        .trim()
    );
  }

  /**
   * Get text statistics
   * @param {string} text - Text to analyze
   * @returns {Object} - Text statistics
   */
  getTextStatistics(text) {
    if (!text) {
      return {
        characterCount: 0,
        wordCount: 0,
        paragraphCount: 0,
        averageWordsPerParagraph: 0,
      };
    }

    const characterCount = text.length;
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    const wordCount = words.length;
    const paragraphs = text
      .split(/\n\s*\n/)
      .filter((para) => para.trim().length > 0);
    const paragraphCount = paragraphs.length;
    const averageWordsPerParagraph =
      paragraphCount > 0 ? Math.round(wordCount / paragraphCount) : 0;

    return {
      characterCount,
      wordCount,
      paragraphCount,
      averageWordsPerParagraph,
    };
  }
}

module.exports = new TextExtractionServiceServerless();
