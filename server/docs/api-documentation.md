# AssessAI Platform API Documentation

## Overview

This document provides comprehensive documentation for the AssessAI Platform API. The API follows RESTful principles and uses JWT for authentication.

## Base URL

```
https://api.assessai.com/api
```

For local development:

```
http://localhost:5000/api
```

## Health Check and Monitoring

### Health Check

```
GET /health
```

Returns the current health status of the API server and its dependencies.

**Response:**

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2023-06-15T10:00:00Z",
  "environment": "production",
  "status": "healthy",
  "database": {
    "isConnected": true,
    "status": "connected"
  },
  "system": {
    "uptime": 3600,
    "memoryUsage": {
      "rss": 45678912,
      "heapTotal": 23456789,
      "heapUsed": 12345678,
      "external": 1234567
    },
    "freeMemory": 1073741824,
    "totalMemory": 8589934592,
    "loadAverage": [0.5, 0.3, 0.2]
  },
  "process": {
    "pid": 12345,
    "nodeVersion": "v16.14.0",
    "platform": "linux",
    "arch": "x64"
  }
}
```

### Detailed Health Check

```
GET /api/health/detailed
```

Returns comprehensive health information including database connectivity, system resources, and service dependencies.

**Response:**

```json
{
  "success": true,
  "timestamp": "2023-06-15T10:00:00Z",
  "status": "healthy",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": "5ms",
      "details": {
        "isConnected": true,
        "readyState": 1,
        "host": "cluster0.mongodb.net",
        "name": "assessai"
      }
    },
    "geminiApi": {
      "status": "healthy",
      "responseTime": "150ms",
      "details": {
        "isConfigured": true,
        "lastCheck": "2023-06-15T09:55:00Z"
      }
    },
    "fileSystem": {
      "status": "healthy",
      "details": {
        "uploadsDirectory": {
          "exists": true,
          "writable": true,
          "freeSpace": "50GB"
        }
      }
    }
  },
  "metrics": {
    "requestsPerMinute": 45,
    "averageResponseTime": "120ms",
    "errorRate": "0.5%",
    "activeConnections": 12
  }
}
```

### Metrics Endpoint

```
GET /api/metrics
```

Returns performance metrics in Prometheus format for monitoring tools.

**Response:**

```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1234
http_requests_total{method="POST",status="201"} 567

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 100
http_request_duration_seconds_bucket{le="0.5"} 200
http_request_duration_seconds_bucket{le="1.0"} 250
http_request_duration_seconds_bucket{le="+Inf"} 300

# HELP database_connections_active Active database connections
# TYPE database_connections_active gauge
database_connections_active 5

# HELP memory_usage_bytes Memory usage in bytes
# TYPE memory_usage_bytes gauge
memory_usage_bytes{type="heap_used"} 12345678
memory_usage_bytes{type="heap_total"} 23456789
```

## Authentication

### Authentication Endpoints

#### Register User

```
POST /auth/register
```

Creates a new user account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "role": "student" // "student" or "admin"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login User

```
POST /auth/login
```

Authenticates a user and returns a JWT token.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Refresh Token

```
POST /auth/refresh
```

Refreshes an expired JWT token.

**Request Headers:**

```
Authorization: Bearer <refresh_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Logout

```
POST /auth/logout
```

Invalidates the current JWT token.

**Request Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### Authentication for API Requests

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Student API Endpoints

### Dashboard

```
GET /student/dashboard
```

Returns student dashboard data.

**Response:**

```json
{
  "success": true,
  "data": {
    "upcomingExamsCount": 2,
    "lastExamScore": 85,
    "totalExamsTaken": 5
  }
}
```

### Upcoming Exams

```
GET /student/exams/upcoming
```

