const User = require("../models/User");
const Exam = require("../models/Exam");
const Submission = require("../models/Submission");

/**
 * Get student dashboard data
 * @route GET /api/student/dashboard
 * @access Private (Student only)
 */
const getDashboardData = async (req, res) => {
  try {
    const studentId = req.user.id;
    const now = new Date();

    // Get upcoming exams count
    const upcomingExamsCount = await Exam.countDocuments({
      assignedTo: studentId,
      startTime: { $lte: now },
      endTime: { $gte: now },
      isActive: true,
    });

    // Get last exam score
    const lastSubmission = await Submission.findOne({
      studentId,
      isCompleted: true,
    })
      .sort({ submittedAt: -1 })
      .populate("examId", "title");

    // Get total completed exams
    const totalCompletedExams = await Submission.countDocuments({
      studentId,
      isCompleted: true,
    });

    // Calculate average score from all submissions
    const submissions = await Submission.find({
      studentId,
      isCompleted: true,
    }).select("percentage");

    const averageScore =
      submissions.length > 0
        ? Math.round(
            submissions.reduce((sum, sub) => sum + sub.percentage, 0) /
              submissions.length
          )
        : 0;

    // Get recent exam results (last 5)
    const recentResults = await Submission.find({
      studentId,
      isCompleted: true,
    })
      .sort({ submittedAt: -1 })
      .limit(5)
      .populate("examId", "title")
      .select("percentage submittedAt examId");

    const dashboardData = {
      upcomingExamsCount,
      lastExamScore: lastSubmission
        ? {
            score: lastSubmission.percentage,
            examTitle: lastSubmission.examId.title,
            submittedAt: lastSubmission.submittedAt,
          }
        : null,
      totalCompletedExams,
      averageScore,
      recentResults: recentResults.map((result) => ({
        examTitle: result.examId.title,
        score: result.percentage,
        submittedAt: result.submittedAt,
      })),
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "DASHBOARD_FETCH_ERROR",
        message: "Failed to fetch dashboard data",
        details: error.message,
      },
    });
  }
};

/**
 * Get all exams assigned to student
 * @route GET /api/student/exams
 * @access Private (Student only)
 */
