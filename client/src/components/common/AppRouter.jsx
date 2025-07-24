import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Box, Typography, Container, CircularProgress } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import MainNavigation from "./MainNavigation";

// Public Components
import HomePage from "@components/public/HomePage.jsx";
import AboutPage from "@components/public/AboutPage.jsx";
import LoginPage from "@components/public/LoginPage.jsx";
import RegisterPage from "@components/public/RegisterPage.jsx";
import AuthRedirect from "@components/common/AuthRedirect.jsx";
import ErrorBoundary from "@components/common/ErrorBoundary.jsx";

// Student Components
import StudentLayout from "@components/student/StudentLayout.jsx";
import StudentDashboard from "@components/student/Dashboard.jsx";
import ExamList from "@components/student/ExamList.jsx";
import ExamInterface from "@components/student/ExamInterface.jsx";
import AIPracticeZone from "@components/student/AIPracticeZone.jsx";
import StudentProfile from "@components/student/Profile.jsx";
import StudentResults from "@components/student/Results.jsx";

// Admin Components
import AdminLayout from "@components/admin/AdminLayout.jsx";
import AdminDashboard from "@components/admin/Dashboard.jsx";
import SimpleAdminDashboard from "@components/admin/SimpleAdminDashboard.jsx";
import UserManagement from "@components/admin/UserManagement.jsx";
import QuestionBank from "@components/admin/QuestionBank.jsx";
import ExamManagement from "@components/admin/ExamManagement.jsx";
import Analytics from "@components/admin/Analytics.jsx";
import SessionAnalytics from "@components/admin/SessionAnalytics.jsx";

// Layout component with navigation
const Layout = () => {
  return (
    <>
      <MainNavigation />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Outlet />
      </Container>
    </>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading while authentication state is being determined
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Simple fallback component for missing pages
const NotFound = () => (
  <Box sx={{ p: 4, textAlign: "center" }}>
    <Typography variant="h4" gutterBottom>
      404 - Page Not Found
    </Typography>
    <Typography variant="body1" color="text.secondary">
      The page you're looking for doesn't exist.
    </Typography>
  </Box>
);

const AppRouter = () => {
  const { isLoading } = useAuth();

  // Show loading spinner while authentication state is being restored
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <AuthRedirect>
                <HomePage />
              </AuthRedirect>
            }
          />
          <Route
            path="/about"
            element={
              <AuthRedirect>
                <AboutPage />
              </AuthRedirect>
            }
          />
          <Route
            path="/login"
            element={
              <AuthRedirect>
                <LoginPage />
              </AuthRedirect>
            }
          />
          <Route
            path="/register"
            element={
              <AuthRedirect>
                <RegisterPage />
              </AuthRedirect>
            }
          />

          {/* Fallback Routes */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>

        {/* Student Routes - Separate from Layout */}
        <Route
          path="/student"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentLayout>
                <ErrorBoundary>
                  <StudentDashboard />
                </ErrorBoundary>
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exams"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentLayout>
                <ErrorBoundary>
                  <ExamList />
                </ErrorBoundary>
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exam/:id"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentLayout>
                <ErrorBoundary>
                  <ExamInterface />
                </ErrorBoundary>
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/practice"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentLayout>
                <ErrorBoundary>
                  <AIPracticeZone />
                </ErrorBoundary>
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentLayout>
                <ErrorBoundary>
                  <StudentProfile />
                </ErrorBoundary>
              </StudentLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/results"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentLayout>
                <ErrorBoundary>
                  <StudentResults />
                </ErrorBoundary>
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - Separate from Layout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <SimpleAdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard-full"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <ErrorBoundary>
                  <AdminDashboard />
                </ErrorBoundary>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <ErrorBoundary>
                  <UserManagement />
                </ErrorBoundary>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <ErrorBoundary>
                  <QuestionBank />
                </ErrorBoundary>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exams"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <ErrorBoundary>
                  <ExamManagement />
                </ErrorBoundary>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <ErrorBoundary>
                  <Analytics />
                </ErrorBoundary>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sessions"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <ErrorBoundary>
                  <SessionAnalytics />
                </ErrorBoundary>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;
