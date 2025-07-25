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
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa" }}>
      {/* Fixed Header */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          boxShadow: "0 4px 20px rgba(25, 118, 210, 0.3)",
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", mr: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                textShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {exam.title}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Timer */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mr: 2,
              bgcolor: "rgba(255, 255, 255, 0.15)",
              px: 2,
              py: 1,
              borderRadius: 2,
              backdropFilter: "blur(10px)",
            }}
          >
            <AccessTime
              sx={{
                mr: 1,
                color:
                  timeRemaining < 300 ? "#ffeb3b" : "rgba(255, 255, 255, 0.9)",
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontFamily: "monospace",
                minWidth: "80px",
                color: timeRemaining < 300 ? "#ffeb3b" : "white",
                fontWeight: "bold",
              }}
            >
              {formatTimeRemaining(timeRemaining)}
            </Typography>
          </Box>

          {/* Auto-save indicator */}
          {autoSaving && (
            <Tooltip title="Auto-saving...">
              <Save sx={{ mr: 2, color: "rgba(255, 255, 255, 0.9)" }} />
            </Tooltip>
          )}

          {lastSaved && (
            <Tooltip title={`Last saved: ${lastSaved.toLocaleTimeString()}`}>
              <CheckCircle sx={{ mr: 2, color: "#4caf50" }} />
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ pt: 8, pb: 2 }}>
        <Box sx={{ maxWidth: "1200px", mx: "auto", px: 2 }}>
          {/* Progress Bar */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
              backdropFilter: "blur(10px)",
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "primary.main",
                }}
              >
                Question {currentQuestionIndex + 1} of {questions.length}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  bgcolor: "rgba(25, 118, 210, 0.1)",
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                }}
              >
                <CheckCircle sx={{ color: "success.main", fontSize: 20 }} />
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: "text.primary",
                  }}
                >
                  Answered: {getAnsweredCount()}/{questions.length}
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 12,
                borderRadius: 6,
                bgcolor: "rgba(0,0,0,0.1)",
                "& .MuiLinearProgress-bar": {
                  background:
                    "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
                  borderRadius: 6,
                },
              }}
            />
          </Paper>

          <Grid container spacing={2}>
            {/* Question Panel */}
            <Grid item xs={12} md={8}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  minHeight: "500px",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                }}
              >
                {/* Question Header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 3,
                    pb: 2,
                    borderBottom: "2px solid rgba(25, 118, 210, 0.1)",
                  }}
                >
                  <Box>
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{
                        fontWeight: "bold",
                        color: "primary.main",
                        mb: 1,
                      }}
                    >
                      Question {currentQuestionIndex + 1}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 500,
                      }}
                    >
                      Select one answer from the options below
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={() => handleFlagQuestion(currentQuestion._id)}
                    sx={{
                      bgcolor: flaggedQuestions.has(currentQuestion._id)
                        ? "rgba(255, 193, 7, 0.1)"
                        : "rgba(0,0,0,0.05)",
                      color: flaggedQuestions.has(currentQuestion._id)
                        ? "warning.main"
                        : "text.secondary",
                      "&:hover": {
                        bgcolor: "warning.light",
                        transform: "scale(1.1)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    {flaggedQuestions.has(currentQuestion._id) ? (
                      <Flag />
                    ) : (
                      <FlagOutlined />
                    )}
                  </IconButton>
                </Box>

                {/* Question Text */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    mb: 4,
                    bgcolor: "rgba(25, 118, 210, 0.05)",
                    border: "1px solid rgba(25, 118, 210, 0.1)",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      lineHeight: 1.6,
                      color: "text.primary",
                      fontWeight: 500,
                    }}
                  >
                    {currentQuestion.questionText}
                  </Typography>
                </Paper>

                {/* Answer Options */}
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={answers[currentQuestion._id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion._id, e.target.value)
                    }
                  >
                    {currentQuestion.options.map((option, index) => {
                      const isSelected =
                        answers[currentQuestion._id] === option;
                      return (
                        <FormControlLabel
                          key={index}
                          value={option}
                          control={
                            <Radio
                              sx={{
                                color: "primary.main",
                                "&.Mui-checked": {
                                  color: "primary.main",
                                },
                              }}
                            />
                          }
                          label={
                            <Typography
                              variant="body1"
                              sx={{
                                py: 1,
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected
                                  ? "primary.main"
                                  : "text.primary",
                              }}
                            >
                              {String.fromCharCode(65 + index)}. {option}
                            </Typography>
                          }
                          sx={{
                            mb: 2,
                            p: 2,
                            border: "2px solid",
                            borderColor: isSelected
                              ? "primary.main"
                              : "rgba(0,0,0,0.1)",
                            borderRadius: 2,
                            bgcolor: isSelected
                              ? "rgba(25, 118, 210, 0.05)"
                              : "rgba(255,255,255,0.7)",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              bgcolor: isSelected
                                ? "rgba(25, 118, 210, 0.1)"
                                : "rgba(25, 118, 210, 0.05)",
                              borderColor: "primary.main",
                              transform: "translateX(4px)",
                              boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
                            },
                            "& .MuiFormControlLabel-label": {
                              width: "100%",
                            },
                          }}
                        />
                      );
                    })}
                  </RadioGroup>
                </FormControl>

                {/* Navigation Buttons */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 4,
                    pt: 3,
                    borderTop: "2px solid rgba(25, 118, 210, 0.1)",
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<NavigateBefore />}
                    onClick={() =>
                      handleQuestionNavigation(currentQuestionIndex - 1)
                    }
                    disabled={currentQuestionIndex === 0}
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: 600,
                      textTransform: "none",
                      borderColor: "primary.main",
                      color: "primary.main",
                      "&:hover": {
                        borderColor: "primary.dark",
                        bgcolor: "rgba(25, 118, 210, 0.05)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
                      },
                      "&:disabled": {
                        borderColor: "rgba(0,0,0,0.12)",
                        color: "rgba(0,0,0,0.26)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    Previous
                  </Button>

                  <Button
                    variant="contained"
                    onClick={() => setNavigationDialogOpen(true)}
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: 600,
                      textTransform: "none",
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
                    Question Navigator
                  </Button>

                  {currentQuestionIndex === questions.length - 1 ? (
                    <Button
                      variant="contained"
                      startIcon={<Send />}
                      onClick={() => setSubmitDialogOpen(true)}
                      sx={{
                        px: 3,
                        py: 1.5,
                        borderRadius: 3,
                        fontWeight: 600,
                        textTransform: "none",
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
                      Submit Exam
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      endIcon={<NavigateNext />}
                      onClick={() =>
                        handleQuestionNavigation(currentQuestionIndex + 1)
                      }
                      sx={{
                        px: 3,
                        py: 1.5,
                        borderRadius: 3,
                        fontWeight: 600,
                        textTransform: "none",
                        borderColor: "primary.main",
                        color: "primary.main",
                        "&:hover": {
                          borderColor: "primary.dark",
                          bgcolor: "rgba(25, 118, 210, 0.05)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Question Navigator Sidebar */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  position: "sticky",
                  top: 100,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    fontWeight: "bold",
                    color: "primary.main",
                    mb: 3,
                    pb: 2,
                    borderBottom: "2px solid rgba(25, 118, 210, 0.1)",
                  }}
                >
                  Question Navigator
                </Typography>

                <Grid container spacing={1.5}>
                  {questions.map((question, index) => {
                    const status = getQuestionStatus(index);
                    const isCurrentQuestion = index === currentQuestionIndex;

                    return (
                      <Grid item xs={3} key={question._id}>
                        <Button
                          variant={isCurrentQuestion ? "contained" : "outlined"}
                          onClick={() => handleQuestionNavigation(index)}
                          sx={{
                            minWidth: "45px",
                            height: "45px",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            borderRadius: 2,
                            ...(isCurrentQuestion
                              ? {
                                  background:
                                    "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
                                  color: "white",
                                  boxShadow:
                                    "0 4px 12px rgba(25, 118, 210, 0.3)",
                                  "&:hover": {
                                    background:
                                      "linear-gradient(45deg, #1565c0 30%, #1976d2 90%)",
                                    transform: "scale(1.05)",
                                  },
                                }
                              : {
                                  borderColor:
                                    getStatusColor(status) === "success"
                                      ? "#4caf50"
                                      : getStatusColor(status) === "warning"
                                      ? "#ff9800"
                                      : "rgba(0,0,0,0.23)",
                                  color:
                                    getStatusColor(status) === "success"
                                      ? "#4caf50"
                                      : getStatusColor(status) === "warning"
                                      ? "#ff9800"
                                      : "text.primary",
                                  bgcolor:
                                    getStatusColor(status) === "success"
                                      ? "rgba(76, 175, 80, 0.1)"
                                      : getStatusColor(status) === "warning"
                                      ? "rgba(255, 152, 0, 0.1)"
                                      : "rgba(255,255,255,0.7)",
                                  "&:hover": {
                                    borderColor: "primary.main",
                                    bgcolor: "rgba(25, 118, 210, 0.1)",
                                    transform: "scale(1.05)",
                                  },
                                }),
                            transition: "all 0.3s ease",
                          }}
                        >
                          {index + 1}
                        </Button>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Legend */}
                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      color: "text.primary",
                      mb: 2,
                    }}
                  >
                    Legend:
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1,
                          bgcolor: "rgba(76, 175, 80, 0.1)",
                          border: "2px solid #4caf50",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheckCircle sx={{ fontSize: 16, color: "#4caf50" }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Answered
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1,
                          bgcolor: "rgba(255, 152, 0, 0.1)",
                          border: "2px solid #ff9800",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Flag sx={{ fontSize: 16, color: "#ff9800" }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Flagged
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1,
                          bgcolor: "rgba(0,0,0,0.05)",
                          border: "2px solid rgba(0,0,0,0.23)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <RadioButtonUnchecked
                          sx={{ fontSize: 16, color: "text.secondary" }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Unanswered
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Quick Actions */}
                <Box sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => setSubmitDialogOpen(true)}
                    startIcon={<Send />}
                    sx={{
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: 600,
                      textTransform: "none",
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
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
            backdropFilter: "blur(10px)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "primary.main",
            borderBottom: "2px solid rgba(25, 118, 210, 0.1)",
            pb: 2,
          }}
        >
          Submit Exam
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography gutterBottom sx={{ fontSize: "1.1rem", mb: 2 }}>
            Are you sure you want to submit your exam?
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: "rgba(25, 118, 210, 0.05)",
              borderRadius: 2,
              border: "1px solid rgba(25, 118, 210, 0.1)",
              mb: 2,
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
              Exam Summary:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You have answered {getAnsweredCount()} out of {questions.length}{" "}
              questions.
              {questions.length - getAnsweredCount() > 0 && (
                <span style={{ color: "#ff9800", fontWeight: 600 }}>
                  {" "}
                  {questions.length - getAnsweredCount()} questions remain
                  unanswered.
                </span>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Time remaining: {formatTimeRemaining(timeRemaining)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setSubmitDialogOpen(false)}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitExam}
            variant="contained"
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              background: "linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)",
              boxShadow: "0 4px 12px rgba(76, 175, 80, 0.3)",
              "&:hover": {
                background: "linear-gradient(45deg, #388e3c 30%, #4caf50 90%)",
                boxShadow: "0 6px 16px rgba(76, 175, 80, 0.4)",
              },
            }}
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