const getExams = async (req, res) => {
  try {
    const studentId = req.user.id;

    const exams = await Exam.find({
      assignedTo: studentId,
      isActive: true,
    })
      .populate("questions", "questionText topic difficulty")
      .select(
        "title description durationInMinutes startTime endTime questions settings"
      )
      .sort({ startTime: 1 });

    // Check if student has already submitted each exam
    const examsWithStatus = await Promise.all(
      exams.map(async (exam) => {
        const existingSubmission = await Submission.findOne({
          examId: exam._id,
          studentId,
          isCompleted: true,
        });

        return {
          ...exam.toObject(),
          hasSubmitted: !!existingSubmission,
          questionCount: exam.questions.length,
          status: exam.getStatus(),
        };
      })
    );

    res.json({
      success: true,
      data: {
        exams: examsWithStatus,
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
 * Get upcoming exams for student
 * @route GET /api/student/exams/upcoming
 * @access Private (Student only)
 */
const getUpcomingExams = async (req, res) => {
  try {
    const studentId = req.user.id;
    const now = new Date();

    const upcomingExams = await Exam.find({
      assignedTo: studentId,
      startTime: { $lte: now },
      endTime: { $gte: now },
      isActive: true,
    })
      .populate("questions", "questionText topic difficulty")
      .select(
        "title description durationInMinutes startTime endTime questions settings"
      )
      .sort({ startTime: 1 });

    // Check if student has already submitted each exam
    const examsWithStatus = await Promise.all(
      upcomingExams.map(async (exam) => {
        const existingSubmission = await Submission.findOne({
          examId: exam._id,
          studentId,
          isCompleted: true,
        });

        return {
          ...exam.toObject(),
          hasSubmitted: !!existingSubmission,
          questionCount: exam.questions.length,
          status: exam.getStatus(),
        };
      })
    );

    res.json({
      success: true,
      data: examsWithStatus,
    });
  } catch (error) {
    console.error("Get upcoming exams error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "UPCOMING_EXAMS_FETCH_ERROR",
        message: "Failed to fetch upcoming exams",
        details: error.message,
      },
    });
  }
};

/**
 * Start an exam session
 * @route POST /api/student/exams/:id/start
 * @access Private (Student only)
 */
const startExam = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const studentId = req.user.id;
    const now = new Date();
    const clientIp =
      req.headers["x-forwarded-for"] || req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    // Security check for suspicious user agents
    if (req.browserInfo && req.browserInfo.isSuspicious) {
      return res.status(403).json({
        success: false,
        error: {
          code: "SECURITY_VIOLATION",
          message: "Access denied due to security policy violation",
          details: ["Suspicious browser detected"],
        },
      });
    }

    // Find the exam and validate
    const exam = await Exam.findOne({
      _id: examId,
      assignedTo: studentId,
      isActive: true,
    }).populate("questions", "questionText options topic difficulty");

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: {
          code: "EXAM_NOT_FOUND",
          message: "Exam not found or not assigned to you",
        },
      });
    }

    // Enhanced time window validation
    if (!exam.isCurrentlyActive()) {
      const status = exam.getStatus();
      let message = "Exam is not currently available";
      let errorCode = "EXAM_TIME_WINDOW_ERROR";
      let remainingTime = null;

      if (status === "upcoming") {
        const timeToStart = Math.ceil((exam.startTime - now) / (1000 * 60)); // minutes
        message = `Exam starts at ${exam.startTime.toLocaleString()} (in ${timeToStart} minutes)`;
        errorCode = "EXAM_NOT_STARTED";
        remainingTime = timeToStart;
      } else if (status === "ended") {
        message = `Exam ended at ${exam.endTime.toLocaleString()}`;
        errorCode = "EXAM_ENDED";
      }

      return res.status(403).json({
        success: false,
        error: {
          code: errorCode,
          message,
          details: {
            status,
            startTime: exam.startTime,
            endTime: exam.endTime,
            remainingTime,
          },
        },
      });
    }

    // Check if student has already completed this exam
    const existingSubmission = await Submission.findOne({
      examId,
      studentId,
      isCompleted: true,
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        error: {
          code: "EXAM_ALREADY_SUBMITTED",
          message: "You have already submitted this exam",
        },
      });
    }

    // Check for existing active session
    let activeSubmission = await Submission.findOne({
      examId,
      studentId,
      isCompleted: false,
    });

    if (activeSubmission) {
      // Check if session is from a different device/location
      const isNewDevice = activeSubmission.userAgent !== userAgent;
      const isNewLocation = activeSubmission.ipAddress !== clientIp;

      // Update session tracking information
      activeSubmission.lastActivity = now;
      if (isNewDevice || isNewLocation) {
        // Log the device/location change but allow continuation
        console.log(
          `Session device/location change detected for student ${studentId}, exam ${examId}`
        );
        activeSubmission.reviewNotes =
          (activeSubmission.reviewNotes || "") +
          `\nDevice/location change at ${now.toISOString()}. Previous: ${
            activeSubmission.ipAddress
          }/${activeSubmission.userAgent}`;
        activeSubmission.flaggedForReview = true;
      }

      await activeSubmission.save();

      // Resume existing session
      const timeElapsed = Math.floor(
        (now - activeSubmission.startedAt) / (1000 * 60)
      );
      const timeRemaining = Math.max(0, exam.durationInMinutes - timeElapsed);

      if (timeRemaining <= 0) {
        // Auto-submit if time has expired
        activeSubmission.isCompleted = true;
        activeSubmission.submittedAt = now;
        await activeSubmission.calculateScore();

        return res.status(400).json({
          success: false,
          error: {
            code: "EXAM_TIME_EXPIRED",
            message: "Exam time has expired and has been auto-submitted",
          },
        });
      }

      // Return existing session
      const questions = exam.settings.shuffleQuestions
        ? shuffleArray([...exam.questions])
        : exam.questions;

      const questionsForStudent = questions.map((q, index) => ({
        _id: q._id,
        questionText: q.questionText,
        options: exam.settings.shuffleOptions
          ? shuffleArray([...q.options])
          : q.options,
        topic: q.topic,
        difficulty: q.difficulty,
        questionNumber: index + 1,
      }));

      // Calculate progress
      const totalQuestions = questions.length;
      const answeredQuestions = activeSubmission.answers.size;
      const progress =
        totalQuestions > 0
          ? Math.round((answeredQuestions / totalQuestions) * 100)
          : 0;

      return res.json({
        success: true,
        data: {
          sessionId: activeSubmission._id,
          exam: {
            _id: exam._id,
            title: exam.title,
            description: exam.description,
            durationInMinutes: exam.durationInMinutes,
            settings: exam.settings,
          },
          questions: questionsForStudent,
          timeRemaining,
          timeElapsed,
          savedAnswers: Object.fromEntries(activeSubmission.answers),
          isResumed: true,
          progress,
          answeredQuestions,
          totalQuestions,
          startedAt: activeSubmission.startedAt,
          lastActivity: activeSubmission.lastActivity,
          deviceChanged: isNewDevice,
          locationChanged: isNewLocation,
        },
        message: "Exam session resumed",
      });
    }

    // Check if student has reached maximum attempts
    const attemptCount = await Submission.countDocuments({
      examId,
      studentId,
    });

    if (attemptCount >= exam.settings.maxAttempts) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MAX_ATTEMPTS_REACHED",
          message: `Maximum attempts (${exam.settings.maxAttempts}) reached for this exam`,
        },
      });
    }

    // Create new submission/session
    activeSubmission = new Submission({
      examId,
      studentId,
      startedAt: now,
      lastActivity: now,
      ipAddress: clientIp,
      userAgent: userAgent,
      attemptNumber: attemptCount + 1,
      sessionEvents: [
        {
          eventType: "start",
          timestamp: now,
          details: {
            ipAddress: clientIp,
            userAgent: userAgent,
            attemptNumber: attemptCount + 1,
          },
        },
      ],
    });

    await activeSubmission.save();

    // Prepare questions for student (shuffle if enabled)
    const questions = exam.settings.shuffleQuestions
      ? shuffleArray([...exam.questions])
      : exam.questions;

    const questionsForStudent = questions.map((q, index) => ({
      _id: q._id,
      questionText: q.questionText,
      options: exam.settings.shuffleOptions
        ? shuffleArray([...q.options])
        : q.options,
      topic: q.topic,
      difficulty: q.difficulty,
      questionNumber: index + 1,
    }));

    res.json({
      success: true,
      data: {
        sessionId: activeSubmission._id,
        exam: {
          _id: exam._id,
          title: exam.title,
          description: exam.description,
          durationInMinutes: exam.durationInMinutes,
          settings: exam.settings,
        },
        questions: questionsForStudent,
        timeRemaining: exam.durationInMinutes,
        timeElapsed: 0,
        savedAnswers: {},
        isResumed: false,
        progress: 0,
        answeredQuestions: 0,
        totalQuestions: questions.length,
        startedAt: activeSubmission.startedAt,
        lastActivity: activeSubmission.lastActivity,
      },
      message: "Exam session started successfully",
    });
  } catch (error) {
    console.error("Start exam error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "EXAM_START_ERROR",
        message: "Failed to start exam",
        details: error.message,
      },
    });
  }
};

