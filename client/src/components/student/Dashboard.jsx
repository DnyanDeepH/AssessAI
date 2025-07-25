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
  LinearProgress,
  Badge,
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
  School as SchoolIcon,
  Dashboard as DashboardIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
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
    let isMounted = true; // Flag to prevent state updates if component unmounts

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard data and exams in parallel
        const [dashboardResponse, examsResponse] = await Promise.all([
          studentService.getDashboard(),
          studentService.getExams(),
        ]);

        // Only update state if component is still mounted
        if (isMounted) {
          if (dashboardResponse.success) {
            setDashboardData(dashboardResponse.data);
          } else {
            setError(dashboardResponse.error.message);
          }

          if (examsResponse.success) {
            const allExams = examsResponse.data.exams || [];
            console.log("All exams fetched:", allExams); // Debug log

            // Filter for upcoming exams
            const upcoming = allExams.filter((exam) => {
              if (!exam.scheduledFor) return false;
              const examDate = new Date(exam.scheduledFor);
              const now = new Date();
              return examDate > now;
            });

            setUpcomingExams(upcoming);
          }

          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Dashboard data fetch error:", err);
          setError("Failed to load dashboard data");
          setLoading(false);
        }
      }
    };

    loadData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once

  // Helper function to refresh dashboard data (can be called manually if needed)
  const refreshDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboardResponse, examsResponse] = await Promise.all([
        studentService.getDashboard(),
        studentService.getExams(),
      ]);

      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.data);
      } else {
        setError(dashboardResponse.error.message);
      }

      if (examsResponse.success) {
        const allExams = examsResponse.data.exams || [];
        const now = new Date();
        const upcoming = allExams.filter((exam) => {
          const endTime = new Date(exam.endTime);
          return endTime > now;
        });
        setUpcomingExams(upcoming);
      }
    } catch (err) {
      console.error("Dashboard refresh error:", err);
      setError("Failed to refresh dashboard data");
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
          elevation={8}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 4,
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              position: "relative",
              zIndex: 1,
            }}
          >
            <Avatar
              sx={{
                bgcolor: "white",
                color: "primary.main",
                width: 72,
                height: 72,
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            >
              <DashboardIcon fontSize="large" />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  mb: 1,
                  fontWeight: "bold",
                  textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                Welcome back, {user?.name}! 👋
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  opacity: 0.9,
                  fontWeight: 400,
                }}
              >
                Ready to continue your learning journey?
              </Typography>
              <Chip
                icon={<SchoolIcon />}
                label="Student Portal"
                sx={{
                  mt: 2,
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<SpeedIcon />}
              sx={{
                bgcolor: "white",
                color: "primary.main",
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                "&:hover": {
                  bgcolor: "grey.100",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease-in-out",
              }}
              onClick={() => {
                fetchDashboardData();
                fetchUpcomingExams();
              }}
            >
              Refresh Dashboard
            </Button>
          </Box>

          {/* Decorative Background Elements */}
          <Box
            sx={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.1)",
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -30,
              left: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,0.05)",
              zIndex: 0,
            }}
          />
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={6}
              sx={{
                borderRadius: 4,
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: "0 12px 24px rgba(25, 118, 210, 0.15)",
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
                    mx: "auto",
                    mb: 2,
                    width: 64,
                    height: 64,
                    boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                  }}
                >
                  <Schedule fontSize="large" />
                </Avatar>
                <Typography
                  variant="h3"
                  component="div"
                  color="primary"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  {dashboardData?.upcomingExamsCount || 0}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Upcoming Exams
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={75}
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    height: 6,
                    bgcolor: "primary.light",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 2,
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={6}
              sx={{
                borderRadius: 4,
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: "0 12px 24px rgba(46, 125, 50, 0.15)",
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: "linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)",
                    mx: "auto",
                    mb: 2,
                    width: 64,
                    height: 64,
                    boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)",
                  }}
                >
                  <Assessment fontSize="large" />
                </Avatar>
                <Typography
                  variant="h3"
                  component="div"
                  color="success.main"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  {dashboardData?.completedExamsCount || 0}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Completed Exams
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={85}
                  color="success"
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    height: 6,
                    bgcolor: "success.light",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 2,
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={6}
              sx={{
                borderRadius: 4,
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: "0 12px 24px rgba(245, 124, 0, 0.15)",
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
                    mx: "auto",
                    mb: 2,
                    width: 64,
                    height: 64,
                    boxShadow: "0 4px 12px rgba(245, 124, 0, 0.3)",
                  }}
                >
                  <TrendingUp fontSize="large" />
                </Avatar>
                <Typography
                  variant="h3"
                  component="div"
                  color="warning.main"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  {dashboardData?.averageScore
                    ? `${dashboardData.averageScore}%`
                    : "N/A"}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Average Score
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={dashboardData?.averageScore || 0}
                  color="warning"
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    height: 6,
                    bgcolor: "warning.light",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 2,
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={6}
              sx={{
                borderRadius: 4,
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: "0 12px 24px rgba(2, 136, 209, 0.15)",
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: "linear-gradient(45deg, #0288d1 30%, #03a9f4 90%)",
                    mx: "auto",
                    mb: 2,
                    width: 64,
                    height: 64,
                    boxShadow: "0 4px 12px rgba(2, 136, 209, 0.3)",
                  }}
                >
                  <TrophyIcon fontSize="large" />
                </Avatar>
                <Typography
                  variant="h3"
                  component="div"
                  color="info.main"
                  sx={{ fontWeight: "bold", mb: 1 }}
                >
                  {dashboardData?.lastExamScore
                    ? `${dashboardData.lastExamScore}%`
                    : "N/A"}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontWeight: 500 }}
                >
                  Last Exam Score
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={dashboardData?.lastExamScore || 0}
                  color="info"
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    height: 6,
                    bgcolor: "info.light",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 2,
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Upcoming Exams */}
          <Grid item xs={12} md={8}>
            <Card
              elevation={8}
              sx={{
                borderRadius: 4,
                background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      mr: 2,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <Assignment />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{ fontWeight: "bold", color: "primary.main" }}
                    >
                      Upcoming Exams
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your scheduled assessments
                    </Typography>
                  </Box>
                  <Badge badgeContent={upcomingExams.length} color="primary">
                    <StarIcon color="action" />
                  </Badge>
                </Box>
                <Divider sx={{ mb: 3 }} />

                {upcomingExams.length === 0 ? (
                  <Paper
                    elevation={2}
                    sx={{
                      textAlign: "center",
                      py: 6,
                      borderRadius: 3,
                      background:
                        "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: "info.main",
                        width: 64,
                        height: 64,
                        mx: "auto",
                        mb: 2,
                      }}
                    >
                      <Schedule fontSize="large" />
                    </Avatar>
                    <Typography
                      variant="h6"
                      color="info.main"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      No upcoming exams at the moment
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ mb: 3 }}
                    >
                      Enjoy your free time and keep practicing!
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Psychology />}
                      onClick={() => navigate("/student/practice")}
                      sx={{
                        borderRadius: 3,
                        textTransform: "none",
                        fontWeight: 600,
                        px: 4,
                      }}
                    >
                      Try AI Practice Zone
                    </Button>
                  </Paper>
                ) : (
                  <List sx={{ p: 0 }}>
                    {upcomingExams.map((exam, index) => {
                      const examStatus = getExamStatus(exam);
                      const isAvailable = isExamAvailable(exam);

                      return (
                        <React.Fragment key={exam._id}>
                          <Paper
                            elevation={2}
                            sx={{
                              p: 3,
                              mb: 2,
                              borderRadius: 3,
                              border: isAvailable ? "2px solid" : "1px solid",
                              borderColor: isAvailable
                                ? "success.main"
                                : "divider",
                              transition: "all 0.3s ease-in-out",
                              "&:hover": {
                                transform: "translateX(8px)",
                                boxShadow: 6,
                              },
                            }}
                          >
                            <ListItem
                              sx={{
                                p: 0,
                                flexDirection: { xs: "column", sm: "row" },
                                alignItems: { xs: "flex-start", sm: "center" },
                                gap: 2,
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: "auto" }}>
                                <Avatar
                                  sx={{
                                    bgcolor:
                                      examStatus.color === "success"
                                        ? "success.main"
                                        : examStatus.color === "error"
                                        ? "error.main"
                                        : "info.main",
                                    width: 48,
                                    height: 48,
                                  }}
                                >
                                  <Timer fontSize="large" />
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 2,
                                      flexWrap: "wrap",
                                      mb: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="h6"
                                      component="span"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {exam.title}
                                    </Typography>
                                    <Chip
                                      label={examStatus.label}
                                      color={examStatus.color}
                                      size="small"
                                      sx={{ fontWeight: 600 }}
                                    />
                                    {isAvailable && (
                                      <Chip
                                        icon={<PlayArrow />}
                                        label="Ready to Start"
                                        color="success"
                                        variant="outlined"
                                        size="small"
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <Box sx={{ mt: 1 }}>
                                    <Grid container spacing={2} sx={{ mb: 1 }}>
                                      <Grid item xs={12} sm={6}>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                          }}
                                        >
                                          <Timer
                                            sx={{
                                              fontSize: 16,
                                              mr: 1,
                                              color: "text.secondary",
                                            }}
                                          />
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            Duration:{" "}
                                            {formatDuration(
                                              exam.durationInMinutes
                                            )}
                                          </Typography>
                                        </Box>
                                      </Grid>
                                      <Grid item xs={12} sm={6}>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                          }}
                                        >
                                          <Schedule
                                            sx={{
                                              fontSize: 16,
                                              mr: 1,
                                              color: "text.secondary",
                                            }}
                                          />
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            {formatDate(exam.startTime)}
                                          </Typography>
                                        </Box>
                                      </Grid>
                                    </Grid>
                                    {exam.description && (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                          mt: 1,
                                          fontStyle: "italic",
                                          bgcolor: "grey.50",
                                          p: 1,
                                          borderRadius: 1,
                                        }}
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
                                    color="success"
                                    startIcon={<PlayArrow />}
                                    onClick={() => handleStartExam(exam._id)}
                                    size="large"
                                    sx={{
                                      borderRadius: 3,
                                      textTransform: "none",
                                      fontWeight: 600,
                                      px: 3,
                                      background:
                                        "linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)",
                                      boxShadow:
                                        "0 3px 8px rgba(46, 125, 50, 0.3)",
                                      "&:hover": {
                                        background:
                                          "linear-gradient(45deg, #1b5e20 30%, #2e7d32 90%)",
                                      },
                                    }}
                                  >
                                    Start Exam
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outlined"
                                    disabled
                                    startIcon={<Warning />}
                                    size="large"
                                    sx={{
                                      borderRadius: 3,
                                      textTransform: "none",
                                      fontWeight: 600,
                                      px: 3,
                                    }}
                                  >
                                    {examStatus.status === "upcoming"
                                      ? "Not Available"
                                      : "Expired"}
                                  </Button>
                                )}
                              </Box>
                            </ListItem>
                          </Paper>
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
            <Card
              elevation={8}
              sx={{
                borderRadius: 4,
                background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: "success.main",
                      mr: 2,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <SpeedIcon />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{ fontWeight: "bold", color: "success.main" }}
                    >
                      Quick Actions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Explore your learning tools
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Psychology />}
                    onClick={() => navigate("/student/practice")}
                    sx={{
                      justifyContent: "flex-start",
                      py: 2,
                      borderRadius: 3,
                      textTransform: "none",
                      fontWeight: 600,
                      background:
                        "linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)",
                      boxShadow: "0 3px 8px rgba(46, 125, 50, 0.3)",
                      "&:hover": {
                        background:
                          "linear-gradient(45deg, #1b5e20 30%, #2e7d32 90%)",
                        transform: "translateY(-2px)",
                      },
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    AI Practice Zone
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Assessment />}
                    onClick={() => navigate("/student/results")}
                    sx={{
                      justifyContent: "flex-start",
                      py: 2,
                      borderRadius: 3,
                      textTransform: "none",
                      fontWeight: 600,
                      borderWidth: 2,
                      "&:hover": {
                        borderWidth: 2,
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
                      },
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    View Results
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Schedule />}
                    onClick={() => navigate("/student/exams")}
                    sx={{
                      justifyContent: "flex-start",
                      py: 2,
                      borderRadius: 3,
                      textTransform: "none",
                      fontWeight: 600,
                      borderWidth: 2,
                      "&:hover": {
                        borderWidth: 2,
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
                      },
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    All Exams
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Person />}
                    onClick={() => navigate("/student/profile")}
                    sx={{
                      justifyContent: "flex-start",
                      py: 2,
                      borderRadius: 3,
                      textTransform: "none",
                      fontWeight: 600,
                      borderWidth: 2,
                      "&:hover": {
                        borderWidth: 2,
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
                      },
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    My Profile
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Recent Performance */}
            {dashboardData?.recentResults &&
              dashboardData.recentResults.length > 0 && (
                <Card
                  elevation={8}
                  sx={{
                    mt: 3,
                    borderRadius: 4,
                    background:
                      "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <Avatar
                        sx={{
                          bgcolor: "warning.main",
                          mr: 2,
                          width: 48,
                          height: 48,
                        }}
                      >
                        <TimelineIcon />
                      </Avatar>
                      <Box>
                        <Typography
                          variant="h6"
                          component="h2"
                          sx={{ fontWeight: "bold", color: "warning.main" }}
                        >
                          Recent Performance
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Your latest achievements
                        </Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    <List dense sx={{ p: 0 }}>
                      {dashboardData.recentResults
                        .slice(0, 3)
                        .map((result, index) => (
                          <Paper
                            key={result._id}
                            elevation={2}
                            sx={{
                              p: 2,
                              mb: index < 2 ? 2 : 0,
                              borderRadius: 2,
                              transition: "all 0.3s ease-in-out",
                              "&:hover": {
                                transform: "translateX(4px)",
                                boxShadow: 4,
                              },
                            }}
                          >
                            <ListItem sx={{ px: 0 }}>
                              <ListItemText
                                primary={
                                  <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 600 }}
                                  >
                                    {result.examTitle}
                                  </Typography>
                                }
                                secondary={
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      mt: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {formatDate(result.submittedAt)}
                                    </Typography>
                                    <Chip
                                      icon={
                                        result.percentage >= 70 ? (
                                          <TrophyIcon />
                                        ) : (
                                          <StarIcon />
                                        )
                                      }
                                      label={`${result.percentage}%`}
                                      color={
                                        result.percentage >= 70
                                          ? "success"
                                          : result.percentage >= 50
                                          ? "warning"
                                          : "error"
                                      }
                                      size="small"
                                      sx={{ fontWeight: 600 }}
                                    />
                                  </Box>
                                }
                              />
                            </ListItem>
                          </Paper>
                        ))}
                    </List>

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate("/student/results")}
                      sx={{
                        mt: 3,
                        borderRadius: 3,
                        textTransform: "none",
                        fontWeight: 600,
                        py: 1.5,
                        background:
                          "linear-gradient(45deg, #f57c00 30%, #ff9800 90%)",
                        boxShadow: "0 3px 8px rgba(245, 124, 0, 0.3)",
                        "&:hover": {
                          background:
                            "linear-gradient(45deg, #e65100 30%, #f57c00 90%)",
                        },
                      }}
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
