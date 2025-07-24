const Exam = require("../models/Exam");
const Question = require("../models/Question");
const User = require("../models/User");
const Submission = require("../models/Submission");

/**
 * Create a new exam
 * @route POST /api/admin/exams
 * @access Private (Admin only)
 */
const createExam = async (req, res) => {
  try {
    const {
      title,
      description,
      durationInMinutes,
      questions,
      assignedTo,
      startTime,
      endTime,
      settings,
    } = req.body;

    // Validate required fields
    if (!title || !durationInMinutes || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Title, duration, start time, and end time are required",
        },
      });
    }

    // Validate time windows
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Start time must be before end time",
        },
      });
    }

    if (end <= now) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "End time must be in the future",
        },
      });
    }

    // Validate questions exist if provided
    if (questions && questions.length > 0) {
      const existingQuestions = await Question.find({
        _id: { $in: questions },
        isActive: true,
      });

      if (existingQuestions.length !== questions.length) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Some questions do not exist or are inactive",
          },
        });
      }
    }

    // Validate assigned users exist if provided
    if (assignedTo && assignedTo.length > 0) {
      const existingUsers = await User.find({
        _id: { $in: assignedTo },
        role: "student",
        isActive: true,
      });

      if (existingUsers.length !== assignedTo.length) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Some assigned users do not exist or are not active students",
          },
        });
      }
    }

    // Create exam
    const exam = new Exam({
      title,
      description,
      durationInMinutes,
      questions: questions || [],
      assignedTo: assignedTo || [],
      startTime: start,
      endTime: end,
      settings: {
        shuffleQuestions: settings?.shuffleQuestions || false,
        shuffleOptions: settings?.shuffleOptions || false,
        showResults: settings?.showResults || true,
        allowReview: settings?.allowReview || false,
        ...settings,
      },
      createdBy: req.user.id,
    });

    await exam.save();

    // Populate the exam with question and user details
    const populatedExam = await Exam.findById(exam._id)
      .populate("questions", "questionText topic difficulty")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      data: populatedExam,
      message: "Exam created successfully",
    });
  } catch (error) {
    console.error("Exam creation error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "EXAM_CREATION_ERROR",
        message: "Failed to create exam",
        details: error.message,
      },
    });
  }
};

/**
 * Get all exams with pagination and filtering
 * @route GET /api/admin/exams
 * @access Private (Admin only)
 */
const getExams = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter query
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      const now = new Date();
      switch (status) {
        case "upcoming":
          filter.startTime = { $gt: now };
          break;
        case "active":
          filter.startTime = { $lte: now };
          filter.endTime = { $gte: now };
          break;
        case "completed":
          filter.endTime = { $lt: now };
          break;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get exams with pagination
    const exams = await Exam.find(filter)
      .populate("questions", "questionText topic")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalExams = await Exam.countDocuments(filter);
    const totalPages = Math.ceil(totalExams / parseInt(limit));

    // Add status and submission count to each exam
    const examsWithStats = await Promise.all(
      exams.map(async (exam) => {
        const now = new Date();
        let status = "upcoming";
        if (exam.startTime <= now && exam.endTime >= now) {
          status = "active";
        } else if (exam.endTime < now) {
          status = "completed";
        }

        const submissionCount = await Submission.countDocuments({
          examId: exam._id,
          isCompleted: true,
        });

        return {
          ...exam.toObject(),
          status,
          submissionCount,
        };
      })
    );

    res.json({
      success: true,
      data: examsWithStats, // Return exams directly for backward compatibility
      exams: examsWithStats, // Also include under exams for new clients
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalExams,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get exams error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "EXAMS_FETCH_ERROR",
        message: "Failed to fetch exams",
        details: error.message,
      },
    });
  }
};

/**
 * Get exam by ID
 * @route GET /api/admin/exams/:id
 * @access Private (Admin only)
 */
const getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findOne({ _id: id, isActive: true })
      .populate("questions")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: {
          code: "EXAM_NOT_FOUND",
          message: "Exam not found",
        },
      });
    }

    // Get submission statistics
    const submissionStats = await Submission.aggregate([
      { $match: { examId: exam._id, isCompleted: true } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          averageScore: { $avg: "$percentage" },
          highestScore: { $max: "$percentage" },
          lowestScore: { $min: "$percentage" },
        },
      },
    ]);

    const stats = submissionStats[0] || {
      totalSubmissions: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
    };

    res.json({
      success: true,
      data: {
        ...exam.toObject(),
        statistics: stats,
      },
    });
  } catch (error) {
    console.error("Get exam by ID error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "EXAM_FETCH_ERROR",
        message: "Failed to fetch exam",
        details: error.message,
      },
    });
  }
};

/**
 * Update exam
 * @route PUT /api/admin/exams/:id
 * @access Private (Admin only)
 */
