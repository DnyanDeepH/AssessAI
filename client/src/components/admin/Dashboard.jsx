import React, { useState, useEffect, useCallback } from "react";
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
  Tooltip,
} from "@mui/material";
import {
  People,
  School,
  Quiz,
  Assignment,
  TrendingUp,
  PersonAdd,
  BarChart,
  AdminPanelSettings as AdminIcon,
  Analytics as AnalyticsIcon,
  Psychology as PsychologyIcon,
  Schedule,
  ArrowUpward,
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
} from "recharts";
import { adminService } from "../../services/adminService";

// --- Centralized Constants ---

// 1. Centralized Style Object for Glassmorphism Effect
const glassCardStyle = {
  background: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(20px)",
  borderRadius: 3,
  border: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: "0 8px 32px rgba(102, 126, 234, 0.1)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 48px rgba(102, 126, 234, 0.15)",
  },
};

// 2. Initial/Fallback Data Structure
const initialDashboardData = {
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
  trends: { userRegistrations: [], submissions: [] },
  questionDifficultyStats: [],
  topStudents: [],
  performanceMetrics: {},
};

// --- Reusable UI Components ---

// 3. Reusable Card for Charts and Lists
const DashboardCard = ({ icon, title, children }) => (
  <Paper sx={{ ...glassCardStyle, p: 3, height: "100%" }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
      <Avatar
        sx={{
          background: "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
          width: 40,
          height: 40,
        }}
      >
        {icon}
      </Avatar>
      <Typography variant="h6" sx={{ color: "white", fontWeight: "bold" }}>
        {title}
      </Typography>
    </Box>
    <Box
      sx={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: 2, p: 2 }}
    >
      {children}
    </Box>
  </Paper>
);

