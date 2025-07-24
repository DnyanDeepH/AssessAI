const { validationResult } = require("express-validator");
const Question = require("../models/Question");
const csv = require("csv-parser");
const { Readable } = require("stream");

/**
 * @desc    Get all questions with pagination, search, and filtering
 * @route   GET /api/admin/questions
 * @access  Private (Admin only)
 */
const getQuestions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      topic = "",
      difficulty = "",
      isActive = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query object
    const query = {};

    // Search functionality - search in question text and topic
    if (search) {
      query.$or = [
        { questionText: { $regex: search, $options: "i" } },
        { topic: { $regex: search, $options: "i" } },
      ];
    }

    // Topic filter
    if (topic) {
      query.topic = { $regex: topic, $options: "i" };
    }

    // Difficulty filter
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Active status filter
    if (isActive !== "") {
      query.isActive = isActive === "true";
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const [questions, totalQuestions] = await Promise.all([
      Question.find(query)
        .populate("createdBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Question.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalQuestions / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalQuestions,
          hasNextPage,
          hasPrevPage,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    console.error("Get questions error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "GET_QUESTIONS_ERROR",
        message: "Failed to retrieve questions.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Get question by ID
 * @route   GET /api/admin/questions/:id
 * @access  Private (Admin only)
 */
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        error: {
          code: "QUESTION_NOT_FOUND",
          message: "Question not found.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      data: {
        question,
      },
    });
  } catch (error) {
    console.error("Get question by ID error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "GET_QUESTION_ERROR",
        message: "Failed to retrieve question.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Create new question
 * @route   POST /api/admin/questions
 * @access  Private (Admin only)
 */
const createQuestion = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please provide valid question information.",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const {
      questionText,
      options,
      correctAnswer,
      topic,
      difficulty,
      explanation,
    } = req.body;

    // Create question
    const questionData = {
      questionText: questionText.trim(),
      options: options.map((option) => option.trim()),
      correctAnswer: correctAnswer.trim(),
      topic: topic.trim(),
      difficulty: difficulty || "medium",
      createdBy: req.user._id,
    };

    if (explanation) {
      questionData.explanation = explanation.trim();
    }

    const question = await Question.create(questionData);
    await question.populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Question created successfully.",
      data: {
        question,
      },
    });
  } catch (error) {
    console.error("Create question error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "CREATE_QUESTION_ERROR",
        message: "Failed to create question.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Update question
 * @route   PUT /api/admin/questions/:id
 * @access  Private (Admin only)
 */
const updateQuestion = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please provide valid question information.",
          details: errors.array(),
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { id } = req.params;
    const {
      questionText,
      options,
      correctAnswer,
      topic,
      difficulty,
      explanation,
      isActive,
    } = req.body;

    // Find question
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: {
          code: "QUESTION_NOT_FOUND",
          message: "Question not found.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Update fields
    if (questionText) question.questionText = questionText.trim();
    if (options) question.options = options.map((option) => option.trim());
    if (correctAnswer) question.correctAnswer = correctAnswer.trim();
    if (topic) question.topic = topic.trim();
    if (difficulty) question.difficulty = difficulty;
    if (explanation !== undefined)
      question.explanation = explanation ? explanation.trim() : "";
    if (isActive !== undefined) question.isActive = isActive;

    await question.save();
    await question.populate("createdBy", "name email");

    res.json({
      success: true,
      message: "Question updated successfully.",
      data: {
        question,
      },
    });
  } catch (error) {
    console.error("Update question error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "UPDATE_QUESTION_ERROR",
        message: "Failed to update question.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Delete question (soft delete)
 * @route   DELETE /api/admin/questions/:id
 * @access  Private (Admin only)
 */
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: {
          code: "QUESTION_NOT_FOUND",
          message: "Question not found.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Soft delete by setting isActive to false
    await question.softDelete();

    res.json({
      success: true,
      message: "Question deleted successfully.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Delete question error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "DELETE_QUESTION_ERROR",
        message: "Failed to delete question.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Bulk delete questions
 * @route   DELETE /api/admin/questions/bulk
 * @access  Private (Admin only)
 */
const bulkDeleteQuestions = async (req, res) => {
  try {
    const { questionIds } = req.body;

    if (
      !questionIds ||
      !Array.isArray(questionIds) ||
      questionIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUESTION_IDS",
          message: "Please provide an array of question IDs.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Soft delete by setting isActive to false
    const result = await Question.updateMany(
      { _id: { $in: questionIds } },
      { isActive: false }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} questions deleted successfully.`,
      data: {
        deletedCount: result.modifiedCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Bulk delete questions error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "BULK_DELETE_ERROR",
        message: "Failed to delete questions.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Import questions from CSV
 * @route   POST /api/admin/questions/import
 * @access  Private (Admin only)
 */
const importQuestionsFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_FILE_UPLOADED",
          message: "Please upload a CSV file.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    const csvData = req.file.buffer.toString();
    const questions = [];
    const errors = [];
    let lineNumber = 1;

    // Parse CSV data
    const stream = Readable.from([csvData]);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on("data", (row) => {
          lineNumber++;

          // Validate required fields
          if (
            !row.questionText ||
            !row.option1 ||
            !row.option2 ||
            !row.option3 ||
            !row.option4 ||
            !row.correctAnswer ||
            !row.topic
          ) {
            errors.push({
              line: lineNumber,
              error:
                "Missing required fields (questionText, option1-4, correctAnswer, topic)",
              data: row,
            });
            return;
          }

          // Validate difficulty
          const difficulty = row.difficulty || "medium";
          if (!["easy", "medium", "hard"].includes(difficulty)) {
            errors.push({
              line: lineNumber,
              error: "Invalid difficulty (must be 'easy', 'medium', or 'hard')",
              data: row,
            });
            return;
          }

          // Build options array
          const options = [
            row.option1,
            row.option2,
            row.option3,
            row.option4,
          ].map((opt) => opt.trim());

          // Validate correct answer
          if (!options.includes(row.correctAnswer.trim())) {
            errors.push({
              line: lineNumber,
              error: "Correct answer must be one of the provided options",
              data: row,
            });
            return;
          }

          // Build question object
          const questionData = {
            questionText: row.questionText.trim(),
            options: options,
            correctAnswer: row.correctAnswer.trim(),
            topic: row.topic.trim(),
            difficulty: difficulty,
            createdBy: req.user._id,
          };

          // Add optional explanation
          if (row.explanation) {
            questionData.explanation = row.explanation.trim();
          }

          questions.push(questionData);
        })
        .on("end", async () => {
          try {
            if (errors.length > 0) {
              return res.status(400).json({
                success: false,
                error: {
                  code: "CSV_VALIDATION_ERROR",
                  message: "CSV contains validation errors.",
                  details: errors,
                  timestamp: new Date().toISOString(),
                },
              });
            }

            if (questions.length === 0) {
              return res.status(400).json({
                success: false,
                error: {
                  code: "EMPTY_CSV",
                  message: "No valid questions found in CSV file.",
                  timestamp: new Date().toISOString(),
                },
              });
            }

            // Create questions in bulk
            const createdQuestions = await Question.insertMany(questions);

            res.status(201).json({
              success: true,
              message: `${createdQuestions.length} questions imported successfully.`,
              data: {
                importedCount: createdQuestions.length,
                questions: createdQuestions,
              },
              timestamp: new Date().toISOString(),
            });

            resolve();
          } catch (error) {
            console.error("CSV import error:", error);
            res.status(500).json({
              success: false,
              error: {
                code: "IMPORT_ERROR",
                message: "Failed to import questions from CSV.",
                details: error.message,
                timestamp: new Date().toISOString(),
              },
            });
            reject(error);
          }
        })
        .on("error", (error) => {
          console.error("CSV parsing error:", error);
          res.status(400).json({
            success: false,
            error: {
              code: "CSV_PARSE_ERROR",
              message: "Failed to parse CSV file.",
              details: error.message,
              timestamp: new Date().toISOString(),
            },
          });
          reject(error);
        });
    });
  } catch (error) {
    console.error("Import questions error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "IMPORT_QUESTIONS_ERROR",
        message: "Failed to import questions.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Bulk update questions
 * @route   PUT /api/admin/questions/bulk
 * @access  Private (Admin only)
 */
const bulkUpdateQuestions = async (req, res) => {
  try {
    const { questionIds, updates } = req.body;

    if (
      !questionIds ||
      !Array.isArray(questionIds) ||
      questionIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUESTION_IDS",
          message: "Please provide an array of question IDs.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!updates || typeof updates !== "object") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_UPDATES",
          message: "Please provide valid update data.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Build update object with only allowed fields
    const allowedUpdates = {};
    if (updates.topic !== undefined)
      allowedUpdates.topic = updates.topic.trim();
    if (updates.difficulty !== undefined)
      allowedUpdates.difficulty = updates.difficulty;
    if (updates.isActive !== undefined)
      allowedUpdates.isActive = updates.isActive;

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_VALID_UPDATES",
          message: "No valid update fields provided.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Perform bulk update
    const result = await Question.updateMany(
      { _id: { $in: questionIds } },
      { $set: allowedUpdates }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} questions updated successfully.`,
      data: {
        updatedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Bulk update questions error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "BULK_UPDATE_ERROR",
        message: "Failed to update questions.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Export questions to CSV
 * @route   GET /api/admin/questions/export
 * @access  Private (Admin only)
 */
const exportQuestionsToCSV = async (req, res) => {
  try {
    const { topic = "", difficulty = "", isActive = "" } = req.query;

    // Build query object
    const query = {};
    if (topic) query.topic = { $regex: topic, $options: "i" };
    if (difficulty) query.difficulty = difficulty;
    if (isActive !== "") query.isActive = isActive === "true";

    // Get questions
    const questions = await Question.find(query)
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NO_QUESTIONS_FOUND",
          message: "No questions found matching the criteria.",
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Convert to CSV format
    const csvHeader =
      "Question Text,Option 1,Option 2,Option 3,Option 4,Correct Answer,Topic,Difficulty,Explanation,Created By,Created At\n";
    const csvRows = questions
      .map((question) => {
        const createdBy = question.createdBy?.name || "";
        const createdAt = new Date(question.createdAt)
          .toISOString()
          .split("T")[0];
        const explanation = question.explanation || "";

        return `"${question.questionText}","${question.options[0]}","${question.options[1]}","${question.options[2]}","${question.options[3]}","${question.correctAnswer}","${question.topic}","${question.difficulty}","${explanation}","${createdBy}","${createdAt}"`;
      })
      .join("\n");

    const csvContent = csvHeader + csvRows;

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="questions_export_${
        new Date().toISOString().split("T")[0]
      }.csv"`
    );

    res.send(csvContent);
  } catch (error) {
    console.error("Export questions error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "EXPORT_QUESTIONS_ERROR",
        message: "Failed to export questions.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Get question statistics
 * @route   GET /api/admin/questions/stats
 * @access  Private (Admin only)
 */
const getQuestionStats = async (req, res) => {
  try {
    const [
      totalQuestions,
      activeQuestions,
      inactiveQuestions,
      easyQuestions,
      mediumQuestions,
      hardQuestions,
      topicStats,
    ] = await Promise.all([
      Question.countDocuments(),
      Question.countDocuments({ isActive: true }),
      Question.countDocuments({ isActive: false }),
      Question.countDocuments({ difficulty: "easy", isActive: true }),
      Question.countDocuments({ difficulty: "medium", isActive: true }),
      Question.countDocuments({ difficulty: "hard", isActive: true }),
      Question.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$topic", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Get questions created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentQuestionCount = await Question.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.json({
      success: true,
      data: {
        totalQuestions,
        activeQuestions,
        inactiveQuestions,
        difficultyStats: {
          easy: easyQuestions,
          medium: mediumQuestions,
          hard: hardQuestions,
        },
        topicStats,
        recentQuestionCount,
      },
    });
  } catch (error) {
    console.error("Get question stats error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "GET_STATS_ERROR",
        message: "Failed to retrieve question statistics.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkDeleteQuestions,
  bulkUpdateQuestions,
  importQuestionsFromCSV,
  exportQuestionsToCSV,
  getQuestionStats,
};
