import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Skeleton,
} from "@mui/material";
import {
  People,
  School,
  Quiz,
  Assignment,
  TrendingUp,
  PersonAdd,
  CheckCircle,
  Schedule,
  BarChart,
  Refresh,
  CalendarToday,
  ArrowUpward,
  ArrowDownward,
  Info,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  Area,
  AreaChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { adminService } from "../../services/adminService";

const AdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("30d"); // 7d, 30d, 90d, 1y
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await adminService.getDashboard();
      if (response.success) {
        setDashboardData(response.data);
        setError(null);
        setLastUpdated(new Date());
      } else {
        // Fallback data if API fails
        setDashboardData({
          overview: {
            totalUsers: 0,
            totalStudents: 0,
            totalExams: 0,
            totalQuestions: 0,
            activeUsers: 0,
            activeExams: 0,
          },
          recentActivity: { newUsersThisMonth: 0 },
          recentUsers: [],
          recentExams: [],
          examStats: [],
          trends: {
            userRegistrations: [],
            submissions: [],
          },
          questionDifficultyStats: [],
          topStudents: [],
          performanceMetrics: {},
        });
        setError("Dashboard data unavailable - showing placeholder");
      }
    } catch (err) {
      // Fallback data on error
      setDashboardData({
        overview: {
          totalUsers: 0,
          totalStudents: 0,
          totalExams: 0,
          totalQuestions: 0,
          activeUsers: 0,
          activeExams: 0,
        },
        recentActivity: { newUsersThisMonth: 0 },
        recentUsers: [],
        recentExams: [],
        examStats: [],
        trends: {
          userRegistrations: [],
          submissions: [],
        },
        questionDifficultyStats: [],
        topStudents: [],
        performanceMetrics: {},
      });
      setError("Failed to load dashboard data - showing placeholder");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const analyticsResponse = await adminService.getOverallAnalytics(
        dateRange
      );
      if (analyticsResponse.success && dashboardData) {
        // Merge analytics data with dashboard data
        setDashboardData((prev) => ({
          ...prev,
          trends: analyticsResponse.data.trends || prev.trends,
          performanceMetrics: analyticsResponse.data.performanceMetrics,
        }));
      }
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh every 3 minutes
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (dashboardData) {
      fetchAnalyticsData();
    }
  }, [dateRange, dashboardData?.overview?.totalExams]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleDateRangeChange = (event) => {
    setDateRange(event.target.value);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item}>
                <Skeleton variant="rectangular" height={120} />
              </Grid>
            ))}
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
          </Grid>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  const {
    overview,
    recentActivity,
    recentUsers,
    recentExams,
    examStats,
    trends,
    questionDifficultyStats,
    topStudents,
    performanceMetrics,
  } = dashboardData;

  // Chart colors
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  // Prepare chart data with null checks
  const difficultyData = (questionDifficultyStats || []).map((item) => ({
    name: item._id || "Unknown",
    value: item.count,
  }));

  const userTrendData = (trends?.userRegistrations || []).map((item) => ({
    date: item._id,
    users: item.count,
  }));

  const submissionTrendData = (trends?.submissions || []).map((item) => ({
    date: item._id,
    submissions: item.count,
    averageScore: Math.round(item.averageScore || 0),
  }));

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4" component="h1" color="primary">
            Admin Dashboard
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {refreshing && <CircularProgress size={20} />}
            <Chip
              icon={<TrendingUp />}
              label="Live Data"
              color="success"
              variant="outlined"
              onClick={handleRefresh}
              sx={{ cursor: "pointer" }}
            />
          </Box>
        </Box>

        {/* Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Users
                    </Typography>
                    <Typography variant="h4">{overview.totalUsers}</Typography>
                    <Typography variant="body2" color="success.main">
                      +{recentActivity.newUsersThisMonth} this month
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    <People />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Active Students
                    </Typography>
                    <Typography variant="h4">
                      {overview.totalStudents}
                    </Typography>
                    <Typography variant="body2" color="info.main">
                      {overview.activeUsers} active
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: "info.main" }}>
                    <School />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Exams
                    </Typography>
                    <Typography variant="h4">{overview.totalExams}</Typography>
                    <Typography variant="body2" color="warning.main">
                      {overview.activeExams} active
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: "warning.main" }}>
                    <Assignment />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Questions
                    </Typography>
                    <Typography variant="h4">
                      {overview.totalQuestions}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      Question Bank
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: "success.main" }}>
                    <Quiz />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* User Registration Trend */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                User Registration Trend (Last 30 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ fill: "#8884d8" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Question Difficulty Distribution */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Question Difficulty Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={difficultyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(difficultyData || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Submission Trends */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Exam Submissions & Performance (Last 30 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={submissionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="submissions"
                    fill="#8884d8"
                    name="Submissions"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="averageScore"
                    stroke="#82ca9d"
                    name="Avg Score %"
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Recent Activity and Statistics */}
        <Grid container spacing={3}>
          {/* Recent Users */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Users
              </Typography>
              <List>
                {(recentUsers || []).map((user, index) => (
                  <React.Fragment key={user._id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor:
                              user.role === "admin"
                                ? "error.main"
                                : "primary.main",
                          }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {user.email}
                            </Typography>
                            <Chip
                              label={user.role}
                              size="small"
                              color={
                                user.role === "admin" ? "error" : "primary"
                              }
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < (recentUsers || []).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Top Performing Students */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top Performing Students
              </Typography>
              <List>
                {(topStudents || []).slice(0, 5).map((student, index) => (
                  <React.Fragment key={student._id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "success.main" }}>
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={student.studentName}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              Avg Score: {student.averageScore}%
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Exams: {student.totalExams}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < Math.min((topStudents || []).length, 5) - 1 && (
                      <Divider />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Exam Statistics */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Exam Performance Overview
              </Typography>
              <List>
                {(examStats || []).slice(0, 5).map((exam, index) => (
                  <React.Fragment key={exam._id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "info.main" }}>
                          <BarChart />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={exam.examTitle}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              Submissions: {exam.totalSubmissions}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Avg Score: {exam.averageScore}%
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Completion: {exam.completionRate}%
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < Math.min((examStats || []).length, 5) - 1 && (
                      <Divider />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
