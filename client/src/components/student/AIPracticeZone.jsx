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
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <Psychology sx={{ mr: 2, verticalAlign: "middle" }} />
            AI Practice Zone
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate practice questions from your study materials using AI
          </Typography>
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
              <Paper elevation={2} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Generate Practice Questions
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
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
                    sx={{ mb: 2 }}
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
                      />
                    )}
                  </Box>
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Difficulty</InputLabel>
                      <Select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        label="Difficulty"
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
                      sx={{ height: "56px" }}
                    >
                      {loading ? "Generating..." : "Generate Questions"}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {practiceMode === "practice" && currentQuestion && (
              <Paper elevation={2} sx={{ p: 4 }}>
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">
                      Question {currentQuestionIndex + 1} of{" "}
                      {generatedQuestions.length}
                    </Typography>
                    <Chip
                      label={
                        difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
                      }
                      color={
                        difficulty === "easy"
                          ? "success"
                          : difficulty === "medium"
                          ? "warning"
                          : "error"
                      }
                      size="small"
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ mb: 3 }}
                  />
                </Box>

                <Typography variant="h6" sx={{ mb: 3 }}>
                  {currentQuestion.question}
                </Typography>

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
                    {currentQuestion.options?.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        value={option}
                        control={<Radio />}
                        label={option}
                        sx={{
                          mb: 1,
                          p: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Button
                    variant="outlined"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>

                  {currentQuestionIndex === generatedQuestions.length - 1 ? (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleFinishPractice}
                      startIcon={<CheckCircle />}
                    >
                      Finish Practice
                    </Button>
                  ) : (
                    <Button variant="contained" onClick={handleNextQuestion}>
                      Next
                    </Button>
                  )}
                </Box>
              </Paper>
            )}

            {practiceMode === "results" && showResults && (
              <Paper elevation={2} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Practice Results
                </Typography>

                {(() => {
                  const results = calculateResults();
                  return (
                    <>
                      <Box sx={{ mb: 4, textAlign: "center" }}>
                        <Typography variant="h3" color="primary" gutterBottom>
                          {results.percentage}%
                        </Typography>
                        <Typography variant="h6" gutterBottom>
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
                          color={
                            results.percentage >= 70
                              ? "success"
                              : results.percentage >= 50
                              ? "warning"
                              : "error"
                          }
                        />
                      </Box>

                      <Typography variant="h6" gutterBottom>
                        Question Review
                      </Typography>

                      {results.questions.map((q, index) => (
                        <Card key={index} sx={{ mb: 2 }}>
                          <CardContent>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 2,
                              }}
                            >
                              {q.isCorrect ? (
                                <CheckCircle color="success" />
                              ) : (
                                <Cancel color="error" />
                              )}
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                  Question {index + 1}: {q.question}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Your answer:{" "}
                                  <strong>
                                    {q.userAnswer || "Not answered"}
                                  </strong>
                                </Typography>
                                {!q.isCorrect && (
                                  <Typography
                                    variant="body2"
                                    color="success.main"
                                  >
                                    Correct answer:{" "}
                                    <strong>{q.correctAnswer}</strong>
                                  </Typography>
                                )}
                                {q.explanation && (
                                  <Box
                                    sx={{
                                      mt: 1,
                                      p: 2,
                                      bgcolor: "grey.50",
                                      borderRadius: 1,
                                    }}
                                  >
                                    <Typography variant="body2">
                                      <Lightbulb
                                        sx={{
                                          fontSize: 16,
                                          mr: 1,
                                          verticalAlign: "middle",
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

                      <Box sx={{ mt: 4, textAlign: "center" }}>
                        <Button
                          variant="contained"
                          onClick={handleStartNew}
                          startIcon={<Refresh />}
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
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <TrendingUp sx={{ mr: 1, verticalAlign: "middle" }} />
                  Quick Stats
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Quiz color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Practice Sessions"
                      secondary={practiceHistory.length}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <School color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Average Score"
                      secondary={
                        practiceHistory.length > 0
                          ? `${Math.round(
                              practiceHistory.reduce(
                                (acc, session) =>
                                  acc + session.results.percentage,
                                0
                              ) / practiceHistory.length
                            )}%`
                          : "N/A"
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Practice History */}
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Practice Sessions
                </Typography>
                {practiceHistory.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No practice sessions yet. Start practicing to see your
                    history!
                  </Typography>
                ) : (
                  <List dense>
                    {practiceHistory.slice(0, 5).map((session, index) => (
                      <React.Fragment key={session.id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Typography variant="body2">
                                  {session.results.totalQuestions} questions
                                </Typography>
                                <Chip
                                  label={`${session.results.percentage}%`}
                                  size="small"
                                  color={
                                    session.results.percentage >= 70
                                      ? "success"
                                      : session.results.percentage >= 50
                                      ? "warning"
                                      : "error"
                                  }
                                />
                              </Box>
                            }
                            secondary={formatDate(session.createdAt)}
                          />
                        </ListItem>
                        {index < Math.min(practiceHistory.length - 1, 4) && (
                          <Divider />
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
