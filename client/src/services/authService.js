import { apiService } from "./api";

export const authService = {
  // User registration
  register: async (userData) => {
    try {
      const response = await apiService.post("/auth/register", userData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Registration failed",
        },
      };
    }
  },

  // User login
  login: async (credentials) => {
    try {
      const response = await apiService.post("/auth/login", credentials);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Login failed",
        },
      };
    }
  },

  // User logout
  logout: async () => {
    try {
      const response = await apiService.post("/auth/logout");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      // Even if logout fails on server, we should clear local data
      return {
        success: true,
        data: { message: "Logged out locally" },
      };
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await apiService.post("/auth/refresh");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Token refresh failed",
        },
      };
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await apiService.get("/auth/verify");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Token verification failed",
        },
      };
    }
  },
};