/**
 * Save answer during exam (auto-save functionality)
 * @route PUT /api/student/exams/:id/save-answer
 * @access Private (Student only)
 */
const saveAnswer = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const {
      questionId,
      answer,
      autoSave = false,
      batchAnswers = null,
    } = req.body;
    const studentId = req.user.id;
    const clientIp =
      req.headers["x-forwarded-for"] || req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    // Support both single answer and batch answers
    if (!batchAnswers && (!questionId || answer === undefined)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Question ID and answer are required for single answer save",
        },
      });
    }

    // Find active submission
    const submission = await Submission.findOne({
      examId,
      studentId,
      isCompleted: false,
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ACTIVE_SESSION_NOT_FOUND",
          message: "No active exam session found",
        },
      });
    }

    // Validate exam is still active
    const exam = await Exam.findById(examId);
    if (!exam || !exam.isCurrentlyActive()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "EXAM_NOT_ACTIVE",
          message: "Exam is no longer active",
        },
      });
    }

    // Check time limit
    const now = new Date();
    const timeElapsed = Math.floor((now - submission.startedAt) / (1000 * 60));

    if (timeElapsed >= exam.durationInMinutes) {
      // Auto-submit if time expired
      submission.isCompleted = true;
      submission.submittedAt = now;
      await submission.calculateScore();

      return res.status(400).json({
        success: false,
        error: {
          code: "EXAM_TIME_EXPIRED",
          message: "Exam time has expired and has been auto-submitted",
        },
      });
    }

    // Check if session is from a different device/location
    const isNewDevice = submission.userAgent !== userAgent;
    const isNewLocation = submission.ipAddress !== clientIp;

    if (isNewDevice || isNewLocation) {
      // Log the device/location change but allow continuation
      console.log(
        `Session device/location change detected for student ${studentId}, exam ${examId}`
      );
      submission.reviewNotes =
        (submission.reviewNotes || "") +
        `\nDevice/location change at ${now.toISOString()}. Previous: ${
          submission.ipAddress
        }/${submission.userAgent}`;
      submission.flaggedForReview = true;

      // Update tracking info
      submission.ipAddress = clientIp;
      submission.userAgent = userAgent;
    }

    // Save the answers (either single or batch)
    if (batchAnswers && typeof batchAnswers === "object") {
      // Process batch answers
      Object.entries(batchAnswers).forEach(([qId, ans]) => {
        submission.answers.set(qId.toString(), ans.toString());
      });
    } else {
      // Save single answer
      submission.answers.set(questionId.toString(), answer.toString());
    }

    // Add session event for answer save
    submission.sessionEvents.push({
      eventType: "save",
      timestamp: now,
      details: {
        autoSave: autoSave,
        questionCount: batchAnswers ? Object.keys(batchAnswers).length : 1,
        ipAddress: clientIp,
        userAgent: userAgent,
        deviceChanged: isNewDevice,
        locationChanged: isNewLocation,
      },
    });

    // Update last activity timestamp for session tracking
    submission.lastActivity = now;
    await submission.save();

    const timeRemaining = Math.max(0, exam.durationInMinutes - timeElapsed);

    // Calculate progress
    const totalQuestions = exam.questions ? exam.questions.length : 0;
    const answeredQuestions = submission.answers.size;
    const progress =
      totalQuestions > 0
        ? Math.round((answeredQuestions / totalQuestions) * 100)
        : 0;

    res.json({
      success: true,
      data: {
        timeRemaining,
        timeElapsed,
        savedAnswers: Object.fromEntries(submission.answers),
        progress,
        answeredQuestions,
        totalQuestions,
        lastSaved: now,
        deviceChanged: isNewDevice,
        locationChanged: isNewLocation,
      },
      message: autoSave ? "Answer auto-saved" : "Answer saved successfully",
    });
  } catch (error) {
    console.error("Save answer error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "SAVE_ANSWER_ERROR",
        message: "Failed to save answer",
        details: error.message,
      },
    });
  }
};

