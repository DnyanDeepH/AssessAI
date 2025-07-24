const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: [true, "Exam ID is required"],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student ID is required"],
    },
    answers: {
      type: Map,
      of: String,
      default: new Map(),
    },
    score: {
      type: Number,
      min: [0, "Score cannot be negative"],
      default: 0,
    },
    percentage: {
      type: Number,
      min: [0, "Percentage cannot be negative"],
      max: [100, "Percentage cannot exceed 100"],
      default: 0,
    },
    timeSpent: {
      type: Number,
      min: [0, "Time spent cannot be negative"],
      default: 0,
    },
    startedAt: {
      type: Date,
      required: [true, "Start time is required"],
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    attemptNumber: {
      type: Number,
      default: 1,
      min: [1, "Attempt number must be at least 1"],
    },
    flaggedForReview: {
      type: Boolean,
      default: false,
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Review notes cannot exceed 1000 characters"],
    },
    sessionEvents: {
      type: [
        {
          eventType: {
            type: String,
            enum: [
              "start",
              "resume",
              "save",
              "idle",
              "submit",
              "auto_submit",
              "device_change",
              "location_change",
              "security_violation",
              "security_warning",
              "activity",
              "focus_lost",
              "focus_gained",
              "tab_switch",
              "window_resize",
            ],
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          details: {
            type: Object,
          },
        },
      ],
      default: [],
    },
    browserInfo: {
      browser: {
        name: String,
        version: String,
        major: String,
      },
      device: {
        model: String,
        type: String,
        vendor: String,
      },
      os: {
        name: String,
        version: String,
      },
      initialIp: String,
      initialUserAgent: String,
    },
    timezone: {
      type: String,
      trim: true,
    },
    securityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performance and uniqueness
submissionSchema.index(
  { examId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true }
);
submissionSchema.index({ studentId: 1, submittedAt: -1 });
submissionSchema.index({ examId: 1, isCompleted: 1 });

// Pre-save middleware to calculate time spent and validate submission
submissionSchema.pre("save", function (next) {
  // Calculate time spent if submitting
  if (this.isCompleted && this.submittedAt && this.startedAt) {
    this.timeSpent = Math.round(
      (this.submittedAt - this.startedAt) / (1000 * 60)
    ); // in minutes
  }

  // Ensure submittedAt is set when marking as completed
  if (this.isCompleted && !this.submittedAt) {
    this.submittedAt = new Date();
  }

  next();
});

// Instance method to calculate score
submissionSchema.methods.calculateScore = async function () {
  try {
    // Populate the exam with questions
    await this.populate({
      path: "examId",
      populate: {
        path: "questions",
        select: "correctAnswer",
      },
    });

    if (!this.examId || !this.examId.questions) {
      throw new Error("Exam or questions not found");
    }

    const questions = this.examId.questions;
    let correctAnswers = 0;

    // Count correct answers
    questions.forEach((question) => {
      const studentAnswer = this.answers.get(question._id.toString());
      if (studentAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    });

    // Calculate score and percentage
    this.score = correctAnswers;
    this.percentage =
      questions.length > 0
        ? Math.round((correctAnswers / questions.length) * 100)
        : 0;

    return this.save();
  } catch (error) {
    throw error;
  }
};

// Instance method to submit exam
submissionSchema.methods.submitExam = async function () {
  this.isCompleted = true;
  this.submittedAt = new Date();

  // Calculate score automatically
  await this.calculateScore();

  return this;
};

// Instance method to save answer
submissionSchema.methods.saveAnswer = function (questionId, answer) {
  this.answers.set(questionId.toString(), answer);
  return this.save();
};

// Instance method to get detailed results
submissionSchema.methods.getDetailedResults = async function () {
  await this.populate([
    {
      path: "examId",
      select: "title questions",
      populate: {
        path: "questions",
        select: "questionText options correctAnswer explanation topic",
      },
    },
    {
      path: "studentId",
      select: "name email",
    },
  ]);

  const results = {
    submission: this,
    questionResults: [],
  };

  if (this.examId && this.examId.questions) {
    results.questionResults = this.examId.questions.map((question) => {
      const studentAnswer = this.answers.get(question._id.toString());
      const isCorrect = studentAnswer === question.correctAnswer;

      return {
        questionId: question._id,
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        studentAnswer: studentAnswer || null,
        isCorrect,
        explanation: question.explanation,
        topic: question.topic,
      };
    });
  }

  return results;
};

// Static method to find submissions by student
submissionSchema.statics.findByStudent = function (studentId, options = {}) {
  const query = { studentId, isCompleted: true };

  return this.find(query)
    .populate("examId", "title durationInMinutes")
    .sort({ submittedAt: -1 })
    .limit(options.limit || 50);
};

// Static method to find submissions by exam
submissionSchema.statics.findByExam = function (examId, options = {}) {
  const query = { examId, isCompleted: true };

  return this.find(query)
    .populate("studentId", "name email")
    .sort({ submittedAt: -1 })
    .limit(options.limit || 100);
};

// Static method to get exam analytics
submissionSchema.statics.getExamAnalytics = async function (examId) {
  const submissions = await this.find({ examId, isCompleted: true });

  if (submissions.length === 0) {
    return {
      totalSubmissions: 0,
      averageScore: 0,
      averagePercentage: 0,
      averageTimeSpent: 0,
      passRate: 0,
    };
  }

  const totalScore = submissions.reduce((sum, sub) => sum + sub.score, 0);
  const totalPercentage = submissions.reduce(
    (sum, sub) => sum + sub.percentage,
    0
  );
  const totalTime = submissions.reduce((sum, sub) => sum + sub.timeSpent, 0);
  const passCount = submissions.filter((sub) => sub.percentage >= 60).length;

  return {
    totalSubmissions: submissions.length,
    averageScore: Math.round((totalScore / submissions.length) * 100) / 100,
    averagePercentage:
      Math.round((totalPercentage / submissions.length) * 100) / 100,
    averageTimeSpent: Math.round((totalTime / submissions.length) * 100) / 100,
    passRate: Math.round((passCount / submissions.length) * 100 * 100) / 100,
    highestScore: Math.max(...submissions.map((sub) => sub.score)),
    lowestScore: Math.min(...submissions.map((sub) => sub.score)),
  };
};

// Instance method to flag for review
submissionSchema.methods.flagForReview = function (notes = "") {
  this.flaggedForReview = true;
  this.reviewNotes = notes;
  return this.save();
};

// Instance method to get performance breakdown
submissionSchema.methods.getPerformanceBreakdown = async function () {
  await this.populate({
    path: "examId",
    populate: {
      path: "questions",
      select: "topic difficulty correctAnswer",
    },
  });

  if (!this.examId || !this.examId.questions) {
    return null;
  }

  const breakdown = {
    byTopic: {},
    byDifficulty: {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
    },
    totalQuestions: this.examId.questions.length,
    answeredQuestions: this.answers.size,
    correctAnswers: 0,
  };

  this.examId.questions.forEach((question) => {
    const studentAnswer = this.answers.get(question._id.toString());
    const isCorrect = studentAnswer === question.correctAnswer;
    const topic = question.topic || "General";
    const difficulty = question.difficulty || "medium";

    // Topic breakdown
    if (!breakdown.byTopic[topic]) {
      breakdown.byTopic[topic] = { correct: 0, total: 0 };
    }
    breakdown.byTopic[topic].total++;
    if (isCorrect) {
      breakdown.byTopic[topic].correct++;
      breakdown.correctAnswers++;
    }

    // Difficulty breakdown
    breakdown.byDifficulty[difficulty].total++;
    if (isCorrect) {
      breakdown.byDifficulty[difficulty].correct++;
    }
  });

  // Calculate percentages
  Object.keys(breakdown.byTopic).forEach((topic) => {
    const stats = breakdown.byTopic[topic];
    stats.percentage =
      stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  });

  Object.keys(breakdown.byDifficulty).forEach((difficulty) => {
    const stats = breakdown.byDifficulty[difficulty];
    stats.percentage =
      stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  });

  return breakdown;
};

// Static method to get class performance for an exam
submissionSchema.statics.getClassPerformance = async function (examId) {
  const submissions = await this.find({ examId, isCompleted: true }).populate(
    "studentId",
    "name email"
  );

  if (submissions.length === 0) {
    return {
      totalStudents: 0,
      averageScore: 0,
      medianScore: 0,
      standardDeviation: 0,
      passRate: 0,
      gradeDistribution: {},
    };
  }

  const scores = submissions.map((sub) => sub.percentage).sort((a, b) => a - b);
  const totalStudents = submissions.length;
  const averageScore =
    scores.reduce((sum, score) => sum + score, 0) / totalStudents;
  const medianScore =
    totalStudents % 2 === 0
      ? (scores[totalStudents / 2 - 1] + scores[totalStudents / 2]) / 2
      : scores[Math.floor(totalStudents / 2)];

  // Calculate standard deviation
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) /
    totalStudents;
  const standardDeviation = Math.sqrt(variance);

  // Pass rate (assuming 60% is passing)
  const passCount = scores.filter((score) => score >= 60).length;
  const passRate = (passCount / totalStudents) * 100;

  // Grade distribution
  const gradeDistribution = {
    "A (90-100)": scores.filter((s) => s >= 90).length,
    "B (80-89)": scores.filter((s) => s >= 80 && s < 90).length,
    "C (70-79)": scores.filter((s) => s >= 70 && s < 80).length,
    "D (60-69)": scores.filter((s) => s >= 60 && s < 70).length,
    "F (0-59)": scores.filter((s) => s < 60).length,
  };

  return {
    totalStudents,
    averageScore: Math.round(averageScore * 100) / 100,
    medianScore: Math.round(medianScore * 100) / 100,
    standardDeviation: Math.round(standardDeviation * 100) / 100,
    passRate: Math.round(passRate * 100) / 100,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    gradeDistribution,
    submissions: submissions.map((sub) => ({
      student: sub.studentId,
      score: sub.percentage,
      timeSpent: sub.timeSpent,
      submittedAt: sub.submittedAt,
    })),
  };
};

module.exports = mongoose.model("Submission", submissionSchema);