Returns a list of upcoming exams for the student.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "title": "Midterm Exam",
      "description": "Comprehensive midterm examination",
      "startTime": "2023-06-15T10:00:00Z",
      "endTime": "2023-06-15T12:00:00Z",
      "durationInMinutes": 120,
      "isAvailable": true
    }
  ]
}
```

### Start Exam

```
POST /student/exams/:examId/start
```

Starts an exam session for the student.

**Response:**

```json
{
  "success": true,
  "data": {
    "exam": {
      "_id": "60d21b4667d0d8992e610c85",
      "title": "Midterm Exam",
      "durationInMinutes": 120
    },
    "questions": [
      {
        "_id": "60d21b4667d0d8992e610c86",
        "questionText": "What is 2 + 2?",
        "options": ["3", "4", "5", "6"]
      }
    ],
    "timeRemaining": 7200
  }
}
```

### Submit Exam

```
POST /student/exams/:examId/submit
```

Submits exam answers.

**Request Body:**

```json
{
  "answers": {
    "60d21b4667d0d8992e610c86": "4",
    "60d21b4667d0d8992e610c87": "Paris"
  },
  "timeSpent": 65
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "score": 2,
    "percentage": 100,
    "submittedAt": "2023-06-15T11:05:00Z"
  }
}
```

### Exam Results

```
GET /student/results
```

Returns a list of exam results for the student.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c88",
      "examId": "60d21b4667d0d8992e610c85",
      "examTitle": "Midterm Exam",
      "score": 18,
      "totalQuestions": 20,
      "percentage": 90,
      "submittedAt": "2023-06-15T11:05:00Z"
    }
  ]
}
```

### Student Profile

```
GET /student/profile
```

Returns the student's profile information.

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "John Doe",
    "email": "john@example.com",
    "profile": {
      "avatar": "https://example.com/avatar.jpg",
      "phone": "123-456-7890"
    }
  }
}
```

```
PUT /student/profile
```

Updates the student's profile information.

**Request Body:**

```json
{
  "name": "John Smith",
  "profile": {
    "phone": "123-456-7890"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "John Smith",
    "email": "john@example.com",
    "profile": {
      "avatar": "https://example.com/avatar.jpg",
      "phone": "123-456-7890"
    }
  }
}
```

## Admin API Endpoints

### Dashboard

```
GET /admin/dashboard
```

Returns admin dashboard data.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalStudents": 150,
    "totalExams": 25,
    "totalQuestions": 500,
    "recentSubmissions": 45,
    "examStats": {
      "averageScore": 78.5,
      "completionRate": 92
    }
  }
}
```

### User Management

```
GET /admin/users
```

Returns a list of users.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `role`: Filter by role (optional)
- `search`: Search by name or email (optional)

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "student"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 15,
      "totalUsers": 150
    }
  }
}
```

```
POST /admin/users
```

Creates a new user.

**Request Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "role": "student"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c89",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "student"
  }
}
```

```
PUT /admin/users/:userId
```

Updates a user.

**Request Body:**

```json
{
  "name": "Jane Smith",
  "role": "admin"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c89",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "admin"
  }
}
```

```
DELETE /admin/users/:userId
```

Deletes a user.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "User deleted successfully"
  }
}
```

### Question Bank Management

```
GET /admin/questions
```

Returns a list of questions.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `topic`: Filter by topic (optional)
- `difficulty`: Filter by difficulty (optional)
- `search`: Search by question text (optional)

**Response:**

```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "_id": "60d21b4667d0d8992e610c86",
        "questionText": "What is the capital of France?",
        "options": ["London", "Berlin", "Paris", "Madrid"],
        "correctAnswer": "Paris",
        "topic": "Geography",
        "difficulty": "easy"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 50,
      "totalQuestions": 500
    }
  }
}
```

```
POST /admin/questions
```

Creates a new question.

**Request Body:**

```json
{
  "questionText": "What is the largest planet in our solar system?",
  "options": ["Earth", "Mars", "Jupiter", "Venus"],
  "correctAnswer": "Jupiter",
  "topic": "Science",
  "difficulty": "medium",
  "explanation": "Jupiter is the largest planet in our solar system."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c90",
    "questionText": "What is the largest planet in our solar system?",
    "options": ["Earth", "Mars", "Jupiter", "Venus"],
    "correctAnswer": "Jupiter",
    "topic": "Science",
    "difficulty": "medium",
    "explanation": "Jupiter is the largest planet in our solar system."
  }
}
```

```
PUT /admin/questions/:questionId
```

Updates a question.

**Request Body:**

```json
{
  "options": ["Earth", "Mars", "Jupiter", "Saturn"],
  "difficulty": "hard"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c90",
    "questionText": "What is the largest planet in our solar system?",
    "options": ["Earth", "Mars", "Jupiter", "Saturn"],
    "correctAnswer": "Jupiter",
    "topic": "Science",
    "difficulty": "hard",
    "explanation": "Jupiter is the largest planet in our solar system."
  }
}
```

```
DELETE /admin/questions/:questionId
```

Deletes a question.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Question deleted successfully"
  }
}
```

