const fs = require("fs").promises;
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

class TextExtractionService {
  /**
   * Extract text from uploaded file based on file type
   * @param {string} filePath - Path to the uploaded file
   * @param {string} originalName - Original filename
   * @returns {Promise<string>} - Extracted text content
   */
  async extractText(filePath, originalName) {
    try {
      const fileExtension = path.extname(originalName).toLowerCase();

      switch (fileExtension) {
        case ".pdf":
          return await this.extractFromPDF(filePath);
        case ".txt":
          return await this.extractFromTXT(filePath);
        case ".docx":
          return await this.extractFromDOCX(filePath);
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }
    } catch (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF file
   * @param {string} filePath - Path to PDF file
   * @returns {Promise<string>} - Extracted text
   */
  async extractFromPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);

      if (!data.text || data.text.trim().length === 0) {
        throw new Error("No text content found in PDF file");
      }

      return data.text.trim();
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from TXT file
   * @param {string} filePath - Path to TXT file
   * @returns {Promise<string>} - Extracted text
   */
  async extractFromTXT(filePath) {
    try {
      const text = await fs.readFile(filePath, "utf8");

      if (!text || text.trim().length === 0) {
        throw new Error("No text content found in TXT file");
      }

      return text.trim();
    } catch (error) {
      throw new Error(`TXT extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from DOCX file
   * @param {string} filePath - Path to DOCX file
   * @returns {Promise<string>} - Extracted text
   */
  async extractFromDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });

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
   * @param {string} text - Extracted text
   * @returns {boolean} - Validation result
   */
  validateTextContent(text) {
    if (!text || typeof text !== "string") {
      return false;
    }

    const trimmedText = text.trim();

    // Check minimum length (at least 50 characters for meaningful content)
    if (trimmedText.length < 50) {
      return false;
    }

    // Check maximum length (100KB of text)
    if (trimmedText.length > 100000) {
      return false;
    }

    return true;
  }

  /**
   * Clean up uploaded file after processing
   * @param {string} filePath - Path to file to be deleted
   */
  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to cleanup file ${filePath}:`, error.message);
    }
  }

  /**
   * Sanitize text content for security
   * @param {string} text - Text to sanitize
   * @returns {string} - Sanitized text
   */
  sanitizeText(text) {
    if (!text) return "";

    // Remove potentially harmful characters and normalize whitespace
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }
}

module.exports = new TextExtractionService();
