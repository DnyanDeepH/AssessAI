const fs = require("fs").promises;
const path = require("path");

class FileValidationService {
  constructor() {
    // Define allowed MIME types for each file extension
    this.allowedMimeTypes = {
      ".pdf": ["application/pdf"],
      ".txt": ["text/plain"],
      ".docx": [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    };

    // Maximum file sizes (in bytes)
    this.maxFileSizes = {
      ".pdf": 10 * 1024 * 1024, // 10MB
      ".txt": 5 * 1024 * 1024, // 5MB
      ".docx": 10 * 1024 * 1024, // 10MB
    };

    // Suspicious file signatures (magic numbers) to detect
    this.suspiciousSignatures = [
      Buffer.from([0x4d, 0x5a]), // PE executable
      Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // ELF executable
      Buffer.from([0xca, 0xfe, 0xba, 0xbe]), // Java class file
      Buffer.from([0x50, 0x4b, 0x03, 0x04]), // ZIP (could be malicious if not expected)
    ];
  }

  /**
   * Validate uploaded file for security and format compliance
   * @param {Object} file - Multer file object
   * @returns {Promise<Object>} - Validation result
   */
  async validateFile(file) {
    const validationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Basic file validation
      await this.validateBasicProperties(file, validationResult);

      // File size validation
      await this.validateFileSize(file, validationResult);

      // MIME type validation
      await this.validateMimeType(file, validationResult);

      // File signature validation
      await this.validateFileSignature(file, validationResult);

      // Content security scan
      await this.performSecurityScan(file, validationResult);
    } catch (error) {
      validationResult.isValid = false;
      validationResult.errors.push(`Validation error: ${error.message}`);
    }

    return validationResult;
  }

  /**
   * Validate basic file properties
   * @param {Object} file - Multer file object
   * @param {Object} validationResult - Validation result object
   */
  async validateBasicProperties(file, validationResult) {
    // Check if file exists
    if (!file || !file.path) {
      validationResult.isValid = false;
      validationResult.errors.push("No file provided");
      return;
    }

    // Check if file exists on disk
    try {
      await fs.access(file.path);
    } catch (error) {
      validationResult.isValid = false;
      validationResult.errors.push("File not found on disk");
      return;
    }

    // Validate filename
    const filename = file.originalname;
    if (!filename || filename.length > 255) {
      validationResult.isValid = false;
      validationResult.errors.push("Invalid filename");
    }

    // Check for suspicious filename patterns
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|pif|com)$/i,
      /\.\./, // Directory traversal
      /[<>:"|?*]/, // Invalid filename characters
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(filename)) {
        validationResult.isValid = false;
        validationResult.errors.push("Suspicious filename detected");
        break;
      }
    }
  }

  /**
   * Validate file size
   * @param {Object} file - Multer file object
   * @param {Object} validationResult - Validation result object
   */
  async validateFileSize(file, validationResult) {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const maxSize = this.maxFileSizes[fileExtension];

    if (!maxSize) {
      validationResult.isValid = false;
      validationResult.errors.push("Unsupported file type");
      return;
    }

    if (file.size > maxSize) {
      validationResult.isValid = false;
      validationResult.errors.push(
        `File size exceeds limit of ${maxSize / (1024 * 1024)}MB`
      );
    }

    // Warn if file is very small (might be empty or corrupted)
    if (file.size < 100) {
      validationResult.warnings.push("File is very small and might be empty");
    }
  }

  /**
   * Validate MIME type
   * @param {Object} file - Multer file object
   * @param {Object} validationResult - Validation result object
   */
  async validateMimeType(file, validationResult) {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedMimes = this.allowedMimeTypes[fileExtension];

    if (!allowedMimes) {
      validationResult.isValid = false;
      validationResult.errors.push("Unsupported file extension");
      return;
    }

    if (!allowedMimes.includes(file.mimetype)) {
      validationResult.isValid = false;
      validationResult.errors.push(
        `Invalid MIME type. Expected: ${allowedMimes.join(", ")}, Got: ${
          file.mimetype
        }`
      );
    }
  }

  /**
   * Validate file signature (magic numbers)
   * @param {Object} file - Multer file object
   * @param {Object} validationResult - Validation result object
   */
  async validateFileSignature(file, validationResult) {
    try {
      const fileHandle = await fs.open(file.path, "r");
      const buffer = Buffer.alloc(8); // Read first 8 bytes
      await fileHandle.read(buffer, 0, 8, 0);
      await fileHandle.close();

      const fileExtension = path.extname(file.originalname).toLowerCase();

      // Check for expected signatures
      switch (fileExtension) {
        case ".pdf":
          if (!buffer.toString("ascii", 0, 4).startsWith("%PDF")) {
            validationResult.isValid = false;
            validationResult.errors.push("Invalid PDF file signature");
          }
          break;
        case ".docx":
          // DOCX files start with PK (ZIP signature)
          if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
            validationResult.isValid = false;
            validationResult.errors.push("Invalid DOCX file signature");
          }
          break;
        // TXT files don't have a specific signature
      }

      // Check for suspicious signatures
      for (const suspiciousSignature of this.suspiciousSignatures) {
        if (
          buffer
            .subarray(0, suspiciousSignature.length)
            .equals(suspiciousSignature)
        ) {
          validationResult.isValid = false;
          validationResult.errors.push("Suspicious file signature detected");
          break;
        }
      }
    } catch (error) {
      validationResult.warnings.push(
        `Could not validate file signature: ${error.message}`
      );
    }
  }

  /**
   * Perform basic security scan on file content
   * @param {Object} file - Multer file object
   * @param {Object} validationResult - Validation result object
   */
  async performSecurityScan(file, validationResult) {
    try {
      // Read a sample of the file content for scanning
      const fileHandle = await fs.open(file.path, "r");
      const sampleSize = Math.min(file.size, 1024 * 10); // Read up to 10KB
      const buffer = Buffer.alloc(sampleSize);
      await fileHandle.read(buffer, 0, sampleSize, 0);
      await fileHandle.close();

      // Check for suspicious patterns in content
      const suspiciousPatterns = [
        /javascript:/gi,
        /<script/gi,
        /eval\(/gi,
        /document\.write/gi,
        /window\.location/gi,
      ];

      const content = buffer.toString("utf8");
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
          validationResult.warnings.push(
            "Potentially suspicious content detected"
          );
          break;
        }
      }

      // Check for excessive binary content in text files
      const fileExtension = path.extname(file.originalname).toLowerCase();
      if (fileExtension === ".txt") {
        const binaryBytes = buffer.filter(
          (byte) => byte < 32 && byte !== 9 && byte !== 10 && byte !== 13
        ).length;
        const binaryRatio = binaryBytes / sampleSize;

        if (binaryRatio > 0.1) {
          validationResult.warnings.push(
            "High binary content ratio in text file"
          );
        }
      }
    } catch (error) {
      validationResult.warnings.push(
        `Security scan incomplete: ${error.message}`
      );
    }
  }

  /**
   * Get file information summary
   * @param {Object} file - Multer file object
   * @returns {Object} - File information
   */
  getFileInfo(file) {
    return {
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      extension: path.extname(file.originalname).toLowerCase(),
      uploadPath: file.path,
      uploadTime: new Date().toISOString(),
    };
  }
}

module.exports = new FileValidationService();