### Exam Management

```
GET /admin/exams
```

Returns a list of exams.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "title": "Midterm Exam",
      "description": "Comprehensive midterm examination",
      "durationInMinutes": 120,
      "questionsCount": 20,
      "assignedStudentsCount": 45,
      "startTime": "2023-06-15T10:00:00Z",
      "endTime": "2023-06-15T12:00:00Z"
    }
  ]
}
```

```
POST /admin/exams
```

Creates a new exam.

**Request Body:**

```json
{
  "title": "Final Exam",
  "description": "Comprehensive final examination",
  "durationInMinutes": 180,
  "questions": ["60d21b4667d0d8992e610c86", "60d21b4667d0d8992e610c90"],
  "startTime": "2023-07-15T10:00:00Z",
  "endTime": "2023-07-15T13:00:00Z",
  "settings": {
    "shuffleQuestions": true,
    "shuffleOptions": true,
    "showResults": true,
    "allowReview": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c95",
    "title": "Final Exam",
    "description": "Comprehensive final examination",
    "durationInMinutes": 180,
    "questions": ["60d21b4667d0d8992e610c86", "60d21b4667d0d8992e610c90"],
    "startTime": "2023-07-15T10:00:00Z",
    "endTime": "2023-07-15T13:00:00Z",
    "settings": {
      "shuffleQuestions": true,
      "shuffleOptions": true,
      "showResults": true,
      "allowReview": true
    }
  }
}
```

```
PUT /admin/exams/:examId
```

Updates an exam.

**Request Body:**

```json
{
  "title": "Updated Final Exam",
  "durationInMinutes": 150
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c95",
    "title": "Updated Final Exam",
    "description": "Comprehensive final examination",
    "durationInMinutes": 150,
    "questions": ["60d21b4667d0d8992e610c86", "60d21b4667d0d8992e610c90"],
    "startTime": "2023-07-15T10:00:00Z",
    "endTime": "2023-07-15T13:00:00Z",
    "settings": {
      "shuffleQuestions": true,
      "shuffleOptions": true,
      "showResults": true,
      "allowReview": true
    }
  }
}
```

```
PUT /admin/exams/:examId/assign
```

Assigns an exam to students.

**Request Body:**

```json
{
  "assignedTo": ["60d21b4667d0d8992e610c85", "60d21b4667d0d8992e610c89"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c95",
    "title": "Updated Final Exam",
    "assignedTo": ["60d21b4667d0d8992e610c85", "60d21b4667d0d8992e610c89"]
  }
}
```

```
DELETE /admin/exams/:examId
```

Deletes an exam.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Exam deleted successfully"
  }
}
```

### Analytics

```
GET /admin/analytics/:examId
```

Returns detailed analytics for an exam.

**Response:**

```json
{
  "success": true,
  "data": {
    "examStats": {
      "title": "Midterm Exam",
      "totalSubmissions": 45,
      "averageScore": 78.5,
      "highestScore": 100,
      "lowestScore": 45,
      "medianScore": 82,
      "completionRate": 90
    },
    "questionAnalysis": [
      {
        "questionId": "60d21b4667d0d8992e610c86",
        "questionText": "What is the capital of France?",
        "correctCount": 42,
        "incorrectCount": 3,
        "difficultyScore": 0.07
      }
    ],
    "studentPerformance": [
      {
        "studentId": "60d21b4667d0d8992e610c85",
        "studentName": "John Doe",
        "score": 18,
        "percentage": 90,
        "submittedAt": "2023-06-15T11:05:00Z",
        "timeSpent": 65
      }
    ]
  }
}
```

## AI Practice Zone API Endpoints

### Generate Questions from Text

```
POST /ai/generate-from-text
```

Generates practice questions from text input.

**Request Body:**