const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find existing exam
    const existingExam = await Exam.findOne({ _id: id, isActive: true });
    if (!existingExam) {
      return res.status(404).json({
        success: false,
        error: {
          code: "EXAM_NOT_FOUND",
          message: "Exam not found",
        },
      });
    }

    // Check if exam has already started and has submissions
    const now = new Date();
    const hasSubmissions = await Submission.exists({
      examId: id,
      isCompleted: true,
    });

    if (existingExam.startTime <= now && hasSubmissions) {
      // Restrict updates for started exams with submissions
      const allowedUpdates = ["endTime", "settings"];
      const updateKeys = Object.keys(updateData);
      const hasRestrictedUpdates = updateKeys.some(
        (key) => !allowedUpdates.includes(key)
      );

      if (hasRestrictedUpdates) {
        return res.status(400).json({
          success: false,
          error: {
            code: "EXAM_UPDATE_RESTRICTED",
            message:
              "Cannot modify exam content after it has started and has submissions",
          },
        });
      }
    }

    // Validate time windows if provided
    if (updateData.startTime || updateData.endTime) {
      const startTime = new Date(
        updateData.startTime || existingExam.startTime
      );
      const endTime = new Date(updateData.endTime || existingExam.endTime);

      if (startTime >= endTime) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Start time must be before end time",
          },
        });
      }
    }

    // Validate questions if provided
    if (updateData.questions) {
      const existingQuestions = await Question.find({
        _id: { $in: updateData.questions },
        isActive: true,
      });

      if (existingQuestions.length !== updateData.questions.length) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Some questions do not exist or are inactive",
          },
        });
      }
    }

    // Validate assigned users if provided
    if (updateData.assignedTo) {
      const existingUsers = await User.find({
        _id: { $in: updateData.assignedTo },
        role: "student",
        isActive: true,
      });

      if (existingUsers.length !== updateData.assignedTo.length) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Some assigned users do not exist or are not active students",
          },
        });
      }
    }

    // Update exam
    const updatedExam = await Exam.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate("questions", "questionText topic difficulty")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    res.json({
      success: true,
      data: updatedExam,
      message: "Exam updated successfully",
    });
  } catch (error) {
    console.error("Exam update error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "EXAM_UPDATE_ERROR",
        message: "Failed to update exam",
        details: error.message,
      },
    });
  }
};

/**
 * Delete exam (soft delete)
 * @route DELETE /api/admin/exams/:id
 * @access Private (Admin only)
 */
const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findOne({ _id: id, isActive: true });
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: {
          code: "EXAM_NOT_FOUND",
          message: "Exam not found",
        },
      });
    }

    // Check if exam has submissions
    const hasSubmissions = await Submission.exists({
      examId: id,
      isCompleted: true,
    });

    if (hasSubmissions) {
      return res.status(400).json({
        success: false,
        error: {
          code: "EXAM_DELETE_RESTRICTED",
          message: "Cannot delete exam with existing submissions",
        },
      });
    }

    // Soft delete
    await Exam.findByIdAndUpdate(id, {
      isActive: false,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    console.error("Exam deletion error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "EXAM_DELETE_ERROR",
        message: "Failed to delete exam",
        details: error.message,
      },
    });
  }
};

/**
 * Assign exam to students
 * @route POST /api/admin/exams/:id/assign
 * @access Private (Admin only)
 */
const assignExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds, assignToAll = false } = req.body;

    const exam = await Exam.findOne({ _id: id, isActive: true });
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: {
          code: "EXAM_NOT_FOUND",
          message: "Exam not found",
        },
      });
    }

    let assignedStudents = [];

    if (assignToAll) {
      // Assign to all active students
      const allStudents = await User.find({
        role: "student",
        isActive: true,
      }).select("_id");
      assignedStudents = allStudents.map((student) => student._id);
    } else if (studentIds && studentIds.length > 0) {
      // Validate provided student IDs
      const existingStudents = await User.find({
        _id: { $in: studentIds },
        role: "student",
        isActive: true,
      });

      if (existingStudents.length !== studentIds.length) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Some student IDs are invalid or inactive",
          },
        });
      }
      assignedStudents = studentIds;
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Either provide student IDs or set assignToAll to true",
        },
      });
    }

    // Update exam with assigned students (merge with existing)
    const updatedAssignedTo = [
      ...new Set([
        ...exam.assignedTo.map((id) => id.toString()),
        ...assignedStudents.map((id) => id.toString()),
      ]),
    ];

    const updatedExam = await Exam.findByIdAndUpdate(
      id,
      { assignedTo: updatedAssignedTo, updatedAt: new Date() },
      { new: true }
    )
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    res.json({
      success: true,
      data: updatedExam,
      message: `Exam assigned to ${assignedStudents.length} students`,
    });
  } catch (error) {
    console.error("Exam assignment error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "EXAM_ASSIGNMENT_ERROR",
        message: "Failed to assign exam",
        details: error.message,
      },
    });
  }
};

module.exports = {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  assignExam,
};