/**
 * Submit exam
 * @route POST /api/student/exams/:id/submit
 * @access Private (Student only)
 */
const submitExam = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const { forceSubmit = false } = req.body; // Optional parameter for admin-forced submission
    const studentId = req.user.id;
    const now = new Date();
    const clientIp =
      req.headers["x-forwarded-for"] || req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    // Find active submission
    const submission = await Submission.findOne({
      examId,
      studentId,
      isCompleted: false,
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ACTIVE_SESSION_NOT_FOUND",
          message: "No active exam session found",
        },
      });
    }

    // Get exam details
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: {
          code: "EXAM_NOT_FOUND",
          message: "Exam not found",
        },
      });
    }

    // Check if session is from a different device/location
    const isNewDevice = submission.userAgent !== userAgent;
    const isNewLocation = submission.ipAddress !== clientIp;

    if (isNewDevice || isNewLocation) {
      // Log the device/location change but allow submission
      console.log(
        `Session device/location change detected during submission for student ${studentId}, exam ${examId}`
      );
      submission.reviewNotes =
        (submission.reviewNotes || "") +
        `\nDevice/location change at submission time ${now.toISOString()}. Previous: ${
          submission.ipAddress
        }/${submission.userAgent}`;
      submission.flaggedForReview = true;
    }

    // Validate time constraints
    const timeElapsed = Math.floor((now - submission.startedAt) / (1000 * 60));
    const isTimeExpired = timeElapsed > exam.durationInMinutes;
    const isWithinGracePeriod = timeElapsed <= exam.durationInMinutes + 5; // 5 minute grace period

    // Check if submission is too late (beyond grace period)
    if (isTimeExpired && !isWithinGracePeriod && !forceSubmit) {
      return res.status(400).json({
        success: false,
        error: {
          code: "SUBMISSION_TOO_LATE",
          message: "Submission window has closed (beyond grace period)",
        },
      });
    }

    // Validate exam window (must be within exam end time)
    if (now > exam.endTime && !forceSubmit) {
      return res.status(400).json({
        success: false,
        error: {
          code: "EXAM_WINDOW_CLOSED",
          message: "Exam submission window has closed",
        },
      });
    }

    // Flag submission for review if time expired but within grace period
    if (isTimeExpired && isWithinGracePeriod) {
      submission.flaggedForReview = true;
      submission.reviewNotes =
        (submission.reviewNotes || "") +
        `\nSubmitted after time expired but within grace period. Time elapsed: ${timeElapsed} minutes.`;
    }

    // Add session event for submission
    submission.sessionEvents.push({
      eventType: "submit",
      timestamp: now,
      details: {
        ipAddress: clientIp,
        userAgent: userAgent,
        deviceChanged: isNewDevice,
        locationChanged: isNewLocation,
        isLateSubmission: isTimeExpired,
        isWithinGracePeriod: isTimeExpired && isWithinGracePeriod,
        forceSubmit: forceSubmit,
      },
    });

    // Submit the exam
    submission.isCompleted = true;
    submission.submittedAt = now;
    submission.ipAddress = clientIp;
    submission.userAgent = userAgent;
    await submission.calculateScore();

    // Get detailed results if allowed
    let results = null;
    if (exam.settings.showResults) {
      results = await submission.getDetailedResults();
    }

    // Calculate unanswered questions
    const totalQuestions = exam.questions ? exam.questions.length : 0;
    const answeredQuestions = submission.answers.size;
    const unansweredQuestions = totalQuestions - answeredQuestions;

    res.json({
      success: true,
      data: {
        submissionId: submission._id,
        score: submission.score,
        percentage: submission.percentage,
        timeSpent: submission.timeSpent,
        submittedAt: submission.submittedAt,
        answeredQuestions,
        unansweredQuestions,
        totalQuestions,
        isLateSubmission: isTimeExpired,
        results: exam.settings.showResults ? results : null,
      },
      message: isTimeExpired
        ? "Exam submitted after time expired (within grace period)"
        : "Exam submitted successfully",
    });
  } catch (error) {
    console.error("Submit exam error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "EXAM_SUBMIT_ERROR",
        message: "Failed to submit exam",
        details: error.message,
      },
    });
  }
};

