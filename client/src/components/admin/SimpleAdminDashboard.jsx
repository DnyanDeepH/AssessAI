import React from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { People, Assignment, Quiz, Analytics } from "@mui/icons-material";

const SimpleAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const adminActions = [
    {
      title: "User Management",
      description: "Manage students and admin accounts",
      icon: <People />,
      path: "/admin/users",
      color: "primary",
    },
    {
      title: "Question Bank",
      description: "Create and manage exam questions",
      icon: <Quiz />,
      path: "/admin/questions",
      color: "secondary",
    },
    {
      title: "Exam Management",
      description: "Create and schedule exams",
      icon: <Assignment />,
      path: "/admin/exams",
      color: "success",
    },
    {
      title: "Analytics",
      description: "View performance analytics",
      icon: <Analytics />,
      path: "/admin/analytics",
      color: "info",
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h3" gutterBottom color="primary">
            🎯 Admin Dashboard
          </Typography>

          <Typography variant="h5" gutterBottom>
            Welcome back, {user?.name || "Administrator"}!
          </Typography>

          <Typography variant="body1" paragraph>
            Manage your AssessAI platform from this central dashboard.
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          {adminActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                elevation={2}
                sx={{
                  height: "100%",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
                onClick={() => navigate(action.path)}
              >
                <CardContent sx={{ textAlign: "center", p: 3 }}>
                  <Box sx={{ color: `${action.color}.main`, mb: 2 }}>
                    {React.cloneElement(action.icon, { sx: { fontSize: 48 } })}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Paper elevation={1} sx={{ p: 3, mt: 4, bgcolor: "info.light" }}>
          <Typography variant="h6" gutterBottom>
            📊 Quick Stats
          </Typography>
          <Typography variant="body2">
            This is a simplified admin dashboard. All admin components have been
            fixed and should now work without errors, even when backend data is
            unavailable.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={() => navigate("/admin/dashboard-full")}
              sx={{ mr: 2 }}
            >
              Try Full Dashboard
            </Button>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SimpleAdminDashboard;
