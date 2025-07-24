const User = require("../models/User");
const Exam = require("../models/Exam");
const Question = require("../models/Question");
const Submission = require("../models/Submission");

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
const getDashboard = async (req, res) => {
  try {
    // Get current date and calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get basic counts
    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      activeUsers,
      totalExams,
      activeExams,
      totalQuestions,
      totalSubmissions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ isActive: true }),
      Exam.countDocuments(),
      Exam.countDocuments({ isActive: true }),
      Question.countDocuments(),
      Submission.countDocuments(),
    ]);

    // Get recent activity counts
    const [
      newUsersThisMonth,
      newUsersThisWeek,
      examsCreatedThisMonth,
      submissionsThisMonth,
      submissionsThisWeek,
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Exam.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Submission.countDocuments({ submittedAt: { $gte: thirtyDaysAgo } }),
      Submission.countDocuments({ submittedAt: { $gte: sevenDaysAgo } }),
    ]);

    // Get recent users
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role createdAt")
      .lean();

    // Get recent exams
    const recentExams = await Exam.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title createdAt assignedTo")
      .populate("assignedTo", "name")
      .lean();

    // Get exam completion statistics
    const examStats = await Submission.aggregate([
      {
        $group: {
          _id: "$examId",
          totalSubmissions: { $sum: 1 },
          averageScore: { $avg: "$percentage" },
          completedSubmissions: {
            $sum: { $cond: [{ $eq: ["$isCompleted", true] }, 1, 0] },
          },
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
          completionRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$completedSubmissions", "$totalSubmissions"] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
      { $sort: { totalSubmissions: -1 } },
      { $limit: 10 },
    ]);

    // Get user registration trend (last 30 days)
    const userRegistrationTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get submission trend (last 30 days)
    const submissionTrend = await Submission.aggregate([
      {
        $match: {
          submittedAt: { $gte: thirtyDaysAgo },
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
          count: { $sum: 1 },
          averageScore: { $avg: "$percentage" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get question difficulty distribution
    const questionDifficultyStats = await Question.aggregate([
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get top performing students
    const topStudents = await Submission.aggregate([
      {
        $match: { isCompleted: true },
      },
      {
        $group: {
          _id: "$studentId",
          averageScore: { $avg: "$percentage" },
          totalExams: { $sum: 1 },
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
          averageScore: { $round: ["$averageScore", 2] },
          totalExams: 1,
        },
      },
      { $sort: { averageScore: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        // Direct fields for backward compatibility
        totalUsers,
        totalStudents,
        totalAdmins,
        activeUsers,
        totalExams,
        activeExams,
        totalQuestions,
        totalSubmissions,
        recentSubmissions: submissionsThisWeek, // Map to expected field name

        // Grouped data
        overview: {
          totalUsers,
          totalStudents,
          totalAdmins,
          activeUsers,
          totalExams,
          activeExams,
          totalQuestions,
          totalSubmissions,
        },
        recentActivity: {
          newUsersThisMonth,
          newUsersThisWeek,
          examsCreatedThisMonth,
          submissionsThisMonth,
          submissionsThisWeek,
        },
        recentUsers,
        recentExams,
        examStats: {
          averageScore:
            examStats.length > 0
              ? examStats.reduce((sum, stat) => sum + stat.averageScore, 0) /
                examStats.length
              : 0,
          completionRate:
            examStats.length > 0
              ? examStats.reduce((sum, stat) => sum + stat.completionRate, 0) /
                examStats.length
              : 0,
          participationRate:
            totalSubmissions > 0
              ? Math.round(
                  (totalSubmissions / (totalStudents * totalExams || 1)) * 100
                )
              : 0,
          details: examStats,
        },
        trends: {
          userRegistrations: userRegistrationTrend,
          submissions: submissionTrend,
        },
        questionDifficultyStats,
        topStudents,
      },
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "DASHBOARD_ERROR",
        message: "Failed to retrieve dashboard data.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * @desc    Get system health and performance metrics
 * @route   GET /api/admin/system-health
 * @access  Private (Admin only)
 */
const getSystemHealth = async (req, res) => {
  try {
    const startTime = Date.now();

    // Database connection test
    const dbTest = await User.findOne().limit(1);
    const dbResponseTime = Date.now() - startTime;

    // Memory usage
    const memoryUsage = process.memoryUsage();

    // System uptime
    const uptime = process.uptime();

    // Database statistics
    const dbStats = await Promise.all([
      User.estimatedDocumentCount(),
      Exam.estimatedDocumentCount(),
      Question.estimatedDocumentCount(),
      Submission.estimatedDocumentCount(),
    ]);

    res.json({
      success: true,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: {
          connected: !!dbTest || dbTest === null,
          responseTime: dbResponseTime,
          collections: {
            users: dbStats[0],
            exams: dbStats[1],
            questions: dbStats[2],
            submissions: dbStats[3],
          },
        },
        system: {
          uptime: Math.floor(uptime),
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024),
          },
          nodeVersion: process.version,
        },
      },
    });
  } catch (error) {
    console.error("System health check error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "HEALTH_CHECK_ERROR",
        message: "System health check failed.",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

module.exports = {
  getDashboard,
  getSystemHealth,
};
