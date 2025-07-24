import { apiService } from "./api";

export const studentService = {
  // Get student dashboard data
  getDashboard: async () => {
    try {
      const response = await apiService.get("/student/dashboard");
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

  // Get all exams for student
  getExams: async () => {
    try {
      const response = await apiService.get("/student/exams");
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

  // Get upcoming exams
  getUpcomingExams: async () => {
    try {
      const response = await apiService.get("/student/exams/upcoming");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch upcoming exams",
        },
      };
    }
  },

  // Start exam session
  startExam: async (examId) => {
    try {
      const response = await apiService.get(`/student/exams/${examId}/start`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to start exam",
        },
      };
    }
  },

  // Submit exam
  submitExam: async (examId, answers) => {
    try {
      const response = await apiService.post(
        `/student/exams/${examId}/submit`,
        {
          answers,
        }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to submit exam",
        },
      };
    }
  },

  // Save exam progress (auto-save)
  saveExamProgress: async (examId, answers, currentQuestionIndex) => {
    try {
      const response = await apiService.patch(
        `/student/exams/${examId}/progress`,
        {
          answers,
          currentQuestionIndex,
        }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to save progress",
        },
      };
    }
  },

  // Get exam results
  getResults: async (page = 1, limit = 10) => {
    try {
      const response = await apiService.get("/student/results", {
        params: { page, limit },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch results",
        },
      };
    }
  },

  // Get specific exam result
  getExamResult: async (examId) => {
    try {
      const response = await apiService.get(`/student/results/${examId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch exam result",
        },
      };
    }
  },

  // Update profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiService.put("/student/profile", profileData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to update profile",
        },
      };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await apiService.put("/student/password", passwordData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to change password",
        },
      };
    }
  },
};
