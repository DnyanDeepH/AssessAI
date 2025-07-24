// Import services
import { apiService } from "./api";
import { authService } from "./authService";
import { studentService } from "./studentService";
import { adminService } from "./adminService";
import { aiService } from "./aiService";

// Export all services
export { apiService, authService, studentService, adminService, aiService };

// Default export for convenience
export default {
  api: apiService,
  auth: authService,
  student: studentService,
  admin: adminService,
  ai: aiService,
};