/**
 * Get exam session status
 * @route GET /api/student/exams/:id/status
 * @access Private (Student only)
 */
const getExamStatus = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const studentId = req.user.id;
    const now = new Date();

    // Find exam
    const exam = await Exam.findOne({
      _id: examId,
      assignedTo: studentId,
      isActive: true,
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: {
          code: "EXAM_NOT_FOUND",
          message: "Exam not found or not assigned to you",
        },
      });
    }

    // Check for existing submission
    const submission = await Submission.findOne({
      examId,
      studentId,
    }).sort({ createdAt: -1 });

    let status = {
      examStatus: exam.getStatus(),
      hasActiveSession: false,
      hasSubmitted: false,
      timeRemaining: 0,
      canStart: false,
      canResume: false,
      progress: 0,
      answeredQuestions: 0,
      totalQuestions: exam.questions ? exam.questions.length : 0,
    };

    if (submission) {
      if (submission.isCompleted) {
        status.hasSubmitted = true;
        status.submissionId = submission._id;
        status.score = submission.percentage;
        status.submittedAt = submission.submittedAt;
      } else {
        // Active session exists
        status.hasActiveSession = true;
        status.sessionId = submission._id;
        const timeElapsed = Math.floor(
          (now - submission.startedAt) / (1000 * 60)
        );
        status.timeRemaining = Math.max(
          0,
          exam.durationInMinutes - timeElapsed
        );
        status.answeredQuestions = submission.answers.size;
        status.progress =
          status.totalQuestions > 0
            ? Math.round(
                (status.answeredQuestions / status.totalQuestions) * 100
              )
            : 0;
        status.startedAt = submission.startedAt;
        status.lastActivity = submission.lastActivity || submission.startedAt;

        if (status.timeRemaining > 0 && exam.isCurrentlyActive()) {
          status.canResume = true;
        } else if (status.timeRemaining <= 0) {
          // Auto-submit expired session
          submission.isCompleted = true;
          submission.submittedAt = now;
          await submission.calculateScore();

          status.hasActiveSession = false;
          status.hasSubmitted = true;
          status.submissionId = submission._id;
          status.score = submission.percentage;
          status.submittedAt = submission.submittedAt;
          status.autoSubmitted = true;
        }
      }
    }

    // Can start if exam is active, no submission exists, and not already started
    if (exam.isCurrentlyActive() && !submission) {
      status.canStart = true;
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Get exam status error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "EXAM_STATUS_ERROR",
        message: "Failed to get exam status",
        details: error.message,
      },
    });
  }
};