```json
{
  "text": "JavaScript is a programming language...",
  "questionCount": 3,
  "difficulty": "medium",
  "topic": "Programming"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "practice_123456789",
    "questions": [
      {
        "id": 1,
        "question": "What is JavaScript?",
        "options": {
          "A": "A programming language",
          "B": "A markup language",
          "C": "A database",
          "D": "An operating system"
        },
        "correctAnswer": "A",
        "explanation": "JavaScript is a programming language used for web development.",
        "difficulty": "easy",
        "topic": "Programming"
      }
    ],
    "metadata": {
      "textStats": {
        "charCount": 500,
        "wordCount": 100
      }
    },
    "expiresAt": "2023-06-15T12:00:00Z"
  }
}
```

### Generate Questions from File

```
POST /ai/upload-and-generate
```

Generates practice questions from an uploaded file.

**Request:**

Multipart form data with:

- `document`: File (PDF, TXT, DOCX)
- `questionCount`: Number of questions
- `difficulty`: Difficulty level
- `topic`: Topic (optional)

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "practice_123456789",
    "questions": [
      {
        "id": 1,
        "question": "What is JavaScript?",
        "options": {
          "A": "A programming language",
          "B": "A markup language",
          "C": "A database",
          "D": "An operating system"
        },
        "correctAnswer": "A",
        "explanation": "JavaScript is a programming language used for web development.",
        "difficulty": "easy",
        "topic": "Programming"
      }
    ],
    "metadata": {
      "fileInfo": {
        "originalName": "javascript.pdf",
        "size": 12345,
        "mimeType": "application/pdf"
      },
      "textStats": {
        "charCount": 500,
        "wordCount": 100
      }
    },
    "expiresAt": "2023-06-15T12:00:00Z"
  }
}
```

### Get Practice Session

```
GET /ai/session/:sessionId
```

Returns details of a practice session.

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "practice_123456789",
    "questions": [
      {
        "id": 1,
        "question": "What is JavaScript?",
        "options": {
          "A": "A programming language",
          "B": "A markup language",
          "C": "A database",
          "D": "An operating system"
        },
        "correctAnswer": "A",
        "explanation": "JavaScript is a programming language used for web development.",
        "difficulty": "easy",
        "topic": "Programming"
      }
    ],
    "metadata": {
      "textStats": {
        "charCount": 500,
        "wordCount": 100
      }
    },
    "createdAt": "2023-06-15T10:00:00Z",
    "expiresAt": "2023-06-15T12:00:00Z",
    "isActive": true
  }
}
```

### Submit Practice Session Answers

```
POST /ai/session/:sessionId/submit
```

Submits answers for a practice session.

**Request Body:**

```json
{
  "answers": {
    "1": "A",
    "2": "B"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "practice_123456789",
    "results": {
      "totalQuestions": 2,
      "correctAnswers": 1,
      "incorrectAnswers": 1,
      "percentage": 50,
      "grade": "C",
      "questionResults": [
        {
          "id": 1,
          "question": "What is JavaScript?",
          "userAnswer": "A",
          "correctAnswer": "A",
          "isCorrect": true,
          "explanation": "JavaScript is a programming language used for web development."
        },
        {
          "id": 2,
          "question": "What does HTML stand for?",
          "userAnswer": "B",
          "correctAnswer": "A",
          "isCorrect": false,
          "explanation": "HTML stands for HyperText Markup Language."
        }
      ]
    },
    "submittedAt": "2023-06-15T11:00:00Z"
  }
}
```

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message",
    "details": "Technical details for debugging",
    "timestamp": "2023-06-15T10:00:00Z"
  }
}
```

Common error codes:

- `VALIDATION_ERROR`: Invalid request data
- `AUTHENTICATION_ERROR`: Authentication failed
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `SERVER_ERROR`: Internal server error

## Rate Limiting

API requests are subject to rate limiting to prevent abuse. The current limits are:

- 100 requests per 15-minute window for authenticated users
- 30 requests per 15-minute window for unauthenticated users

When rate limited, the API will respond with a 429 Too Many Requests status code and the following response:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "details": "Rate limit of 100 requests per 15 minutes exceeded",
    "timestamp": "2023-06-15T10:00:00Z"
  }
}
```

The response will include the following headers:

- `X-RateLimit-Limit`: The maximum number of requests allowed in the window
- `X-RateLimit-Remaining`: The number of requests remaining in the current window
- `X-RateLimit-Reset`: The time at which the current rate limit window resets in UTC epoch seconds
