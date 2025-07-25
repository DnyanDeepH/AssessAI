import axios from "axios";
import { storage, CONSTANTS } from "../utils/index.ts";

// Request deduplication map to prevent duplicate API calls
const pendingRequests = new Map();

// Create axios instance with base configuration
const api = axios.create({
  baseURL: CONSTANTS.API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token and handle deduplication
api.interceptors.request.use(
  (config) => {
    const token = storage.get(CONSTANTS.TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Create a unique key for this request
    const requestKey = `${config.method}_${config.url}_${JSON.stringify(
      config.params || {}
    )}_${JSON.stringify(config.data || {})}`;

    // If this request is already pending, return the existing promise
    if (pendingRequests.has(requestKey)) {
      console.log(`Deduplicating request: ${requestKey}`);
      config.cancelToken = axios.CancelToken.source().token;
      return Promise.reject(new axios.Cancel("Duplicate request"));
    }

    // Store the request key
    config.requestKey = requestKey;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    // Remove the request from pending requests
    if (response.config.requestKey) {
      pendingRequests.delete(response.config.requestKey);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Remove the request from pending requests
    if (originalRequest && originalRequest.requestKey) {
      pendingRequests.delete(originalRequest.requestKey);
    }

    // Skip duplicate request errors
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // Handle 401 errors (unauthorized)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // Clear stored auth data
      storage.remove(CONSTANTS.TOKEN_KEY);
      storage.remove(CONSTANTS.USER_KEY);
      storage.remove(CONSTANTS.EXAM_SESSION_KEY);

      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    // Handle network errors
    if (!error.response) {
      error.message = "Network error. Please check your connection.";
    }

    return Promise.reject(error);
  }
);

// Retry logic for failed requests
const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, i))
      );
    }
  }
};

// Generic API methods with request deduplication
export const apiService = {
  // GET request
  get: async (url, config = {}) => {
    const requestKey = `GET_${url}_${JSON.stringify(config.params || {})}`;

    // If request is already pending, wait for it
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    // Create and store the request promise
    const requestPromise = retryRequest(() => api.get(url, config)).finally(
      () => {
        pendingRequests.delete(requestKey);
      }
    );

    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    // POST requests are typically not deduplicated as they can have side effects
    return retryRequest(() => api.post(url, data, config));
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    return retryRequest(() => api.put(url, data, config));
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    return retryRequest(() => api.patch(url, data, config));
  },

  // DELETE request
  delete: async (url, config = {}) => {
    return retryRequest(() => api.delete(url, config));
  },

  // File upload
  upload: async (url, formData, onUploadProgress = null) => {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    if (onUploadProgress) {
      config.onUploadProgress = onUploadProgress;
    }

    return retryRequest(() => api.post(url, formData, config));
  },
};

export default api;
