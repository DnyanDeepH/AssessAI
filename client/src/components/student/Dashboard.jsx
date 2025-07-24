import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  Assessment,
  Schedule,
  TrendingUp,
  PlayArrow,
  Psychology,
  Person,
  Assignment,
  Timer,
  CheckCircle,
  Warning,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { studentService } from "../../services/studentService";
import { formatDate, formatDuration, calculatePercentage } from "../../utils";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchUpcomingExams();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await studentService.getDashboard();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.error.message);
      }
    } catch (err) {
      setError("Failed to load dashboard data");
    }
  };

  const fetchUpcomingExams = async () => {
    try {
      // Try to get all exams first, then filter for upcoming ones
      const response = await studentService.getExams();
      if (response.success) {
        const allExams = response.data.exams || [];
        console.log("All exams fetched:", allExams); // Debug log

        // Filter for upcoming exams (exams that haven't ended yet)
        const now = new Date();
        const upcomingExams = allExams.filter((exam) => {
          const endTime = new Date(exam.endTime);
          return endTime > now;
        });

        console.log("Upcoming exams:", upcomingExams); // Debug log
        setUpcomingExams(upcomingExams);
      } else {
        console.error("Failed to fetch exams:", response.error); // Debug log
        setUpcomingExams([]);
        setError(null); // Don't show error, just empty state
      }
    } catch (err) {
      console.error("Exam fetch error:", err); // Debug log
      setUpcomingExams([]);
      setError(null); // Don't show error, just empty state
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (examId) => {
    try {
      const response = await studentService.startExam(examId);
      if (response.success) {
        navigate(`/student/exam/${examId}`);
      } else {
        setError(response.error.message);
      }
    } catch (err) {
      setError("Failed to start exam");
    }
  };

  const isExamAvailable = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    return now >= startTime && now <= endTime;
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    if (now < startTime) {
      return { status: "upcoming", color: "info", label: "Upcoming" };
    } else if (now > endTime) {
      return { status: "expired", color: "error", label: "Expired" };
    } else {
      return { status: "active", color: "success", label: "Active" };
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {/* Welcome Header */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            color: "white",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}
            >
              <Person fontSize="large" />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{ mb: 0.5 }}
              >
                Welcome back, {user?.name}!
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Ready to continue your learning journey?
              </Typography>
            </Box>
            <Button
              variant="outlined"
              sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.5)",
                "&:hover": {
                  borderColor: "white",
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
              onClick={() => {
                fetchDashboardData();
                fetchUpcomingExams();
              }}
            >
              Refresh
            </Button>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar sx={{ bgcolor: "primary.main", mx: "auto", mb: 2 }}>
                  <Schedule />
                </Avatar>
                <Typography variant="h4" component="div" color="primary">
                  {dashboardData?.upcomingExamsCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upcoming Exams
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar sx={{ bgcolor: "success.main", mx: "auto", mb: 2 }}>
                  <Assessment />
                </Avatar>
                <Typography variant="h4" component="div" color="success.main">
                  {dashboardData?.completedExamsCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed Exams
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar sx={{ bgcolor: "warning.main", mx: "auto", mb: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Typography variant="h4" component="div" color="warning.main">
                  {dashboardData?.averageScore
                    ? `${dashboardData.averageScore}%`
                    : "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar sx={{ bgcolor: "info.main", mx: "auto", mb: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Typography variant="h4" component="div" color="info.main">
                  {dashboardData?.lastExamScore
                    ? `${dashboardData.lastExamScore}%`
                    : "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last Exam Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Upcoming Exams */}
          <Grid item xs={12} md={8}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Assignment sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" component="h2">
                    Upcoming Exams
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {upcomingExams.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No upcoming exams at the moment.
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Check back later or contact your instructor.
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {upcomingExams.map((exam, index) => {
                      const examStatus = getExamStatus(exam);
                      const isAvailable = isExamAvailable(exam);

                      return (
                        <React.Fragment key={exam._id}>
                          <ListItem
                            sx={{
                              flexDirection: { xs: "column", sm: "row" },
                              alignItems: { xs: "flex-start", sm: "center" },
                              gap: 2,
                            }}
                          >
                            <ListItemIcon>
                              <Timer color={examStatus.color} />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <Typography
                                    variant="subtitle1"
                                    component="span"
                                  >
                                    {exam.title}
                                  </Typography>
                                  <Chip
                                    label={examStatus.label}
                                    color={examStatus.color}
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Duration:{" "}
                                    {formatDuration(exam.durationInMinutes)}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Available: {formatDate(exam.startTime)} -{" "}
                                    {formatDate(exam.endTime)}
                                  </Typography>
                                  {exam.description && (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ mt: 0.5 }}
                                    >
                                      {exam.description}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <Box
                              sx={{ display: "flex", gap: 1, flexShrink: 0 }}
                            >
                              {isAvailable ? (
                                <Button
                                  variant="contained"
                                  color="primary"
                                  startIcon={<PlayArrow />}
                                  onClick={() => handleStartExam(exam._id)}
                                  size="small"
                                >
                                  Start Exam
                                </Button>
                              ) : (
                                <Button
                                  variant="outlined"
                                  disabled
                                  startIcon={<Warning />}
                                  size="small"
                                >
                                  {examStatus.status === "upcoming"
                                    ? "Not Available"
                                    : "Expired"}
                                </Button>
                              )}
                            </Box>
                          </ListItem>
                          {index < upcomingExams.length - 1 && <Divider />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Quick Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Psychology />}
                    onClick={() => navigate("/student/practice")}
                    sx={{ justifyContent: "flex-start", py: 1.5 }}
                  >
                    AI Practice Zone
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Assessment />}
                    onClick={() => navigate("/student/results")}
                    sx={{ justifyContent: "flex-start", py: 1.5 }}
                  >
                    View Results
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Schedule />}
                    onClick={() => navigate("/student/exams")}
                    sx={{ justifyContent: "flex-start", py: 1.5 }}
                  >
                    All Exams
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Person />}
                    onClick={() => navigate("/student/profile")}
                    sx={{ justifyContent: "flex-start", py: 1.5 }}
                  >
                    My Profile
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Recent Performance */}
            {dashboardData?.recentResults &&
              dashboardData.recentResults.length > 0 && (
                <Card elevation={2} sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom>
                      Recent Performance
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <List dense>
                      {dashboardData.recentResults
                        .slice(0, 3)
                        .map((result, index) => (
                          <ListItem key={result._id} sx={{ px: 0 }}>
                            <ListItemText
                              primary={result.examTitle}
                              secondary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {formatDate(result.submittedAt)}
                                  </Typography>
                                  <Chip
                                    label={`${result.percentage}%`}
                                    color={
                                      result.percentage >= 70
                                        ? "success"
                                        : result.percentage >= 50
                                        ? "warning"
                                        : "error"
                                    }
                                    size="small"
                                  />
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                    </List>

                    <Button
                      variant="text"
                      fullWidth
                      onClick={() => navigate("/student/results")}
                      sx={{ mt: 1 }}
                    >
                      View All Results
                    </Button>
                  </CardContent>
                </Card>
              )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default StudentDashboard;
