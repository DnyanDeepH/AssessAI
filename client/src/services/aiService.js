import { apiService } from "./api";

export const aiService = {
  // Generate questions from content or PDF file
  generateQuestions: async (options = {}) => {
    try {
      let response;

      // Check if options is FormData (PDF file upload)
      if (options instanceof FormData) {
        response = await apiService.post(
          "/ai/generate-questions-pdf",
          options,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        // Text content
        const requestData = {
          content: options.content || options.text,
          count: options.count || options.questionCount || 5,
          difficulty: options.difficulty || "medium",
          topic: options.topic || "",
        };

        response = await apiService.post("/ai/generate-questions", requestData);
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to generate questions",
        },
      };
    }
  },

  // Generate MCQ questions from text
  generateMCQFromText: async (text, options = {}) => {
    try {
      const requestData = {
        text,
        questionCount: options.questionCount || 5,
        difficulty: options.difficulty || "medium",
        topic: options.topic || "",
      };

      const response = await apiService.post("/ai/generate-mcq", requestData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to generate questions from text",
        },
      };
    }
  },

  // Upload document and generate MCQ questions
  generateMCQFromDocument: async (
    file,
    options = {},
    onUploadProgress = null
  ) => {
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("questionCount", options.questionCount || 5);
      formData.append("difficulty", options.difficulty || "medium");
      formData.append("topic", options.topic || "");

      const response = await apiService.upload(
        "/ai/upload-document",
        formData,
        onUploadProgress
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message:
            error.message || "Failed to generate questions from document",
        },
      };
    }
  },

  // Get supported file types
  getSupportedFileTypes: async () => {
    try {
      const response = await apiService.get("/ai/supported-types");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to fetch supported file types",
        },
      };
    }
  },

  // Validate document before upload
  validateDocument: async (file) => {
    try {
      const formData = new FormData();
      formData.append("document", file);

      const response = await apiService.post("/ai/validate-document", formData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Document validation failed",
        },
      };
    }
  },

  // Get AI service status
  getServiceStatus: async () => {
    try {
      const response = await apiService.get("/ai/status");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || {
          message: error.message || "Failed to check AI service status",
        },
      };
    }
  },
};
