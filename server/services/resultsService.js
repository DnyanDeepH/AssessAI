const Submission = require("../models/Submission");
const Exam = require("../models/Exam");
const Question = require("../models/Question");
const User = require("../models/User");

class ResultsService {
  /**
   * Calculate comprehensive exam statistics
   */
  static async calculateExamStatistics(examId) {
    try {
      const exam = await Exam.findById(examId).populate("questions");
      if (!exam) {
        throw new Error("Exam not found");
      }

      const submissions = await Submission.find({
        examId,
        isCompleted: true,
      }).populate("studentId", "name email");

      if (submissions.length === 0) {
        return {
          exam: {
            _id: exam._id,
            title: exam.title,
            totalQuestions: exam.questions.length,
          },
          statistics: {
            totalSubmissions: 0,
            averageScore: 0,
            passRate: 0,
            completionRate: 0,
          },
          questionAnalysis: [],
          performanceDistribution: [],
        };
      }

      // Basic statistics
      const scores = submissions.map((sub) => sub.percentage);
      const averageScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const passCount = scores.filter((score) => score >= 60).length;
      const passRate = (passCount / submissions.length) * 100;

      // Question analysis
      const questionAnalysis = await this.analyzeQuestionPerformance(
        examId,
        exam.questions,
        submissions
      );

      // Performance distribution
      const performanceDistribution =
        this.calculatePerformanceDistribution(scores);

      // Time analysis
      const timeAnalysis = this.calculateTimeAnalysis(
        submissions,
        exam.durationInMinutes
      );

      return {
        exam: {
          _id: exam._id,
          title: exam.title,
          totalQuestions: exam.questions.length,
          durationInMinutes: exam.durationInMinutes,
        },
        statistics: {
          totalSubmissions: submissions.length,
          averageScore: Math.round(averageScore * 100) / 100,
          medianScore: this.calculateMedian(scores),
          standardDeviation: this.calculateStandardDeviation(scores),
          passRate: Math.round(passRate * 100) / 100,
          highestScore: Math.max(...scores),
          lowestScore: Math.min(...scores),
        },
        questionAnalysis,
        performanceDistribution,
        timeAnalysis,
        submissions: submissions.map((sub) => ({
          _id: sub._id,
          student: sub.studentId,
          score: sub.score,
          percentage: sub.percentage,
          timeSpent: sub.timeSpent,
          submittedAt: sub.submittedAt,
          flaggedForReview: sub.flaggedForReview,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to calculate exam statistics: ${error.message}`);
    }
  }

  /**
   * Analyze question performance
   */
  static async analyzeQuestionPerformance(examId, questions, submissions) {
    const questionAnalysis = [];

    for (const question of questions) {
      let correctCount = 0;
      let totalAnswered = 0;
      const answerDistribution = {};

      // Initialize answer distribution
      question.options.forEach((option) => {
        answerDistribution[option] = 0;
      });

      // Analyze each submission
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

      const accuracyRate =
        totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;
      const difficultyIndex = accuracyRate / 100;

      // Determine calculated difficulty based on performance
      let calculatedDifficulty = "medium";
      if (difficultyIndex >= 0.8) calculatedDifficulty = "easy";
      else if (difficultyIndex <= 0.4) calculatedDifficulty = "hard";

      // Calculate discrimination index
      const discriminationIndex = this.calculateDiscriminationIndex(
        submissions,
        question
      );

      questionAnalysis.push({
        questionId: question._id,
        questionText: question.questionText,
        topic: question.topic,
        originalDifficulty: question.difficulty,
        calculatedDifficulty,
        correctAnswer: question.correctAnswer,
        correctCount,
        totalAnswered,
        accuracyRate: Math.round(accuracyRate * 100) / 100,
        difficultyIndex: Math.round(difficultyIndex * 100) / 100,
        discriminationIndex,
        answerDistribution,
        needsReview:
          discriminationIndex < 0.2 || accuracyRate < 20 || accuracyRate > 95,
      });
    }

    return questionAnalysis;
  }

  /**
   * Calculate performance distribution
   */
  static calculatePerformanceDistribution(scores) {
    const ranges = [
      { range: "0-20", min: 0, max: 20, count: 0 },
      { range: "21-40", min: 21, max: 40, count: 0 },
      { range: "41-60", min: 41, max: 60, count: 0 },
      { range: "61-80", min: 61, max: 80, count: 0 },
      { range: "81-100", min: 81, max: 100, count: 0 },
    ];

    scores.forEach((score) => {
      const range = ranges.find((r) => score >= r.min && score <= r.max);
      if (range) range.count++;
    });

    return ranges.map((range) => ({
      range: range.range,
      count: range.count,
      percentage:
        scores.length > 0
          ? Math.round((range.count / scores.length) * 100 * 100) / 100
          : 0,
    }));
  }

  /**
   * Calculate time analysis
   */
  static calculateTimeAnalysis(submissions, examDuration) {
    const timeData = submissions.map((sub) => ({
      timeSpent: sub.timeSpent,
      timeEfficiency: (sub.timeSpent / examDuration) * 100,
    }));

    const averageTime =
      timeData.reduce((sum, data) => sum + data.timeSpent, 0) / timeData.length;
    const averageEfficiency =
      timeData.reduce((sum, data) => sum + data.timeEfficiency, 0) /
      timeData.length;

    const timeRanges = [
      { range: "Very Fast (<50%)", count: 0 },
      { range: "Fast (50-75%)", count: 0 },
      { range: "Normal (75-95%)", count: 0 },
      { range: "Slow (>95%)", count: 0 },
    ];

    timeData.forEach((data) => {
      if (data.timeEfficiency < 50) timeRanges[0].count++;
      else if (data.timeEfficiency < 75) timeRanges[1].count++;
      else if (data.timeEfficiency < 95) timeRanges[2].count++;
      else timeRanges[3].count++;
    });

    return {
      averageTime: Math.round(averageTime * 100) / 100,
      averageEfficiency: Math.round(averageEfficiency * 100) / 100,
      timeDistribution: timeRanges,
    };
  }

  /**
   * Get student performance summary
   */
  static async getStudentPerformanceSummary(studentId, timeRange = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      const submissions = await Submission.find({
        studentId,
        isCompleted: true,
        submittedAt: { $gte: startDate },
      }).populate("examId", "title durationInMinutes");

      if (submissions.length === 0) {
        return {
          totalExams: 0,
          averageScore: 0,
          improvementTrend: "no_data",
          strengths: [],
          improvements: [],
          recentPerformance: [],
        };
      }

      const scores = submissions.map((sub) => sub.percentage);
      const averageScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;

      // Calculate improvement trend
      const improvementTrend = this.calculateImprovementTrend(submissions);

      // Get topic performance
      const topicPerformance = await this.getStudentTopicPerformance(
        studentId,
        submissions
      );

      // Identify strengths and areas for improvement
      const strengths = topicPerformance
        .filter((topic) => topic.accuracy >= 80)
        .slice(0, 3);
      const improvements = topicPerformance
        .filter((topic) => topic.accuracy < 60)
        .slice(0, 3);

      return {
        totalExams: submissions.length,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        improvementTrend,
        consistencyScore: this.calculateConsistencyScore(scores),
        strengths,
        improvements,
        recentPerformance: submissions.slice(-5).map((sub) => ({
          examTitle: sub.examId.title,
          score: sub.percentage,
          submittedAt: sub.submittedAt,
        })),
        timeEfficiency: this.calculateStudentTimeEfficiency(submissions),
      };
    } catch (error) {
      throw new Error(
        `Failed to get student performance summary: ${error.message}`
      );
    }
  }

  /**
   * Get detailed student topic performance
   */
  static async getStudentTopicPerformance(studentId, submissions) {
    const topicStats = {};

    for (const submission of submissions) {
      await submission.populate({
        path: "examId",
        populate: {
          path: "questions",
          select: "topic correctAnswer",
        },
      });

      if (submission.examId && submission.examId.questions) {
        submission.examId.questions.forEach((question) => {
          const topic = question.topic || "General";
          const studentAnswer = submission.answers.get(question._id.toString());
          const isCorrect = studentAnswer === question.correctAnswer;

          if (!topicStats[topic]) {
            topicStats[topic] = { correct: 0, total: 0 };
          }

          topicStats[topic].total++;
          if (isCorrect) {
            topicStats[topic].correct++;
          }
        });
      }
    }

    return Object.entries(topicStats)
      .map(([topic, stats]) => ({
        topic,
        accuracy:
          stats.total > 0
            ? Math.round((stats.correct / stats.total) * 100 * 100) / 100
            : 0,
        correct: stats.correct,
        total: stats.total,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);
  }

  /**
   * Calculate improvement trend
   */
  static calculateImprovementTrend(submissions) {
    if (submissions.length < 3) return "insufficient_data";

    const sortedSubmissions = submissions.sort(
      (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)
    );
    const recentScores = sortedSubmissions
      .slice(-3)
      .map((sub) => sub.percentage);
    const olderScores = sortedSubmissions
      .slice(0, -3)
      .map((sub) => sub.percentage);

    if (olderScores.length === 0) return "insufficient_data";

    const recentAvg =
      recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const olderAvg =
      olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length;

    const difference = recentAvg - olderAvg;

    if (difference > 5) return "improving";
    if (difference < -5) return "declining";
    return "stable";
  }

  /**
   * Calculate student time efficiency
   */
  static calculateStudentTimeEfficiency(submissions) {
    const efficiencyData = submissions.map((sub) => {
      const efficiency = (sub.timeSpent / sub.examId.durationInMinutes) * 100;
      return {
        examTitle: sub.examId.title,
        timeSpent: sub.timeSpent,
        timeAllowed: sub.examId.durationInMinutes,
        efficiency: Math.round(efficiency * 100) / 100,
      };
    });

    const averageEfficiency =
      efficiencyData.reduce((sum, data) => sum + data.efficiency, 0) /
      efficiencyData.length;

    return {
      averageEfficiency: Math.round(averageEfficiency * 100) / 100,
      details: efficiencyData,
    };
  }

  // Utility methods
  static calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (
        Math.round(((sorted[middle - 1] + sorted[middle]) / 2) * 100) / 100
      );
    }
    return sorted[middle];
  }

  static calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    const avgSquaredDiff =
      squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.round(Math.sqrt(avgSquaredDiff) * 100) / 100;
  }

  static calculateConsistencyScore(scores) {
    if (scores.length < 2) return 100;
    const standardDev = this.calculateStandardDeviation(scores);
    return Math.max(0, Math.round((100 - standardDev) * 100) / 100);
  }

  static calculateDiscriminationIndex(submissions, question) {
    const sortedSubmissions = submissions
      .filter((sub) => sub.answers.has(question._id.toString()))
      .sort((a, b) => b.percentage - a.percentage);

    if (sortedSubmissions.length < 4) return 0;

    const topCount = Math.ceil(sortedSubmissions.length * 0.27);
    const topGroup = sortedSubmissions.slice(0, topCount);
    const bottomGroup = sortedSubmissions.slice(-topCount);

    const topCorrect = topGroup.filter(
      (sub) =>
        sub.answers.get(question._id.toString()) === question.correctAnswer
    ).length;

    const bottomCorrect = bottomGroup.filter(
      (sub) =>
        sub.answers.get(question._id.toString()) === question.correctAnswer
    ).length;

    return Math.round(((topCorrect - bottomCorrect) / topCount) * 100) / 100;
  }
}

module.exports = ResultsService;
