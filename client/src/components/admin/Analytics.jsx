import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  TrendingUp,
  People,
  Quiz,
  Assessment,
  Schedule,
  CheckCircle,
  Warning,
  Error,
  School,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";
import { adminService } from "../../services/adminService";
import { formatDate, calculatePercentage } from "../../utils";

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("30"); // days
  const [analytics, setAnalytics] = useState({
    overview: {
      totalUsers: 0,
      activeUsers: 0,
      totalExams: 0,
      totalSubmissions: 0,
    },
    examStats: [],
    userActivity: [],
    performanceMetrics: {
      averageScore: 0,
      passRate: 0,
      completionRate: 0,
    },
    recentActivity: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewRes, examStatsRes, userActivityRes, performanceRes] =
        await Promise.all([
          adminService.getOverviewStats(timeRange),
          adminService.getExamStats(timeRange),
          adminService.getUserActivity(timeRange),
          adminService.getPerformanceMetrics(timeRange),
        ]);

      setAnalytics({
        overview: overviewRes.success
          ? overviewRes.data
          : {
              totalUsers: 0,
              activeUsers: 0,
              totalExams: 0,
              totalSubmissions: 0,
            },
        examStats: examStatsRes.success ? examStatsRes.data : [],
        userActivity: userActivityRes.success ? userActivityRes.data : [],
        performanceMetrics: performanceRes.success
          ? performanceRes.data
          : {
              averageScore: 0,
              passRate: 0,
              completionRate: 0,
            },
        recentActivity: [],
      });
    } catch (err) {
      setError("Failed to load analytics data");
      setAnalytics({
        overview: {
          totalUsers: 0,
          activeUsers: 0,
          totalExams: 0,
          totalSubmissions: 0,
        },
        examStats: [],
        userActivity: [],
        performanceMetrics: {
          averageScore: 0,
          passRate: 0,
          completionRate: 0,
        },
        recentActivity: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "exam_completed":
        return <CheckCircle color="success" />;
      case "user_registered":
        return <People color="primary" />;
      case "exam_created":
        return <Quiz color="info" />;
      default:
        return <AnalyticsIcon />;
    }
  };

  const getActivityText = (activity) => {
    switch (activity.type) {
      case "exam_completed":
        return `${activity.user} completed "${activity.exam}" with ${activity.score}% score`;
      case "user_registered":
        return `${activity.user} registered as a new user`;
      case "exam_created":
        return `${activity.user} created exam "${activity.exam}"`;
      default:
        return "Unknown activity";
    }
  };

  if (loading) {
    return (
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
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Time Range"
          >
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 90 days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

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
                  <Typography variant="h4">
                    {(analytics?.overview?.totalUsers || 0).toLocaleString()}
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, color: "primary.main" }} />
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
                    Active Users
                  </Typography>
                  <Typography variant="h4">
                    {(analytics?.overview?.activeUsers || 0).toLocaleString()}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: "success.main" }} />
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
                  <Typography variant="h4">
                    {analytics?.overview?.totalExams || 0}
                  </Typography>
                </Box>
                <Quiz sx={{ fontSize: 40, color: "info.main" }} />
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
                    Submissions
                  </Typography>
                  <Typography variant="h4">
                    {(
                      analytics?.overview?.totalSubmissions || 0
                    ).toLocaleString()}
                  </Typography>
                </Box>
                <Assessment sx={{ fontSize: 40, color: "warning.main" }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Performance Metrics */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Average Score"
                    secondary={`${
                      analytics?.performanceMetrics?.averageScore || 0
                    }%`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Pass Rate"
                    secondary={`${
                      analytics?.performanceMetrics?.passRate || 0
                    }%`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Schedule color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Completion Rate"
                    secondary={`${
                      analytics?.performanceMetrics?.completionRate || 0
                    }%`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Exam Statistics */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Exam Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Exam Name</TableCell>
                      <TableCell align="right">Submissions</TableCell>
                      <TableCell align="right">Avg Score</TableCell>
                      <TableCell align="right">Pass Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(analytics?.examStats || []).map((exam, index) => (
                      <TableRow key={index}>
                        <TableCell>{exam.name}</TableCell>
                        <TableCell align="right">{exam.submissions}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${exam.averageScore}%`}
                            color={
                              exam.averageScore >= 80
                                ? "success"
                                : exam.averageScore >= 60
                                ? "warning"
                                : "error"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${exam.passRate}%`}
                            color={
                              exam.passRate >= 80
                                ? "success"
                                : exam.passRate >= 60
                                ? "warning"
                                : "error"
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                {(analytics?.recentActivity || []).map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        {getActivityIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={getActivityText(activity)}
                        secondary={activity.time}
                      />
                    </ListItem>
                    {index < (analytics?.recentActivity || []).length - 1 && (
                      <Divider />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
