import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  IconButton,
  Tooltip,
  Avatar,
} from "@mui/material";
import {
  Psychology,
  Upload,
  Quiz,
  CheckCircle,
  Cancel,
  Refresh,
  PlayArrow,
  Stop,
  Lightbulb,
  TrendingUp,
  School,
  Close,
} from "@mui/icons-material";
import { aiService } from "../../services/aiService";
import { formatDate } from "../../utils";

const AIPracticeZone = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [studyMaterial, setStudyMaterial] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [practiceMode, setPracticeMode] = useState("generate"); // generate, practice, results
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchPracticeHistory();
  }, []);

  const fetchPracticeHistory = async () => {
    try {
      // This would typically fetch from a service
      // For now, we'll use localStorage
      const history = JSON.parse(
        localStorage.getItem("practiceHistory") || "[]"
      );
      setPracticeHistory(history);
    } catch (error) {
      console.error("Failed to fetch practice history:", error);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!studyMaterial.trim() && !selectedFile) {
      setError("Please provide study material or upload a PDF file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let requestData;

      if (selectedFile) {
        // If PDF file is uploaded, send it as FormData
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("difficulty", difficulty);
        formData.append("count", questionCount.toString());

        requestData = formData;
      } else {
        // If text content is provided
        requestData = {
          content: studyMaterial,
          difficulty,
          count: questionCount,
        };
      }

      const response = await aiService.generateQuestions(requestData);

      if (response.success) {
        setGeneratedQuestions(response.data.questions);
        setAnswers({});
        setCurrentQuestionIndex(0);
        setPracticeMode("practice");
        setSuccess(
          `Generated ${response.data.questions.length} questions successfully!`
        );
      } else {
        setError(response.error.message || "Failed to generate questions");
      }
    } catch (err) {
      setError("Failed to generate questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit for PDFs
        setError("File size must be less than 10MB");
        return;
      }

      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file only");
        return;
      }

      setSelectedFile(file);
      setError(null);
      setSuccess(
        `PDF file "${file.name}" uploaded successfully. Click "Generate Questions" to process it.`
      );

      // For now, we'll set a placeholder text indicating PDF is uploaded
      // In a real implementation, you'd send the PDF to the backend for text extraction
      setStudyMaterial(
        `[PDF File: ${file.name}] - Content will be extracted when generating questions.`
      );
    }
  };

  const handleAnswerChange = (questionId, selectedOption) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < generatedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleFinishPractice = () => {
    const results = calculateResults();
    savePracticeSession(results);
    setPracticeMode("results");
    setShowResults(true);
  };

  const calculateResults = () => {
    let correct = 0;
    const questionResults = generatedQuestions.map((question, index) => {
      const userAnswer = answers[question.id] || answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correct++;

      return {
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      };
    });

    return {
      totalQuestions: generatedQuestions.length,
      correctAnswers: correct,
      percentage: Math.round((correct / generatedQuestions.length) * 100),
      questions: questionResults,
      completedAt: new Date().toISOString(),
    };
  };

  const savePracticeSession = (results) => {
    const session = {
      id: Date.now(),
      difficulty,
      results,
      createdAt: new Date().toISOString(),
    };

    const history = JSON.parse(localStorage.getItem("practiceHistory") || "[]");
    history.unshift(session);
    localStorage.setItem(
      "practiceHistory",
      JSON.stringify(history.slice(0, 10))
    ); // Keep last 10 sessions
    setPracticeHistory(history.slice(0, 10));
  };

  const handleStartNew = () => {
    setGeneratedQuestions([]);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setPracticeMode("generate");
    setStudyMaterial("");
    setSelectedFile(null);
    setError(null);
    setSuccess(null);
  };

  const currentQuestion = generatedQuestions[currentQuestionIndex];
  const progress =
    generatedQuestions.length > 0
      ? ((currentQuestionIndex + 1) / generatedQuestions.length) * 100
      : 0;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            textAlign: "center",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
            backdropFilter: "blur(10px)",
            borderRadius: 3,
            p: 4,
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <Avatar
              sx={{
                bgcolor: "primary.main",
                mr: 2,
                width: 56,
                height: 56,
                background: "linear-gradient(45deg, #9c27b0 30%, #e91e63 90%)",
              }}
            >
              <Psychology sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: "bold",
                  background:
                    "linear-gradient(45deg, #9c27b0 30%, #e91e63 90%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 1,
                }}
              >
                AI Practice Zone
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                }}
              >
                Generate practice questions from your study materials using AI
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Success/Error Messages */}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {practiceMode === "generate" && (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: "rgba(156, 39, 176, 0.1)",
                      color: "#9c27b0",
                      mr: 2,
                      width: 40,
                      height: 40,
                    }}
                  >
                    <Quiz />
                  </Avatar>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      color: "text.primary",
                    }}
                  >
                    Generate Practice Questions
                  </Typography>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "text.secondary",
                      mb: 3,
                      fontWeight: 500,
                    }}
                  >
                    Provide your study material below or upload a PDF file
                  </Typography>

                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    placeholder="Paste your study material here..."
                    value={studyMaterial}
                    onChange={(e) => setStudyMaterial(e.target.value)}
                    sx={{
                      mb: 3,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: "rgba(255,255,255,0.8)",
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#9c27b0",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#9c27b0",
                        },
                      },
                    }}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<Upload />}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        borderColor: "#9c27b0",
                        color: "#9c27b0",
                        "&:hover": {
                          borderColor: "#7b1fa2",
                          bgcolor: "rgba(156, 39, 176, 0.05)",
                        },
                      }}
                    >
                      Upload PDF File
                      <input
                        type="file"
                        hidden
                        accept=".pdf"
                        onChange={handleFileUpload}
                      />
                    </Button>
                    {selectedFile && (
                      <Chip
                        label={selectedFile.name}
                        onDelete={() => {
                          setSelectedFile(null);
                          setStudyMaterial("");
                        }}
                        sx={{
                          bgcolor: "rgba(156, 39, 176, 0.1)",
                          color: "#9c27b0",
                          "& .MuiChip-deleteIcon": {
                            color: "#9c27b0",
                          },
                        }}
                      />
                    )}
                  </Box>
                </Box>

                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Difficulty</InputLabel>
                      <Select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        label="Difficulty"
                        sx={{
                          borderRadius: 2,
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#9c27b0",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#9c27b0",
                          },
                        }}
                      >
                        <MenuItem value="easy">Easy</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="hard">Hard</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Number of Questions</InputLabel>
                      <Select
                        value={questionCount}
                        onChange={(e) => setQuestionCount(e.target.value)}
                        label="Number of Questions"
                        sx={{
                          borderRadius: 2,
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#9c27b0",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#9c27b0",
                          },
                        }}
                      >
                        <MenuItem value={3}>3 Questions</MenuItem>
                        <MenuItem value={5}>5 Questions</MenuItem>
                        <MenuItem value={10}>10 Questions</MenuItem>
                        <MenuItem value={15}>15 Questions</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleGenerateQuestions}
                      disabled={loading || !studyMaterial.trim()}
                      startIcon={
                        loading ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Psychology />
                        )
                      }
                      sx={{
                        height: "56px",
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        background:
                          "linear-gradient(45deg, #9c27b0 30%, #e91e63 90%)",
                        boxShadow: "0 4px 12px rgba(156, 39, 176, 0.3)",
                        "&:hover": {
                          background:
                            "linear-gradient(45deg, #7b1fa2 30%, #c2185b 90%)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 16px rgba(156, 39, 176, 0.4)",
                        },
                        "&:disabled": {
                          background: "rgba(0,0,0,0.12)",
                          color: "rgba(0,0,0,0.26)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      {loading ? "Generating..." : "Generate Questions"}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {practiceMode === "practice" && currentQuestion && (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                }}
              >
                <Box sx={{ mb: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: "bold",
                        color: "text.primary",
                      }}
                    >
                      Question {currentQuestionIndex + 1} of{" "}
                      {generatedQuestions.length}
                    </Typography>
                    <Chip
                      label={
                        difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
                      }
                      sx={{
                        bgcolor:
                          difficulty === "easy"
                            ? "rgba(76, 175, 80, 0.1)"
                            : difficulty === "medium"
                            ? "rgba(255, 193, 7, 0.1)"
                            : "rgba(244, 67, 54, 0.1)",
                        color:
                          difficulty === "easy"
                            ? "#4caf50"
                            : difficulty === "medium"
                            ? "#ff9800"
                            : "#f44336",
                        border: `1px solid ${
                          difficulty === "easy"
                            ? "#4caf50"
                            : difficulty === "medium"
                            ? "#ff9800"
                            : "#f44336"
                        }`,
                        fontWeight: 600,
                      }}
                      size="small"
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      mb: 4,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "rgba(0,0,0,0.1)",
                      "& .MuiLinearProgress-bar": {
                        background:
                          "linear-gradient(45deg, #9c27b0 30%, #e91e63 90%)",
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    mb: 4,
                    bgcolor: "rgba(156, 39, 176, 0.05)",
                    border: "1px solid rgba(156, 39, 176, 0.1)",
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
                    {currentQuestion.question}
                  </Typography>
                </Paper>

                <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
                  <RadioGroup
                    value={
                      answers[currentQuestion.id] ||
                      answers[currentQuestionIndex] ||
                      ""
                    }
                    onChange={(e) =>
                      handleAnswerChange(
                        currentQuestion.id || currentQuestionIndex,
                        e.target.value
                      )
                    }
                  >
                    {currentQuestion.options?.map((option, index) => {
                      const isSelected =
                        (answers[currentQuestion.id] ||
                          answers[currentQuestionIndex]) === option;
                      return (
                        <FormControlLabel
                          key={index}
                          value={option}
                          control={
                            <Radio
                              sx={{
                                color: "#9c27b0",
                                "&.Mui-checked": {
                                  color: "#9c27b0",
                                },
                              }}
                            />
                          }
                          label={
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected ? "#9c27b0" : "text.primary",
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
                              ? "#9c27b0"
                              : "rgba(0,0,0,0.1)",
                            borderRadius: 2,
                            bgcolor: isSelected
                              ? "rgba(156, 39, 176, 0.05)"
                              : "rgba(255,255,255,0.7)",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              bgcolor: isSelected
                                ? "rgba(156, 39, 176, 0.1)"
                                : "rgba(156, 39, 176, 0.05)",
                              borderColor: "#9c27b0",
                              transform: "translateX(4px)",
                              boxShadow: "0 4px 12px rgba(156, 39, 176, 0.2)",
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

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    pt: 3,
                    borderTop: "2px solid rgba(156, 39, 176, 0.1)",
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      borderColor: "#9c27b0",
                      color: "#9c27b0",
                      "&:hover": {
                        borderColor: "#7b1fa2",
                        bgcolor: "rgba(156, 39, 176, 0.05)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(156, 39, 176, 0.2)",
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

                  {currentQuestionIndex === generatedQuestions.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleFinishPractice}
                      startIcon={<CheckCircle />}
                      sx={{
                        px: 3,
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
                      Finish Practice
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNextQuestion}
                      sx={{
                        px: 3,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        background:
                          "linear-gradient(45deg, #9c27b0 30%, #e91e63 90%)",
                        boxShadow: "0 4px 12px rgba(156, 39, 176, 0.3)",
                        "&:hover": {
                          background:
                            "linear-gradient(45deg, #7b1fa2 30%, #c2185b 90%)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 16px rgba(156, 39, 176, 0.4)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Paper>
            )}

            {practiceMode === "results" && showResults && (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                  <Avatar
                    sx={{
                      bgcolor: "rgba(76, 175, 80, 0.1)",
                      color: "#4caf50",
                      mr: 2,
                      width: 40,
                      height: 40,
                    }}
                  >
                    <TrendingUp />
                  </Avatar>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      color: "text.primary",
                    }}
                  >
                    Practice Results
                  </Typography>
                </Box>

                {(() => {
                  const results = calculateResults();
                  return (
                    <>
                      <Box
                        sx={{
                          mb: 5,
                          textAlign: "center",
                          p: 4,
                          background:
                            "linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(129, 199, 132, 0.1) 100%)",
                          borderRadius: 3,
                          border: "1px solid rgba(76, 175, 80, 0.2)",
                        }}
                      >
                        <Typography
                          variant="h2"
                          sx={{
                            fontWeight: "bold",
                            background:
                              "linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            mb: 2,
                          }}
                        >
                          {results.percentage}%
                        </Typography>
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{
                            color: "text.primary",
                            fontWeight: 600,
                            mb: 2,
                          }}
                        >
                          {results.correctAnswers} out of{" "}
                          {results.totalQuestions} correct
                        </Typography>
                        <Chip
                          label={
                            results.percentage >= 70
                              ? "Great Job!"
                              : results.percentage >= 50
                              ? "Good Effort!"
                              : "Keep Practicing!"
                          }
                          sx={{
                            bgcolor:
                              results.percentage >= 70
                                ? "rgba(76, 175, 80, 0.1)"
                                : results.percentage >= 50
                                ? "rgba(255, 193, 7, 0.1)"
                                : "rgba(244, 67, 54, 0.1)",
                            color:
                              results.percentage >= 70
                                ? "#4caf50"
                                : results.percentage >= 50
                                ? "#ff9800"
                                : "#f44336",
                            border: `1px solid ${
                              results.percentage >= 70
                                ? "#4caf50"
                                : results.percentage >= 50
                                ? "#ff9800"
                                : "#f44336"
                            }`,
                            fontWeight: 600,
                            fontSize: "1rem",
                            px: 2,
                            py: 1,
                          }}
                        />
                      </Box>

                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontWeight: "bold",
                          color: "text.primary",
                          mb: 3,
                        }}
                      >
                        Question Review
                      </Typography>

                      {results.questions.map((q, index) => (
                        <Card
                          key={index}
                          sx={{
                            mb: 3,
                            background:
                              "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
                            backdropFilter: "blur(10px)",
                            borderRadius: 2,
                            border: "1px solid rgba(255,255,255,0.2)",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 2,
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: q.isCorrect
                                    ? "rgba(76, 175, 80, 0.1)"
                                    : "rgba(244, 67, 54, 0.1)",
                                  color: q.isCorrect ? "#4caf50" : "#f44336",
                                  width: 36,
                                  height: 36,
                                }}
                              >
                                {q.isCorrect ? <CheckCircle /> : <Cancel />}
                              </Avatar>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography
                                  variant="h6"
                                  gutterBottom
                                  sx={{
                                    fontWeight: 600,
                                    color: "text.primary",
                                  }}
                                >
                                  Question {index + 1}: {q.question}
                                </Typography>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    color: "text.secondary",
                                    mb: 1,
                                  }}
                                >
                                  Your answer:{" "}
                                  <strong
                                    style={{
                                      color: q.isCorrect
                                        ? "#4caf50"
                                        : "#f44336",
                                    }}
                                  >
                                    {q.userAnswer || "Not answered"}
                                  </strong>
                                </Typography>
                                {!q.isCorrect && (
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      color: "#4caf50",
                                      mb: 2,
                                    }}
                                  >
                                    Correct answer:{" "}
                                    <strong>{q.correctAnswer}</strong>
                                  </Typography>
                                )}
                                {q.explanation && (
                                  <Box
                                    sx={{
                                      mt: 2,
                                      p: 2,
                                      bgcolor: "rgba(255, 193, 7, 0.05)",
                                      border:
                                        "1px solid rgba(255, 193, 7, 0.2)",
                                      borderRadius: 2,
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 1,
                                      }}
                                    >
                                      <Lightbulb
                                        sx={{
                                          fontSize: 18,
                                          color: "#ff9800",
                                          mt: 0.2,
                                        }}
                                      />
                                      {q.explanation}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}

                      <Box sx={{ mt: 5, textAlign: "center" }}>
                        <Button
                          variant="contained"
                          onClick={handleStartNew}
                          startIcon={<Refresh />}
                          sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: 3,
                            textTransform: "none",
                            fontWeight: 600,
                            background:
                              "linear-gradient(45deg, #9c27b0 30%, #e91e63 90%)",
                            boxShadow: "0 4px 12px rgba(156, 39, 176, 0.3)",
                            "&:hover": {
                              background:
                                "linear-gradient(45deg, #7b1fa2 30%, #c2185b 90%)",
                              transform: "translateY(-2px)",
                              boxShadow: "0 6px 16px rgba(156, 39, 176, 0.4)",
                            },
                            transition: "all 0.3s ease",
                          }}
                        >
                          Start New Practice
                        </Button>
                      </Box>
                    </>
                  );
                })()}
              </Paper>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Quick Stats */}
            <Card
              elevation={0}
              sx={{
                mb: 3,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: "rgba(255, 193, 7, 0.1)",
                      color: "#ff9800",
                      mr: 2,
                      width: 40,
                      height: 40,
                    }}
                  >
                    <TrendingUp />
                  </Avatar>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      color: "text.primary",
                    }}
                  >
                    Quick Stats
                  </Typography>
                </Box>
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: "rgba(156, 39, 176, 0.1)",
                          color: "#9c27b0",
                        }}
                      >
                        <Quiz fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Practice Sessions
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="h6"
                          sx={{ color: "#9c27b0", fontWeight: "bold" }}
                        >
                          {practiceHistory.length}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: "rgba(76, 175, 80, 0.1)",
                          color: "#4caf50",
                        }}
                      >
                        <School fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Average Score
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="h6"
                          sx={{ color: "#4caf50", fontWeight: "bold" }}
                        >
                          {practiceHistory.length > 0
                            ? `${Math.round(
                                practiceHistory.reduce(
                                  (acc, session) =>
                                    acc + session.results.percentage,
                                  0
                                ) / practiceHistory.length
                              )}%`
                            : "N/A"}
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Practice History */}
            <Card
              elevation={0}
              sx={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: "rgba(33, 150, 243, 0.1)",
                      color: "#2196f3",
                      mr: 2,
                      width: 40,
                      height: 40,
                    }}
                  >
                    <School />
                  </Avatar>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      color: "text.primary",
                    }}
                  >
                    Recent Practice Sessions
                  </Typography>
                </Box>
                {practiceHistory.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 3 }}>
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        mx: "auto",
                        mb: 2,
                        bgcolor: "rgba(158, 158, 158, 0.1)",
                        color: "text.secondary",
                      }}
                    >
                      <Quiz sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 500,
                      }}
                    >
                      No practice sessions yet. Start practicing to see your
                      history!
                    </Typography>
                  </Box>
                ) : (
                  <List dense>
                    {practiceHistory.slice(0, 5).map((session, index) => (
                      <React.Fragment key={session.id}>
                        <ListItem sx={{ px: 0, py: 2 }}>
                          <ListItemIcon>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor:
                                  session.results.percentage >= 70
                                    ? "rgba(76, 175, 80, 0.1)"
                                    : session.results.percentage >= 50
                                    ? "rgba(255, 193, 7, 0.1)"
                                    : "rgba(244, 67, 54, 0.1)",
                                color:
                                  session.results.percentage >= 70
                                    ? "#4caf50"
                                    : session.results.percentage >= 50
                                    ? "#ff9800"
                                    : "#f44336",
                              }}
                            >
                              <Quiz fontSize="small" />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {session.results.totalQuestions} questions
                                </Typography>
                                <Chip
                                  label={`${session.results.percentage}%`}
                                  sx={{
                                    bgcolor:
                                      session.results.percentage >= 70
                                        ? "rgba(76, 175, 80, 0.1)"
                                        : session.results.percentage >= 50
                                        ? "rgba(255, 193, 7, 0.1)"
                                        : "rgba(244, 67, 54, 0.1)",
                                    color:
                                      session.results.percentage >= 70
                                        ? "#4caf50"
                                        : session.results.percentage >= 50
                                        ? "#ff9800"
                                        : "#f44336",
                                    border: `1px solid ${
                                      session.results.percentage >= 70
                                        ? "#4caf50"
                                        : session.results.percentage >= 50
                                        ? "#ff9800"
                                        : "#f44336"
                                    }`,
                                    fontWeight: 600,
                                  }}
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {formatDate(session.createdAt)}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < Math.min(practiceHistory.length - 1, 4) && (
                          <Divider sx={{ bgcolor: "rgba(0,0,0,0.05)" }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AIPracticeZone;
