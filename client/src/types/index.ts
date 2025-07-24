// Core type definitions for AssessAI platform

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  profile: {
    avatar?: string;
    phone?: string;
    dateOfBirth?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface Question {
  _id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Exam {
  _id: string;
  title: string;
  description?: string;
  durationInMinutes: number;
  questions: string[] | Question[];
  assignedTo: string[] | User[];
  startTime?: string;
  endTime?: string;
  settings: {
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showResults: boolean;
    allowReview: boolean;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Submission {
  _id: string;
  examId: string;
  studentId: string;
  answers: Record<string, string>;
  score?: number;
  percentage?: number;
  timeSpent?: number;
  submittedAt?: string;
  startedAt: string;
  ipAddress?: string;
  userAgent?: string;
  isCompleted: boolean;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
    timestamp: string;
  };
}

// Dashboard types
export interface StudentDashboard {
  upcomingExamsCount: number;
  lastExamScore?: number;
  recentExams: Exam[];
}

export interface AdminDashboard {
  totalStudents: number;
  totalExams: number;
  totalQuestions: number;
  recentActivity: any[];
}

// Exam session types
export interface ExamSession {
  examId: string;
  startTime: string;
  timeRemaining: number;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  isSubmitted: boolean;
}

// AI Practice Zone types
export interface PracticeRequest {
  text?: string;
  file?: File;
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface PracticeSession {
  questions: GeneratedQuestion[];
  currentIndex: number;
  answers: Record<number, string>;
  score?: number;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

// Route types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  protected: boolean;
  roles?: ('student' | 'admin')[];
}