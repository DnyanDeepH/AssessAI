import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  AppBar,
  Toolbar,
} from "@mui/material";
import {
  NavigateNext,
  NavigateBefore,
  AccessTime,
  Save,
  Send,
  Warning,
  CheckCircle,
  RadioButtonUnchecked,
  Flag,
  FlagOutlined,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { studentService } from "../../services/studentService";
import { formatTimeRemaining, storage, CONSTANTS } from "../../utils";

const ExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  // Exam state
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Dialog states
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [timeUpDialogOpen, setTimeUpDialogOpen] = useState(false);
  const [navigationDialogOpen, setNavigationDialogOpen] = useState(false);

  // Refs
  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const examStartTime = useRef(null);

  // Initialize exam
  useEffect(() => {
    initializeExam();

    // Cleanup on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [examId]);

  // Start timer when exam is loaded
  useEffect(() => {
    if (exam && timeRemaining > 0) {
      startTimer();
      startAutoSave();
    }
  }, [exam, timeRemaining]);

  // Auto-submit when time is up
  useEffect(() => {
    if (timeRemaining === 0 && exam) {
      setTimeUpDialogOpen(true);
      handleAutoSubmit();
    }
  }, [timeRemaining]);

  // Prevent page refresh/navigation during exam
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue =
        "Are you sure you want to leave? Your exam progress may be lost.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const initializeExam = async () => {
    try {
      setLoading(true);

      // Check for existing session
      const existingSession = storage.get(CONSTANTS.EXAM_SESSION_KEY);
      if (existingSession && existingSession.examId === examId) {
        // Resume existing session
        setAnswers(existingSession.answers || {});
        setCurrentQuestionIndex(existingSession.currentQuestionIndex || 0);
        setFlaggedQuestions(new Set(existingSession.flaggedQuestions || []));
        examStartTime.current = new Date(existingSession.startTime);
      }

      const response = await studentService.startExam(examId);
      if (response.success) {
        const {
          exam: examData,
          questions: questionsData,
          session,
        } = response.data;
        setExam(examData);
        setQuestions(questionsData);

        // Calculate time remaining
        const startTime = examStartTime.current || new Date(session.startTime);
        const endTime = new Date(
          startTime.getTime() + examData.durationInMinutes * 60 * 1000
        );
        const remaining = Math.max(
          0,
          Math.floor((endTime - new Date()) / 1000)
        );
        setTimeRemaining(remaining);

        if (!examStartTime.current) {
          examStartTime.current = startTime;
        }
      } else {
        setError(response.error.message);
      }
    } catch (err) {
      setError("Failed to load exam");
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startAutoSave = () => {
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);

    autoSaveRef.current = setInterval(() => {
      saveProgress();
    }, CONSTANTS.AUTO_SAVE_INTERVAL);
  };

  const saveProgress = async () => {
    if (!exam || autoSaving) return;

    try {
      setAutoSaving(true);

      // Save to localStorage
      const sessionData = {
        examId,
        answers,
        currentQuestionIndex,
        flaggedQuestions: Array.from(flaggedQuestions),
        startTime: examStartTime.current,
      };
      storage.set(CONSTANTS.EXAM_SESSION_KEY, sessionData);

      // Save to server
      const response = await studentService.saveExamProgress(
        examId,
        answers,
        currentQuestionIndex
      );
      if (response.success) {
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleAnswerChange = (questionId, selectedOption) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption,
    }));
  };

  const handleQuestionNavigation = (index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
      setNavigationDialogOpen(false);
    }
  };

  const handleFlagQuestion = (questionId) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmitExam = async () => {
    try {
      const response = await studentService.submitExam(examId, answers);
      if (response.success) {
        // Clear session data
        storage.remove(CONSTANTS.EXAM_SESSION_KEY);

        // Clear timers
        if (timerRef.current) clearInterval(timerRef.current);
        if (autoSaveRef.current) clearInterval(autoSaveRef.current);

        // Navigate to results
        navigate("/student/results", {
          state: {
            message: "Exam submitted successfully!",
            examId: examId,
          },
        });
      } else {
        setError(response.error.message);
      }
    } catch (err) {
      setError("Failed to submit exam");
    }
    setSubmitDialogOpen(false);
  };

  const handleAutoSubmit = async () => {
    await handleSubmitExam();
  };

  const getQuestionStatus = (index) => {
    const question = questions[index];
    if (!question) return "unanswered";

    const isAnswered = answers[question._id];
    const isFlagged = flaggedQuestions.has(question._id);

    if (isAnswered && isFlagged) return "answered-flagged";
    if (isAnswered) return "answered";
    if (isFlagged) return "flagged";
    return "unanswered";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "answered":
        return "success";
      case "flagged":
        return "warning";
      case "answered-flagged":
        return "info";
      default:
        return "default";
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Typography>Loading exam...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Alert severity="warning">
          Exam not found or no questions available.
        </Alert>
      </Box>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
      {/* Fixed Header */}
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {exam.title}
          </Typography>

          {/* Timer */}
          <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
            <AccessTime
              sx={{
                mr: 1,
                color: timeRemaining < 300 ? "error.main" : "text.secondary",
              }}
            />
            <Typography
              variant="h6"
              color={timeRemaining < 300 ? "error.main" : "text.primary"}
              sx={{ fontFamily: "monospace", minWidth: "80px" }}
            >
              {formatTimeRemaining(timeRemaining)}
            </Typography>
          </Box>

          {/* Auto-save indicator */}
          {autoSaving && (
            <Tooltip title="Auto-saving...">
              <Save sx={{ mr: 2, color: "primary.main" }} />
            </Tooltip>
          )}

          {lastSaved && (
            <Tooltip title={`Last saved: ${lastSaved.toLocaleTimeString()}`}>
              <CheckCircle sx={{ mr: 2, color: "success.main" }} />
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ pt: 8, pb: 2 }}>
        <Box sx={{ maxWidth: "1200px", mx: "auto", px: 2 }}>
          {/* Progress Bar */}
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="body2">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Typography>
              <Typography variant="body2">
                Answered: {getAnsweredCount()}/{questions.length}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Paper>

          <Grid container spacing={2}>
            {/* Question Panel */}
            <Grid item xs={12} md={8}>
              <Paper elevation={2} sx={{ p: 3, minHeight: "500px" }}>
                {/* Question Header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 3,
                  }}
                >
                  <Typography variant="h6" component="h2">
                    Question {currentQuestionIndex + 1}
                  </Typography>
                  <IconButton
                    onClick={() => handleFlagQuestion(currentQuestion._id)}
                    color={
                      flaggedQuestions.has(currentQuestion._id)
                        ? "warning"
                        : "default"
                    }
                  >
                    {flaggedQuestions.has(currentQuestion._id) ? (
                      <Flag />
                    ) : (
                      <FlagOutlined />
                    )}
                  </IconButton>
                </Box>

                {/* Question Text */}
                <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.6 }}>
                  {currentQuestion.questionText}
                </Typography>

                {/* Answer Options */}
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={answers[currentQuestion._id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion._id, e.target.value)
                    }
                  >
                    {currentQuestion.options.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        value={option}
                        control={<Radio />}
                        label={
                          <Typography variant="body1" sx={{ py: 1 }}>
                            {option}
                          </Typography>
                        }
                        sx={{
                          mb: 1,
                          p: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          "&:hover": {
                            bgcolor: "action.hover",
                          },
                        }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>

                {/* Navigation Buttons */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 4,
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<NavigateBefore />}
                    onClick={() =>
                      handleQuestionNavigation(currentQuestionIndex - 1)
                    }
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>

                  <Button
                    variant="contained"
                    onClick={() => setNavigationDialogOpen(true)}
                  >
                    Question Navigator
                  </Button>

                  {currentQuestionIndex === questions.length - 1 ? (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Send />}
                      onClick={() => setSubmitDialogOpen(true)}
                    >
                      Submit Exam
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      endIcon={<NavigateNext />}
                      onClick={() =>
                        handleQuestionNavigation(currentQuestionIndex + 1)
                      }
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Question Navigator Sidebar */}
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 2, position: "sticky", top: 80 }}>
                <Typography variant="h6" gutterBottom>
                  Question Navigator
                </Typography>

                <Grid container spacing={1}>
                  {questions.map((question, index) => {
                    const status = getQuestionStatus(index);
                    const isCurrentQuestion = index === currentQuestionIndex;

                    return (
                      <Grid item xs={3} key={question._id}>
                        <Button
                          variant={isCurrentQuestion ? "contained" : "outlined"}
                          color={
                            isCurrentQuestion
                              ? "primary"
                              : getStatusColor(status)
                          }
                          size="small"
                          onClick={() => handleQuestionNavigation(index)}
                          sx={{
                            minWidth: "40px",
                            height: "40px",
                            fontSize: "0.75rem",
                          }}
                        >
                          {index + 1}
                        </Button>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Legend */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Legend:
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip size="small" color="success" label="A" />
                      <Typography variant="caption">Answered</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip size="small" color="warning" label="F" />
                      <Typography variant="caption">Flagged</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip size="small" color="default" label="U" />
                      <Typography variant="caption">Unanswered</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Quick Actions */}
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setSubmitDialogOpen(true)}
                    color="success"
                    startIcon={<Send />}
                  >
                    Submit Exam
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Submit Confirmation Dialog */}
      <Dialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
      >
        <DialogTitle>Submit Exam</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to submit your exam?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You have answered {getAnsweredCount()} out of {questions.length}{" "}
            questions.
            {questions.length - getAnsweredCount() > 0 && (
              <span style={{ color: "orange" }}>
                {" "}
                {questions.length - getAnsweredCount()} questions remain
                unanswered.
              </span>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Time remaining: {formatTimeRemaining(timeRemaining)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitExam}
            variant="contained"
            color="success"
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Time Up Dialog */}
      <Dialog open={timeUpDialogOpen} disableEscapeKeyDown>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Warning color="error" />
            Time's Up!
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Your exam time has expired. Your answers are being submitted
            automatically.
          </Typography>
        </DialogContent>
      </Dialog>

      {/* Question Navigator Dialog (Mobile) */}
      <Dialog
        open={navigationDialogOpen}
        onClose={() => setNavigationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Question Navigator</DialogTitle>
        <DialogContent>
          <Grid container spacing={1}>
            {questions.map((question, index) => {
              const status = getQuestionStatus(index);
              const isCurrentQuestion = index === currentQuestionIndex;

              return (
                <Grid item xs={2} key={question._id}>
                  <Button
                    variant={isCurrentQuestion ? "contained" : "outlined"}
                    color={
                      isCurrentQuestion ? "primary" : getStatusColor(status)
                    }
                    size="small"
                    onClick={() => handleQuestionNavigation(index)}
                    sx={{
                      minWidth: "40px",
                      height: "40px",
                      fontSize: "0.75rem",
                    }}
                  >
                    {index + 1}
                  </Button>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNavigationDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamInterface;
