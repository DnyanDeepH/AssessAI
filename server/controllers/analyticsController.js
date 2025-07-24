const Submission = require("../models/Submission");
const Exam = require("../models/Exam");
const Question = require("../models/Question");
const User = require("../models/User");
const ResultsService = require("../services/resultsService");

/**
 * @desc    Get detailed exam results and analytics
 * @route   GET /api/admin/exams/:id/results
 * @access  Private (Admin only)
 */
const getExamResults = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = "submittedAt",
      sortOrder = "desc",
    } = req.query;

    // Validate exam exists
    const exam = await Exam.findById(examId).populate(
      "questions",
      "questionText correctAnswer topic difficulty"
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

    // Get submissions with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const [submissions, totalSubmissions] = await Promise.all([
      Submission.find({ examId, isCompleted: true })
        .populate("studentId", "name email")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Submission.countDocuments({ examId, isCompleted: true }),
    ]);

    // Use ResultsService for comprehensive analytics
    const examStatistics = await ResultsService.calculateExamStatistics(examId);

    // Format submissions with detailed results
    const detailedSubmissions = submissions.map((submission) => ({
      _id: submission._id,
      student: submission.studentId,
      score: submission.score,
      percentage: submission.percentage,
      timeSpent: submission.timeSpent,
      submittedAt: submission.submittedAt,
      startedAt: submission.startedAt,
      flaggedForReview: submission.flaggedForReview,
      reviewNotes: submission.reviewNotes,
      attemptNumber: submission.attemptNumber,
      answers: submission.answers,
    }));

    res.json({
      success: true,
      data: {
        exam: {
          _id: exam._id,
          title: exam.title,
          description: exam.description,
          durationInMinutes: exam.durationInMinutes,
          totalQuestions: exam.questions.length,
        },
        submissions: detailedSubmissions,
        statistics: examStatistics.statistics,
        questionAnalysis: examStatistics.questionAnalysis,
        performanceDistribution: examStatistics.performanceDistribution,
        timeAnalysis: examStatistics.timeAnalysis,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalSubmissions / parseInt(limit)),
          totalSubmissions,
          hasNext: skip + submissions.length < totalSubmissions,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get exam results error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "EXAM_RESULTS_ERROR",
        message: "Failed to retrieve exam results",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Get individual student's detailed results for an exam
 * @route   GET /api/admin/exams/:examId/students/:studentId/results
 * @access  Private (Admin only)
 */
const getStudentExamResults = async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    // Find the submission
    const submission = await Submission.findOne({
      examId,
      studentId,
      isCompleted: true,
    }).populate([
      {
        path: "examId",
        select: "title questions settings",
        populate: {
          path: "questions",
          select:
            "questionText options correctAnswer explanation topic difficulty",
        },
      },
      {
        path: "studentId",
        select: "name email",
      },
    ]);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: {
          code: "SUBMISSION_NOT_FOUND",
          message: "Submission not found for this student and exam",
        },
      });
    }

    // Get detailed results
    const detailedResults = await submission.getDetailedResults();

    // Calculate additional analytics for this submission
    const submissionAnalytics = {
      timeEfficiency: calculateTimeEfficiency(submission),
      difficultyPerformance: calculateDifficultyPerformance(
        detailedResults.questionResults
      ),
      topicPerformance: calculateTopicPerformance(
        detailedResults.questionResults
      ),
      answerPattern: analyzeAnswerPattern(detailedResults.questionResults),
    };

    res.json({
      success: true,
      data: {
        submission: {
          _id: submission._id,
          score: submission.score,
          percentage: submission.percentage,
          timeSpent: submission.timeSpent,
          submittedAt: submission.submittedAt,
          startedAt: submission.startedAt,
          flaggedForReview: submission.flaggedForReview,
          reviewNotes: submission.reviewNotes,
          attemptNumber: submission.attemptNumber,
        },
        student: detailedResults.submission.studentId,
        exam: {
          _id: detailedResults.submission.examId._id,
          title: detailedResults.submission.examId.title,
          settings: detailedResults.submission.examId.settings,
        },
        questionResults: detailedResults.questionResults,
        analytics: submissionAnalytics,
      },
    });
  } catch (error) {
    console.error("Get student exam results error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "STUDENT_RESULTS_ERROR",
        message: "Failed to retrieve student exam results",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Get student's own results for an exam
 * @route   GET /api/student/exams/:id/results
 * @access  Private (Student only)
 */
const getStudentOwnResults = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const studentId = req.user.id;

    // Find the submission
    const submission = await Submission.findOne({
      examId,
      studentId,
      isCompleted: true,
    }).populate([
      {
        path: "examId",
        select: "title settings",
        populate: {
          path: "questions",
          select:
            "questionText options correctAnswer explanation topic difficulty",
        },
      },
    ]);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: {
          code: "SUBMISSION_NOT_FOUND",
          message: "No completed submission found for this exam",
        },
      });
    }

    // Check if results should be shown
    if (!submission.examId.settings.showResults) {
      return res.status(403).json({
        success: false,
        error: {
          code: "RESULTS_NOT_AVAILABLE",
          message: "Results are not available for this exam",
        },
      });
    }

    // Get detailed results
    const detailedResults = await submission.getDetailedResults();

    // Calculate student-specific analytics
    const studentAnalytics = {
      timeEfficiency: calculateTimeEfficiency(submission),
      difficultyPerformance: calculateDifficultyPerformance(
        detailedResults.questionResults
      ),
      topicPerformance: calculateTopicPerformance(
        detailedResults.questionResults
      ),
      strengths: identifyStrengths(detailedResults.questionResults),
      improvements: identifyImprovements(detailedResults.questionResults),
    };

    // Filter results based on exam settings
    let questionResults = detailedResults.questionResults;
    if (!submission.examId.settings.allowReview) {
      // Hide correct answers and explanations if review is not allowed
      questionResults = questionResults.map((result) => ({
        ...result,
        correctAnswer: undefined,
        explanation: undefined,
        isCorrect: result.isCorrect, // Keep this for analytics
      }));
    }

    res.json({
      success: true,
      data: {
        submission: {
          _id: submission._id,
          score: submission.score,
          percentage: submission.percentage,
          timeSpent: submission.timeSpent,
          submittedAt: submission.submittedAt,
          startedAt: submission.startedAt,
          attemptNumber: submission.attemptNumber,
        },
        exam: {
          _id: submission.examId._id,
          title: submission.examId.title,
          settings: submission.examId.settings,
        },
        questionResults,
        analytics: studentAnalytics,
        allowReview: submission.examId.settings.allowReview,
      },
    });
  } catch (error) {
    console.error("Get student own results error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "STUDENT_RESULTS_ERROR",
        message: "Failed to retrieve exam results",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Get all results for a student (admin view)
 * @route   GET /api/admin/students/:id/results
 * @access  Private (Admin only)
 */
const getStudentAllResults = async (req, res) => {
  try {
    const { id: studentId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = "submittedAt",
      sortOrder = "desc",
    } = req.query;

    // Validate student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: {
          code: "STUDENT_NOT_FOUND",
          message: "Student not found",
        },
      });
    }

    // Get submissions with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const [submissions, totalSubmissions] = await Promise.all([
      Submission.find({ studentId, isCompleted: true })
        .populate("examId", "title durationInMinutes")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Submission.countDocuments({ studentId, isCompleted: true }),
    ]);

    // Calculate student performance analytics using ResultsService
    const studentAnalytics = await ResultsService.getStudentPerformanceSummary(
      studentId
    );

    res.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
        },
        submissions: submissions.map((submission) => ({
          _id: submission._id,
          exam: submission.examId,
          score: submission.score,
          percentage: submission.percentage,
          timeSpent: submission.timeSpent,
          submittedAt: submission.submittedAt,
          attemptNumber: submission.attemptNumber,
          flaggedForReview: submission.flaggedForReview,
        })),
        analytics: studentAnalytics,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalSubmissions / parseInt(limit)),
          totalSubmissions,
          hasNext: skip + submissions.length < totalSubmissions,
          hasPrev: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get student all results error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "STUDENT_ALL_RESULTS_ERROR",
        message: "Failed to retrieve student results",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Get comprehensive platform analytics
 * @route   GET /api/admin/analytics/platform
 * @access  Private (Admin only)
 */
