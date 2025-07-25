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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Badge,
  LinearProgress,
} from "@mui/material";
import {
  Schedule,
  Timer,
  Quiz,
  PlayArrow,
  CheckCircle,
  Warning,
  Search,
  Assignment,
  AccessTime,
  Person,
  CalendarToday,
  School as SchoolIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { studentService } from "../../services/studentService";
import { formatDate, formatDuration } from "../../utils";

const ExamList = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await studentService.getExams();
      if (response.success) {
        setExams(response.data.exams || []);
        console.log("Fetched exams:", response.data.exams); // Debug log
      } else {
        console.error("Failed to fetch exams:", response.error); // Debug log
        // For now, show empty state instead of error to prevent confusion
        setExams([]);
        setError(null);
      }
    } catch (err) {
      console.error("Exam fetch error:", err); // Debug log
      // For now, show empty state instead of error to prevent confusion
      setExams([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (examId) => {
    navigate(`/student/exam/${examId}`);
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);

    if (now < startTime) {
      return {
        status: "upcoming",
        color: "info",
        label: "Upcoming",
        icon: <Schedule />,
      };
    } else if (now > endTime) {
      return {
        status: "completed",
        color: "default",
        label: "Completed",
        icon: <CheckCircle />,
      };
    } else {
      return {
        status: "active",
        color: "success",
        label: "Active",
        icon: <PlayArrow />,
      };
    }
  };

  const isExamAvailable = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    return now >= startTime && now <= endTime;
  };

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || getExamStatus(exam).status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
            backdropFilter: "blur(10px)",
            borderRadius: 3,
            p: 4,
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                mr: 2,
                width: 48,
                height: 48,
                background: "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
              }}
            >
              <Assignment />
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: "bold",
                  background:
                    "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 1,
                }}
              >
                My Exams
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                }}
              >
                View and take your assigned examinations
              </Typography>
            </Box>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
            backdropFilter: "blur(10px)",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "primary.main" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.8)",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Filter by Status"
                  sx={{
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.8)",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <MenuItem value="all">All Exams</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                fullWidth
                onClick={fetchExams}
                startIcon={<Schedule />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  background:
                    "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
                  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #1565c0 30%, #1976d2 90%)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 16px rgba(25, 118, 210, 0.4)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Exams Grid */}
        {(filteredExams || []).length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: "center",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
              backdropFilter: "blur(10px)",
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: "auto",
                mb: 3,
                bgcolor: "rgba(25, 118, 210, 0.1)",
                color: "primary.main",
              }}
            >
              <Assignment sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: "text.primary",
                mb: 2,
              }}
            >
              No exams found
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                maxWidth: 400,
                mx: "auto",
              }}
            >
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria to find more exams."
                : "You don't have any exams assigned yet. Check back later or contact your instructor."}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {(filteredExams || []).map((exam) => {
              const examStatus = getExamStatus(exam);
              const isAvailable = isExamAvailable(exam);

              return (
                <Grid item xs={12} md={6} lg={4} key={exam._id}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                      backdropFilter: "blur(10px)",
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.2)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                      transition: "all 0.3s ease",
                      position: "relative",
                      overflow: "hidden",
                      "&:hover": {
                        transform: "translateY(-8px)",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background:
                          examStatus.status === "active"
                            ? "linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)"
                            : examStatus.status === "upcoming"
                            ? "linear-gradient(45deg, #2196f3 30%, #42a5f5 90%)"
                            : "linear-gradient(45deg, #9e9e9e 30%, #bdbdbd 90%)",
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      {/* Status Chip */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 3,
                        }}
                      >
                        <Chip
                          icon={examStatus.icon}
                          label={examStatus.label}
                          sx={{
                            bgcolor:
                              examStatus.status === "active"
                                ? "rgba(76, 175, 80, 0.1)"
                                : examStatus.status === "upcoming"
                                ? "rgba(33, 150, 243, 0.1)"
                                : "rgba(158, 158, 158, 0.1)",
                            color:
                              examStatus.status === "active"
                                ? "#4caf50"
                                : examStatus.status === "upcoming"
                                ? "#2196f3"
                                : "#9e9e9e",
                            border: `1px solid ${
                              examStatus.status === "active"
                                ? "#4caf50"
                                : examStatus.status === "upcoming"
                                ? "#2196f3"
                                : "#9e9e9e"
                            }`,
                            fontWeight: 600,
                          }}
                          size="small"
                        />
                        <Chip
                          icon={<Quiz />}
                          label={`${exam.questionsCount} questions`}
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: "primary.main",
                            color: "primary.main",
                            bgcolor: "rgba(25, 118, 210, 0.05)",
                          }}
                        />
                      </Box>

                      {/* Exam Title */}
                      <Typography
                        variant="h5"
                        component="h2"
                        gutterBottom
                        sx={{
                          fontWeight: "bold",
                          color: "text.primary",
                          mb: 2,
                        }}
                      >
                        {exam.title}
                      </Typography>

                      {/* Description */}
                      <Typography
                        variant="body1"
                        sx={{
                          mb: 3,
                          color: "text.secondary",
                          lineHeight: 1.6,
                        }}
                      >
                        {exam.description}
                      </Typography>

                      {/* Exam Details */}
                      <List
                        dense
                        sx={{
                          bgcolor: "rgba(25, 118, 210, 0.03)",
                          borderRadius: 2,
                          p: 1,
                        }}
                      >
                        <ListItem sx={{ px: 2, py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "rgba(255, 193, 7, 0.1)",
                                color: "#ff9800",
                              }}
                            >
                              <Timer fontSize="small" />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: "text.primary" }}
                              >
                                Duration
                              </Typography>
                            }
                            secondary={
                              <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                              >
                                {formatDuration(exam.durationInMinutes)}
                              </Typography>
                            }
                          />
                        </ListItem>

                        <ListItem sx={{ px: 2, py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "rgba(76, 175, 80, 0.1)",
                                color: "#4caf50",
                              }}
                            >
                              <CalendarToday fontSize="small" />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: "text.primary" }}
                              >
                                Available
                              </Typography>
                            }
                            secondary={
                              <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                              >
                                {`${formatDate(exam.startTime)} - ${formatDate(
                                  exam.endTime
                                )}`}
                              </Typography>
                            }
                          />
                        </ListItem>

                        <ListItem sx={{ px: 2, py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "rgba(25, 118, 210, 0.1)",
                                color: "primary.main",
                              }}
                            >
                              <Person fontSize="small" />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: "text.primary" }}
                              >
                                Instructor
                              </Typography>
                            }
                            secondary={
                              <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                              >
                                {exam.instructor}
                              </Typography>
                            }
                          />
                        </ListItem>
                      </List>
                    </CardContent>

                    <CardActions sx={{ p: 3, pt: 0 }}>
                      {isAvailable ? (
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<PlayArrow />}
                          onClick={() => handleStartExam(exam._id)}
                          sx={{
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            background:
                              "linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)",
                            boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
                            "&:hover": {
                              background:
                                "linear-gradient(45deg, #388e3c 30%, #4caf50 90%)",
                              transform: "translateY(-2px)",
                              boxShadow: "0 6px 16px rgba(76, 175, 80, 0.4)",
                            },
                            transition: "all 0.3s ease",
                          }}
                        >
                          Start Exam
                        </Button>
                      ) : examStatus.status === "upcoming" ? (
                        <Button
                          variant="outlined"
                          fullWidth
                          disabled
                          startIcon={<AccessTime />}
                          sx={{
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            borderColor: "rgba(0,0,0,0.12)",
                            color: "rgba(0,0,0,0.26)",
                          }}
                        >
                          Not Available Yet
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          fullWidth
                          disabled
                          startIcon={<CheckCircle />}
                          sx={{
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            borderColor: "rgba(0,0,0,0.12)",
                            color: "rgba(0,0,0,0.26)",
                          }}
                        >
                          Completed
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default ExamList;
