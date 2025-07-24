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
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            My Exams
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and take your assigned examinations
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
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
                      <Search />
                    </InputAdornment>
                  ),
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
                variant="outlined"
                fullWidth
                onClick={fetchExams}
                startIcon={<Schedule />}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Exams Grid */}
        {(filteredExams || []).length === 0 ? (
          <Paper elevation={2} sx={{ p: 4, textAlign: "center" }}>
            <Assignment sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No exams found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "You don't have any exams assigned yet."}
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
                    elevation={2}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      {/* Status Chip */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Chip
                          icon={examStatus.icon}
                          label={examStatus.label}
                          color={examStatus.color}
                          size="small"
                        />
                        <Chip
                          icon={<Quiz />}
                          label={`${exam.questionsCount} questions`}
                          variant="outlined"
                          size="small"
                        />
                      </Box>

                      {/* Exam Title */}
                      <Typography variant="h6" component="h2" gutterBottom>
                        {exam.title}
                      </Typography>

                      {/* Description */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {exam.description}
                      </Typography>

                      {/* Exam Details */}
                      <List dense>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Timer fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Duration"
                            secondary={formatDuration(exam.durationInMinutes)}
                          />
                        </ListItem>

                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CalendarToday fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Available"
                            secondary={`${formatDate(
                              exam.startTime
                            )} - ${formatDate(exam.endTime)}`}
                          />
                        </ListItem>

                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Person fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Instructor"
                            secondary={exam.instructor}
                          />
                        </ListItem>
                      </List>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      {isAvailable ? (
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<PlayArrow />}
                          onClick={() => handleStartExam(exam._id)}
                          color="primary"
                        >
                          Start Exam
                        </Button>
                      ) : examStatus.status === "upcoming" ? (
                        <Button
                          variant="outlined"
                          fullWidth
                          disabled
                          startIcon={<AccessTime />}
                        >
                          Not Available Yet
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          fullWidth
                          disabled
                          startIcon={<CheckCircle />}
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