/**
 * Get current exam session details
 * @route GET /api/student/exams/:id/session
 * @access Private (Student only)
 */
const getExamSession = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const studentId = req.user.id;
    const now = new Date();
    const clientIp =
      req.headers["x-forwarded-for"] || req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    // Find active submission
    const submission = await Submission.findOne({
      examId,
      studentId,
      isCompleted: false,
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ACTIVE_SESSION_NOT_FOUND",
          message: "No active exam session found",
        },
      });
    }

    // Get exam details
    const exam = await Exam.findById(examId).populate(
      "questions",
      "questionText options topic difficulty"
    );

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: {
          code: "EXAM_NOT_FOUND",
          message: "Exam not found",
        },
      });
    }

    // Check if exam is still active
    if (!exam.isCurrentlyActive()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "EXAM_NOT_ACTIVE",
          message: "Exam is no longer active",
          details: {
            status: exam.getStatus(),
            endTime: exam.endTime,
          },
        },
      });
    }

    // Check if session is from a different device/location
    const isNewDevice = submission.userAgent !== userAgent;
    const isNewLocation = submission.ipAddress !== clientIp;

    if (isNewDevice || isNewLocation) {
      // Log the device/location change but allow continuation
      console.log(
        `Session device/location change detected for student ${studentId}, exam ${examId}`
      );
      submission.reviewNotes =
        (submission.reviewNotes || "") +
        `\nDevice/location change at ${now.toISOString()}. Previous: ${
          submission.ipAddress
        }/${submission.userAgent}`;
      submission.flaggedForReview = true;

      // Update tracking info
      submission.ipAddress = clientIp;
      submission.userAgent = userAgent;

      // Add event to session events
      submission.sessionEvents.push({
        eventType: isNewDevice ? "device_change" : "location_change",
        timestamp: now,
        details: {
          previousIp: submission.ipAddress,
          previousUserAgent: submission.userAgent,
          currentIp: clientIp,
          currentUserAgent: userAgent,
        },
      });
    }

    // Check time limit
    const timeElapsed = Math.floor((now - submission.startedAt) / (1000 * 60));
    const timeRemaining = Math.max(0, exam.durationInMinutes - timeElapsed);

    if (timeRemaining <= 0) {
      // Auto-submit if time expired
      submission.isCompleted = true;
      submission.submittedAt = now;

      // Add auto-submit event
      submission.sessionEvents.push({
        eventType: "auto_submit",
        timestamp: now,
        details: {
          reason: "Time expired",
          timeElapsed,
        },
      });

      await submission.calculateScore();

      return res.status(400).json({
        success: false,
        error: {
          code: "EXAM_TIME_EXPIRED",
          message: "Exam time has expired and has been auto-submitted",
        },
      });
    }

    // Update last activity timestamp
    submission.lastActivity = now;
    await submission.save();

    // Prepare questions for student (maintain original order from session start)
    const questions = exam.questions.map((q, index) => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      topic: q.topic,
      difficulty: q.difficulty,
      questionNumber: index + 1,
    }));

    // Calculate progress
    const totalQuestions = questions.length;
    const answeredQuestions = submission.answers.size;
    const progress =
      totalQuestions > 0
        ? Math.round((answeredQuestions / totalQuestions) * 100)
        : 0;

    res.json({
      success: true,
      data: {
        sessionId: submission._id,
        exam: {
          _id: exam._id,
          title: exam.title,
          description: exam.description,
          durationInMinutes: exam.durationInMinutes,
          settings: exam.settings,
        },
        questions,
        timeRemaining,
        timeElapsed,
        savedAnswers: Object.fromEntries(submission.answers),
        progress,
        answeredQuestions,
        totalQuestions,
        startedAt: submission.startedAt,
        lastActivity: submission.lastActivity,
        deviceChanged: isNewDevice,
        locationChanged: isNewLocation,
      },
    });
  } catch (error) {
    console.error("Get exam session error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "EXAM_SESSION_ERROR",
        message: "Failed to get exam session",
        details: error.message,
      },
    });
  }
};

// Utility function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = {
  getDashboardData,
  getExams,
  getUpcomingExams,
  startExam,
  saveAnswer,
  submitExam,
  getExamStatus,
  getExamSession,
};