const getPlatformAnalytics = async (req, res) => {
  try {
    const { timeRange = "30d" } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get comprehensive analytics
    const [
      examPerformance,
      studentPerformance,
      questionDifficulty,
      timeAnalytics,
      topicAnalytics,
      trendsData,
    ] = await Promise.all([
      getExamPerformanceAnalytics(startDate),
      getStudentPerformanceAnalytics(startDate),
      getQuestionDifficultyAnalytics(),
      getTimeAnalytics(startDate),
      getTopicAnalytics(startDate),
      getTrendsAnalytics(startDate),
    ]);

    res.json({
      success: true,
      data: {
        timeRange,
        period: {
          startDate,
          endDate: now,
        },
        examPerformance,
        studentPerformance,
        questionDifficulty,
        timeAnalytics,
        topicAnalytics,
        trends: trendsData,
      },
    });
  } catch (error) {
    console.error("Get platform analytics error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "PLATFORM_ANALYTICS_ERROR",
        message: "Failed to retrieve platform analytics",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

// Helper functions for analytics calculations

async function calculateExamAnalytics(examId, questions) {
  const submissions = await Submission.find({ examId, isCompleted: true });

  if (submissions.length === 0) {
    return {
      totalSubmissions: 0,
      averageScore: 0,
      averagePercentage: 0,
      averageTimeSpent: 0,
      passRate: 0,
      completionRate: 0,
      scoreDistribution: [],
      timeDistribution: [],
    };
  }

  const totalScore = submissions.reduce((sum, sub) => sum + sub.score, 0);
  const totalPercentage = submissions.reduce(
    (sum, sub) => sum + sub.percentage,
    0
  );
  const totalTime = submissions.reduce((sum, sub) => sum + sub.timeSpent, 0);
  const passCount = submissions.filter((sub) => sub.percentage >= 60).length;

  // Score distribution
  const scoreRanges = [
    { range: "0-20", count: 0 },
    { range: "21-40", count: 0 },
    { range: "41-60", count: 0 },
    { range: "61-80", count: 0 },
    { range: "81-100", count: 0 },
  ];

  submissions.forEach((sub) => {
    if (sub.percentage <= 20) scoreRanges[0].count++;
    else if (sub.percentage <= 40) scoreRanges[1].count++;
    else if (sub.percentage <= 60) scoreRanges[2].count++;
    else if (sub.percentage <= 80) scoreRanges[3].count++;
    else scoreRanges[4].count++;
  });

  return {
    totalSubmissions: submissions.length,
    averageScore: Math.round((totalScore / submissions.length) * 100) / 100,
    averagePercentage:
      Math.round((totalPercentage / submissions.length) * 100) / 100,
    averageTimeSpent: Math.round((totalTime / submissions.length) * 100) / 100,
    passRate: Math.round((passCount / submissions.length) * 100 * 100) / 100,
    highestScore: Math.max(...submissions.map((sub) => sub.score)),
    lowestScore: Math.min(...submissions.map((sub) => sub.score)),
    scoreDistribution: scoreRanges,
    standardDeviation: calculateStandardDeviation(
      submissions.map((sub) => sub.percentage)
    ),
  };
}

async function calculateQuestionAnalytics(examId, questions) {
  const submissions = await Submission.find({ examId, isCompleted: true });

  if (submissions.length === 0) {
    return [];
  }

  const questionAnalytics = questions.map((question) => {
    let correctCount = 0;
    let totalAnswered = 0;
    const answerDistribution = {};

    // Initialize answer distribution
    question.options.forEach((option, index) => {
      answerDistribution[option] = 0;
    });

    submissions.forEach((submission) => {
      const studentAnswer = submission.answers.get(question._id.toString());
      if (studentAnswer) {
        totalAnswered++;
        answerDistribution[studentAnswer] =
          (answerDistribution[studentAnswer] || 0) + 1;

        if (studentAnswer === question.correctAnswer) {
          correctCount++;
        }
      }
    });

    const difficultyIndex =
      totalAnswered > 0 ? correctCount / totalAnswered : 0;
    let calculatedDifficulty = "medium";
    if (difficultyIndex >= 0.8) calculatedDifficulty = "easy";
    else if (difficultyIndex <= 0.4) calculatedDifficulty = "hard";

    return {
      questionId: question._id,
      questionText: question.questionText,
      topic: question.topic,
      difficulty: question.difficulty,
      calculatedDifficulty,
      correctCount,
      totalAnswered,
      accuracyRate:
        totalAnswered > 0
          ? Math.round((correctCount / totalAnswered) * 100 * 100) / 100
          : 0,
      difficultyIndex: Math.round(difficultyIndex * 100) / 100,
      answerDistribution,
      discriminationIndex: calculateDiscriminationIndex(submissions, question),
    };
  });

  return questionAnalytics;
}

function calculateTimeEfficiency(submission) {
  const exam = submission.examId;
  const timeUsedPercentage =
    (submission.timeSpent / exam.durationInMinutes) * 100;

  let efficiency = "average";
  if (timeUsedPercentage < 50) efficiency = "very_fast";
  else if (timeUsedPercentage < 75) efficiency = "fast";
  else if (timeUsedPercentage > 95) efficiency = "slow";

  return {
    timeSpent: submission.timeSpent,
    timeAllowed: exam.durationInMinutes,
    timeUsedPercentage: Math.round(timeUsedPercentage * 100) / 100,
    efficiency,
  };
}

function calculateDifficultyPerformance(questionResults) {
  const difficultyStats = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  };

  questionResults.forEach((result) => {
    const difficulty = result.difficulty || "medium";
    difficultyStats[difficulty].total++;
    if (result.isCorrect) {
      difficultyStats[difficulty].correct++;
    }
  });

  return Object.entries(difficultyStats).map(([difficulty, stats]) => ({
    difficulty,
    accuracy:
      stats.total > 0
        ? Math.round((stats.correct / stats.total) * 100 * 100) / 100
        : 0,
    correct: stats.correct,
    total: stats.total,
  }));
}

function calculateTopicPerformance(questionResults) {
  const topicStats = {};

  questionResults.forEach((result) => {
    const topic = result.topic || "General";
    if (!topicStats[topic]) {
      topicStats[topic] = { correct: 0, total: 0 };
    }
    topicStats[topic].total++;
    if (result.isCorrect) {
      topicStats[topic].correct++;
    }
  });

  return Object.entries(topicStats).map(([topic, stats]) => ({
    topic,
    accuracy:
      stats.total > 0
        ? Math.round((stats.correct / stats.total) * 100 * 100) / 100
        : 0,
    correct: stats.correct,
    total: stats.total,
  }));
}

function analyzeAnswerPattern(questionResults) {
  const patterns = {
    consistentCorrect: 0,
    consistentIncorrect: 0,
    alternating: 0,
    improving: 0,
    declining: 0,
  };

  // Simple pattern analysis
  let consecutiveCorrect = 0;
  let consecutiveIncorrect = 0;

  questionResults.forEach((result, index) => {
    if (result.isCorrect) {
      consecutiveCorrect++;
      consecutiveIncorrect = 0;
    } else {
      consecutiveIncorrect++;
      consecutiveCorrect = 0;
    }
  });

  return {
    totalQuestions: questionResults.length,
    correctAnswers: questionResults.filter((r) => r.isCorrect).length,
    patterns,
  };
}

function identifyStrengths(questionResults) {
  const topicPerformance = calculateTopicPerformance(questionResults);
  return topicPerformance
    .filter((topic) => topic.accuracy >= 80)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 3);
}

function identifyImprovements(questionResults) {
  const topicPerformance = calculateTopicPerformance(questionResults);
  return topicPerformance
    .filter((topic) => topic.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);
}

async function calculateStudentAnalytics(studentId) {
  const submissions = await Submission.find({
    studentId,
    isCompleted: true,
  }).populate("examId", "title durationInMinutes");

  if (submissions.length === 0) {
    return {
      totalExams: 0,
      averageScore: 0,
      averageTimeEfficiency: 0,
      improvementTrend: "stable",
      consistencyScore: 0,
    };
  }

  const totalScore = submissions.reduce((sum, sub) => sum + sub.percentage, 0);
  const averageScore = totalScore / submissions.length;

  // Calculate improvement trend
  const recentSubmissions = submissions.slice(-5);
  const olderSubmissions = submissions.slice(0, -5);

  let improvementTrend = "stable";
  if (recentSubmissions.length >= 3 && olderSubmissions.length >= 3) {
    const recentAvg =
      recentSubmissions.reduce((sum, sub) => sum + sub.percentage, 0) /
      recentSubmissions.length;
    const olderAvg =
      olderSubmissions.reduce((sum, sub) => sum + sub.percentage, 0) /
      olderSubmissions.length;

    if (recentAvg > olderAvg + 5) improvementTrend = "improving";
    else if (recentAvg < olderAvg - 5) improvementTrend = "declining";
  }

  return {
    totalExams: submissions.length,
    averageScore: Math.round(averageScore * 100) / 100,
    highestScore: Math.max(...submissions.map((sub) => sub.percentage)),
    lowestScore: Math.min(...submissions.map((sub) => sub.percentage)),
    improvementTrend,
    consistencyScore: calculateConsistencyScore(
      submissions.map((sub) => sub.percentage)
    ),
    recentPerformance: recentSubmissions.map((sub) => ({
      examTitle: sub.examId.title,
      score: sub.percentage,
      submittedAt: sub.submittedAt,
    })),
  };
}

function calculateStandardDeviation(values) {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const avgSquaredDiff =
    squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.round(Math.sqrt(avgSquaredDiff) * 100) / 100;
}

function calculateConsistencyScore(scores) {
  if (scores.length < 2) return 100;
  const standardDev = calculateStandardDeviation(scores);
  // Lower standard deviation = higher consistency
  return Math.max(0, Math.round((100 - standardDev) * 100) / 100);
}

function calculateDiscriminationIndex(submissions, question) {
  // Sort submissions by total score
  const sortedSubmissions = submissions
    .filter((sub) => sub.answers.has(question._id.toString()))
    .sort((a, b) => b.percentage - a.percentage);

  if (sortedSubmissions.length < 4) return 0;

  // Take top 27% and bottom 27%
  const topCount = Math.ceil(sortedSubmissions.length * 0.27);
  const topGroup = sortedSubmissions.slice(0, topCount);
  const bottomGroup = sortedSubmissions.slice(-topCount);

  // Calculate correct answers in each group
  const topCorrect = topGroup.filter(
    (sub) => sub.answers.get(question._id.toString()) === question.correctAnswer
  ).length;

  const bottomCorrect = bottomGroup.filter(
    (sub) => sub.answers.get(question._id.toString()) === question.correctAnswer
  ).length;

  // Discrimination index = (Top correct - Bottom correct) / Group size
  return Math.round(((topCorrect - bottomCorrect) / topCount) * 100) / 100;
}

// Additional helper functions for platform analytics
async function getExamPerformanceAnalytics(startDate) {
  return await Submission.aggregate([
    {
      $match: {
        isCompleted: true,
        submittedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$examId",
        totalSubmissions: { $sum: 1 },
        averageScore: { $avg: "$percentage" },
        highestScore: { $max: "$percentage" },
        lowestScore: { $min: "$percentage" },
      },
    },
    {
      $lookup: {
        from: "exams",
        localField: "_id",
        foreignField: "_id",
        as: "exam",
      },
    },
    {
      $unwind: "$exam",
    },
    {
      $project: {
        examTitle: "$exam.title",
        totalSubmissions: 1,
        averageScore: { $round: ["$averageScore", 2] },
        highestScore: 1,
        lowestScore: 1,
      },
    },
    { $sort: { totalSubmissions: -1 } },
    { $limit: 10 },
  ]);
}

async function getStudentPerformanceAnalytics(startDate) {
  return await Submission.aggregate([
    {
      $match: {
        isCompleted: true,
        submittedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$studentId",
        totalExams: { $sum: 1 },
        averageScore: { $avg: "$percentage" },
        totalTimeSpent: { $sum: "$timeSpent" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "student",
      },
    },
    {
      $unwind: "$student",
    },
    {
      $project: {
        studentName: "$student.name",
        studentEmail: "$student.email",
        totalExams: 1,
        averageScore: { $round: ["$averageScore", 2] },
        averageTimePerExam: {
          $round: [{ $divide: ["$totalTimeSpent", "$totalExams"] }, 2],
        },
      },
    },
    { $sort: { averageScore: -1 } },
    { $limit: 10 },
  ]);
}

async function getQuestionDifficultyAnalytics() {
  return await Question.aggregate([
    {
      $group: {
        _id: "$difficulty",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        difficulty: "$_id",
        count: 1,
        _id: 0,
      },
    },
  ]);
}

async function getTimeAnalytics(startDate) {
  return await Submission.aggregate([
    {
      $match: {
        isCompleted: true,
        submittedAt: { $gte: startDate },
      },
    },
    {
      $lookup: {
        from: "exams",
        localField: "examId",
        foreignField: "_id",
        as: "exam",
      },
    },
    {
      $unwind: "$exam",
    },
    {
      $project: {
        timeEfficiency: {
          $multiply: [
            { $divide: ["$timeSpent", "$exam.durationInMinutes"] },
            100,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        averageTimeEfficiency: { $avg: "$timeEfficiency" },
        fastSubmissions: {
          $sum: { $cond: [{ $lt: ["$timeEfficiency", 50] }, 1, 0] },
        },
        normalSubmissions: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$timeEfficiency", 50] },
                  { $lt: ["$timeEfficiency", 90] },
                ],
              },
              1,
              0,
            ],
          },
        },
        slowSubmissions: {
          $sum: { $cond: [{ $gte: ["$timeEfficiency", 90] }, 1, 0] },
        },
        totalSubmissions: { $sum: 1 },
      },
    },
  ]);
}

async function getTopicAnalytics(startDate) {
  // This would require more complex aggregation with question data
  // For now, return basic topic distribution from questions
  return await Question.aggregate([
    {
      $group: {
        _id: "$topic",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        topic: "$_id",
        questionCount: "$count",
        _id: 0,
      },
    },
    { $sort: { questionCount: -1 } },
  ]);
}

async function getTrendsAnalytics(startDate) {
  return await Submission.aggregate([
    {
      $match: {
        isCompleted: true,
        submittedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$submittedAt",
          },
        },
        submissionCount: { $sum: 1 },
        averageScore: { $avg: "$percentage" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

module.exports = {
  getExamResults,
  getStudentExamResults,
  getStudentOwnResults,
  getStudentAllResults,
  getPlatformAnalytics,
  calculateStudentAnalytics,
};
