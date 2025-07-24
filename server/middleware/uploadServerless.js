const multer = require("multer");
const path = require("path");

// For serverless environments, use memory storage instead of disk storage
const storage = multer.memoryStorage();

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [".pdf", ".txt", ".docx"];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, TXT, and DOCX files are allowed."
      ),
      false
    );
  }
};

// Configure multer with limits and validation for serverless
const uploadServerless = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only one file at a time
  },
  fileFilter: fileFilter,
});

// Export the appropriate upload based on environment
const upload =
  process.env.NODE_ENV === "production"
    ? uploadServerless
    : require("./upload");

module.exports = upload;