// 4. Reusable Card for Overview Statistics
const StatCard = ({ icon, title, value, subtitle, iconBg }) => (
  <Card sx={{ ...glassCardStyle, "&:hover": { transform: "translateY(-8px)" } }}>
    <CardContent sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            sx={{ color: "rgba(255, 255, 255, 0.8)", fontWeight: 600, mb: 1 }}
          >
            {title}
          </Typography>
          <Typography variant="h4" sx={{ color: "white", fontWeight: "bold" }}>
            {value}
          </Typography>
          {subtitle}
        </Box>
        <Avatar
          sx={{
            background: iconBg,
            width: 60,
            height: 60,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        >
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(initialDashboardData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await adminService.getDashboard();
      if (response.success) {
        setDashboardData(response.data);
        setError(null);
        setLastUpdated(new Date());
      } else {
        setDashboardData(initialDashboardData);
        setError("Dashboard data unavailable - showing placeholder.");
      }
    } catch (err) {
      setDashboardData(initialDashboardData);
      setError("Failed to load dashboard data - showing placeholder.");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Data for rendering the overview cards declaratively
  const overviewCards = [
    {
      title: "Total Users",
      value: dashboardData.overview.totalUsers,
      icon: <People sx={{ fontSize: 28 }} />,
      iconBg: "linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)",
      subtitle: (
        <Typography
          variant="body2"
          sx={{ color: "#4caf50", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <ArrowUpward sx={{ fontSize: 16 }} />+
          {dashboardData.recentActivity.newUsersThisMonth} this month
        </Typography>
      ),
    },
    {
      title: "Active Students",
      value: dashboardData.overview.totalStudents,
      icon: <School sx={{ fontSize: 28 }} />,
      iconBg: "linear-gradient(45deg, #00bcd4 30%, #0097a7 90%)",
      subtitle: (
        <Typography
          variant="body2"
          sx={{ color: "#00bcd4", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <AnalyticsIcon sx={{ fontSize: 16 }} />
          {dashboardData.overview.activeUsers} active now
        </Typography>
      ),
    },
    {
      title: "Total Exams",
      value: dashboardData.overview.totalExams,
      icon: <Assignment sx={{ fontSize: 28 }} />,
      iconBg: "linear-gradient(45deg, #ff9800 30%, #f57c00 90%)",
      subtitle: (
        <Typography
          variant="body2"
          sx={{ color: "#ff9800", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <Schedule sx={{ fontSize: 16 }} />
          {dashboardData.overview.activeExams} active
        </Typography>
      ),
    },
    {
      title: "Total Questions",
      value: dashboardData.overview.totalQuestions,
      icon: <Quiz sx={{ fontSize: 28 }} />,
      iconBg: "linear-gradient(45deg, #4caf50 30%, #388e3c 90%)",
      subtitle: (
         <Typography
          variant="body2"
          sx={{ color: "#4caf50", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <PsychologyIcon sx={{ fontSize: 16 }} />
          Question Bank
        </Typography>
      ),
    },
  ];

  // Chart data preparation with null checks
  const { trends, questionDifficultyStats, topStudents, examStats } = dashboardData;
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  const userTrendData = (trends?.userRegistrations || []).map((item) => ({ date: item._id, users: item.count }));
  const submissionTrendData = (trends?.submissions || []).map((item) => ({
    date: item._id,
    submissions: item.count,
    averageScore: Math.round(item.averageScore || 0),
  }));
  const difficultyData = (questionDifficultyStats || []).map((item) => ({ name: item._id || "Unknown", value: item.count }));

  const chartTooltipStyle = {
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "8px",
    color: "white",
  };

  const listItemStyle = {
    borderRadius: 2,
    mb: 1,
    background: "rgba(255, 255, 255, 0.05)",
    transition: "all 0.3s ease",
    "&:hover": {
      background: "rgba(255, 255, 255, 0.1)",
      transform: "translateX(8px)",
    },
  };

  if (loading) {
    // You could also create a dedicated <DashboardSkeleton /> component
    return <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}><CircularProgress color="inherit" /></Box>;
  }

  if (error) {
    return (
       <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <Alert severity="warning" sx={{...glassCardStyle, color: 'white', '& .MuiAlert-icon': { color: 'white' } }}>{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <Container maxWidth="xl">
        <Box sx={{ py: 4, position: "relative", zIndex: 1 }}>
          {/* Header */}
          <Box sx={{ ...glassCardStyle, p: 3, mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ background: "linear-gradient(45deg, #667eea 30%, #764ba2 90%)", width: 56, height: 56 }}>
                <AdminIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" sx={{ color: "white", fontWeight: "bold" }}>
                  Admin Dashboard
                </Typography>
                <Typography variant="subtitle1" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                  System Overview & Analytics
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {refreshing && <CircularProgress size={20} sx={{ color: "rgba(255, 255, 255, 0.8)" }} />}
              <Tooltip title={`Last updated: ${lastUpdated.toLocaleTimeString()}`}>
                 <Chip icon={<TrendingUp />} label="Live Data" sx={{ background: "rgba(76, 175, 80, 0.2)", backdropFilter: "blur(10px)", color: "white", border: "1px solid rgba(76, 175, 80, 0.3)", fontWeight: 'bold' }} />
              </Tooltip>
            </Box>
          </Box>

          {/* Overview Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {overviewCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <StatCard {...card} />
              </Grid>
            ))}
          </Grid>

          {/* Charts Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={8}>
              <DashboardCard icon={<TrendingUp />} title="User Registration Trend">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" fontSize={12} />
                    <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} />
                    <RechartsTooltip contentStyle={chartTooltipStyle} />
                    <Legend wrapperStyle={{color: 'white'}} />
                    <Line type="monotone" dataKey="users" stroke="#21cbf3" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </DashboardCard>
            </Grid>
            <Grid item xs={12} lg={4}>
              <DashboardCard icon={<PsychologyIcon />} title="Question Difficulty">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={difficultyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {difficultyData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <RechartsTooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </DashboardCard>
            </Grid>
            <Grid item xs={12}>
                <DashboardCard icon={<BarChart />} title="Exam Submissions & Average Score">
                    <ResponsiveContainer width="100%" height={300}>
                         <RechartsBarChart data={submissionTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" fontSize={12} />
                            <YAxis yAxisId="left" stroke="#8884d8" />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                            <RechartsTooltip contentStyle={chartTooltipStyle} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="submissions" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            <Line yAxisId="right" type="monotone" dataKey="averageScore" stroke="#82ca9d" strokeWidth={3} />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </DashboardCard>
            </Grid>
          </Grid>

          {/* Lists Section */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
               <DashboardCard icon={<PersonAdd />} title="Recent Users">
                 <List sx={{ maxHeight: 300, overflow: "auto", p:0 }}>
                    {(recentUsers || []).map((user, index) => (
                      <ListItem key={user._id} sx={listItemStyle}>
                        <ListItemAvatar><Avatar sx={{ bgcolor: user.role === 'admin' ? '#d32f2f' : '#1976d2' }}>{user.name.charAt(0).toUpperCase()}</Avatar></ListItemAvatar>
                        <ListItemText primary={<Typography sx={{ color: 'white', fontWeight: 600 }}>{user.name}</Typography>} secondary={<Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)" }}>{user.email}</Typography>} />
                      </ListItem>
                    ))}
                 </List>
               </DashboardCard>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
               <DashboardCard icon={<TrendingUp />} title="Top Performers">
                 <List sx={{ maxHeight: 300, overflow: "auto", p:0 }}>
                    {(topStudents || []).slice(0, 5).map((student, index) => (
                      <ListItem key={student._id} sx={listItemStyle}>
                        <ListItemAvatar><Avatar sx={{ bgcolor: '#4caf50' }}>{index + 1}</Avatar></ListItemAvatar>
                        <ListItemText primary={<Typography sx={{ color: 'white', fontWeight: 600 }}>{student.studentName}</Typography>} secondary={`Avg Score: ${student.averageScore}% | Exams: ${student.totalExams}`} secondaryTypographyProps={{style: {color: "rgba(255, 255, 255, 0.7)"}}} />
                      </ListItem>
                    ))}
                 </List>
               </DashboardCard>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
               <DashboardCard icon={<Assignment />} title="Exam Overview">
                 <List sx={{ maxHeight: 300, overflow: "auto", p:0 }}>
                    {(examStats || []).slice(0, 5).map((exam) => (
                      <ListItem key={exam._id} sx={listItemStyle}>
                        <ListItemText primary={<Typography sx={{ color: 'white', fontWeight: 600 }}>{exam.examTitle}</Typography>} secondary={`Submissions: ${exam.totalSubmissions} | Avg Score: ${exam.averageScore}%`} secondaryTypographyProps={{style: {color: "rgba(255, 255, 255, 0.7)"}}}/>
                      </ListItem>
                    ))}
                 </List>
               </DashboardCard>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminDashboard;