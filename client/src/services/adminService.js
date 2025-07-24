import { apiService } from "./api";

export const adminService = {
  // Dashboard
  getDashboard: async () => {
    try {
      const response = await apiService.get("/admin/dashboard");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch dashboard data",
        },
      };
    }
  },

  // User Management
  getUsers: async (page = 1, limit = 10, search = "", role = "") => {
    try {
      const response = await apiService.get("/admin/users", {
        params: { page, limit, search, role },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch users",
        },
      };
    }
  },

  createUser: async (userData) => {
    try {
      const response = await apiService.post("/admin/users", userData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to create user",
        },
      };
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await apiService.put(`/admin/users/${userId}`, userData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to update user",
        },
      };
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await apiService.delete(`/admin/users/${userId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to delete user",
        },
      };
    }
  },

  // Question Management
  getQuestions: async (page = 1, limit = 10, search = "", topic = "") => {
    try {
      const response = await apiService.get("/admin/questions", {
        params: { page, limit, search, topic },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch questions",
        },
      };
    }
  },

  createQuestion: async (questionData) => {
    try {
      const response = await apiService.post("/admin/questions", questionData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to create question",
        },
      };
    }
  },

  updateQuestion: async (questionId, questionData) => {
    try {
      const response = await apiService.put(
        `/admin/questions/${questionId}`,
        questionData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to update question",
        },
      };
    }
  },

  deleteQuestion: async (questionId) => {
    try {
      const response = await apiService.delete(
        `/admin/questions/${questionId}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to delete question",
        },
      };
    }
  },

  // Exam Management
  getExams: async (page = 1, limit = 10, search = "") => {
    try {
      const response = await apiService.get("/admin/exams", {
        params: { page, limit, search },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch exams",
        },
      };
    }
  },

  createExam: async (examData) => {
    try {
      const response = await apiService.post("/admin/exams", examData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to create exam",
        },
      };
    }
  },

  updateExam: async (examId, examData) => {
    try {
      const response = await apiService.put(`/admin/exams/${examId}`, examData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to update exam",
        },
      };
    }
  },

  deleteExam: async (examId) => {
    try {
      const response = await apiService.delete(`/admin/exams/${examId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to delete exam",
        },
      };
    }
  },

  // User Statistics
  getUserStats: async () => {
    try {
      const response = await apiService.get("/admin/users/stats");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch user statistics",
        },
      };
    }
  },

  // Question Statistics
  getQuestionStats: async () => {
    try {
      const response = await apiService.get("/admin/questions/stats");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch question statistics",
        },
      };
    }
  },

  // Exam Assignment
  assignExam: async (examId, data) => {
    try {
      const response = await apiService.post(
        `/admin/exams/${examId}/assign`,
        data
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to assign exam",
        },
      };
    }
  },

  // Analytics
  getExamAnalytics: async (examId) => {
    try {
      const response = await apiService.get(`/admin/analytics/${examId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch exam analytics",
        },
      };
    }
  },

  getOverallAnalytics: async (dateRange = "30d") => {
    try {
      const response = await apiService.get("/admin/analytics", {
        params: { range: dateRange },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch analytics",
        },
      };
    }
  },

  // Bulk operations
  bulkCreateUsers: async (usersData) => {
    try {
      const response = await apiService.post("/admin/users/bulk", usersData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to create users in bulk",
        },
      };
    }
  },

  bulkDeleteUsers: async (data) => {
    try {
      const response = await apiService.delete("/admin/users/bulk", { data });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to delete users in bulk",
        },
      };
    }
  },

  bulkUpdateUsers: async (data) => {
    try {
      const response = await apiService.put("/admin/users/bulk", data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to update users in bulk",
        },
      };
    }
  },

  bulkCreateQuestions: async (questionsData) => {
    try {
      const response = await apiService.post(
        "/admin/questions/bulk",
        questionsData
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to create questions in bulk",
        },
      };
    }
  },

  bulkDeleteQuestions: async (data) => {
    try {
      const response = await apiService.delete("/admin/questions/bulk", {
        data,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to delete questions in bulk",
        },
      };
    }
  },

  // Analytics methods for the Analytics component
  getOverviewStats: async (timeRange = "30") => {
    try {
      const response = await apiService.get("/admin/analytics/overview", {
        params: { timeRange },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch overview stats",
        },
      };
    }
  },

  getExamStats: async (timeRange = "30") => {
    try {
      const response = await apiService.get("/admin/analytics/exams", {
        params: { timeRange },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch exam stats",
        },
      };
    }
  },

  getUserActivity: async (timeRange = "30") => {
    try {
      const response = await apiService.get("/admin/analytics/activity", {
        params: { timeRange },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch user activity",
        },
      };
    }
  },

  getPerformanceMetrics: async (timeRange = "30") => {
    try {
      const response = await apiService.get("/admin/analytics/performance", {
        params: { timeRange },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch performance metrics",
        },
      };
    }
  },
};
