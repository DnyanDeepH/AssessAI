import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Snackbar,
  Checkbox,
  Toolbar,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  MoreVert,
  Upload,
  Download,
  Refresh,
  Visibility,
  ExpandMore,
  Quiz,
  TrendingUp,
} from "@mui/icons-material";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { adminService } from "../../services/adminService";

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create"); // create, edit, view
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuQuestionId, setMenuQuestionId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [stats, setStats] = useState({
    totalQuestions: 0,
    activeQuestions: 0,
    recentQuestionCount: 0,
    difficultyStats: {
      easy: 0,
      medium: 0,
      hard: 0,
    },
    topicStats: [],
  });
  const [topics, setTopics] = useState([]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      topic: "",
      difficulty: "medium",
      explanation: "",
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: "options",
  });

  const watchedOptions = watch("options");

  // Fetch questions
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await adminService.getQuestions(
        page + 1,
        rowsPerPage,
        searchTerm,
        topicFilter
      );
      if (response.success) {
        setQuestions(response.data?.questions || []);
        setTotalQuestions(response.data?.pagination?.totalQuestions || 0);

        // Extract unique topics
        const uniqueTopics = [
          ...new Set((response.data?.questions || []).map((q) => q.topic)),
        ];
        setTopics(uniqueTopics);
      } else {
        // Set empty data on error to prevent crashes
        setQuestions([]);
        setTotalQuestions(0);
        showSnackbar(
          response.error?.message || "Failed to fetch questions",
          "error"
        );
      }
    } catch (error) {
      // Set empty data on error to prevent crashes
      setQuestions([]);
      setTotalQuestions(0);
      showSnackbar("Failed to fetch questions", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch question statistics
  const fetchStats = async () => {
    try {
      const response = await adminService.getQuestionStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch question stats:", error);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchStats();
  }, [page, rowsPerPage, searchTerm, topicFilter, difficultyFilter]);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleTopicFilter = (event) => {
    setTopicFilter(event.target.value);
    setPage(0);
  };

  const handleDifficultyFilter = (event) => {
    setDifficultyFilter(event.target.value);
    setPage(0);
  };

  const handleSelectQuestion = (questionId) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedQuestions((questions || []).map((question) => question._id));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleMenuOpen = (event, questionId) => {
    setAnchorEl(event.currentTarget);
    setMenuQuestionId(questionId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuQuestionId(null);
  };

  const handleOpenDialog = (mode, question = null) => {
    setDialogMode(mode);
    setCurrentQuestion(question);
    setOpenDialog(true);
    if (question) {
      reset({
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        topic: question.topic,
        difficulty: question.difficulty,
        explanation: question.explanation || "",
      });
    } else {
      reset({
        questionText: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        topic: "",
        difficulty: "medium",
        explanation: "",
      });
    }
    handleMenuClose();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentQuestion(null);
    reset();
  };

  const handleSubmitQuestion = async (data) => {
    try {
      // Validate that correct answer is one of the options
      if (!data.options.includes(data.correctAnswer)) {
        showSnackbar(
          "Correct answer must be one of the provided options",
          "error"
        );
        return;
      }

      let response;
      if (dialogMode === "create") {
        response = await adminService.createQuestion(data);
      } else if (dialogMode === "edit") {
        response = await adminService.updateQuestion(currentQuestion._id, data);
      }

      if (response.success) {
        showSnackbar(
          `Question ${
            dialogMode === "create" ? "created" : "updated"
          } successfully`
        );
        fetchQuestions();
        fetchStats();
        handleCloseDialog();
      } else {
        showSnackbar(response.error.message, "error");
      }
    } catch (error) {
      showSnackbar("Operation failed", "error");
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        const response = await adminService.deleteQuestion(questionId);
        if (response.success) {
          showSnackbar("Question deleted successfully");
          fetchQuestions();
          fetchStats();
        } else {
          showSnackbar(response.error.message, "error");
        }
      } catch (error) {
        showSnackbar("Failed to delete question", "error");
      }
    }
    handleMenuClose();
  };

  const handleBulkDelete = async () => {
    if (
      selectedQuestions.length > 0 &&
      window.confirm(
        `Are you sure you want to delete ${selectedQuestions.length} questions?`
      )
    ) {
      try {
        const response = await adminService.bulkDeleteQuestions({
          questionIds: selectedQuestions,
        });
        if (response.success) {
          showSnackbar(
            `${response.data.deletedCount} questions deleted successfully`
          );
          setSelectedQuestions([]);
          fetchQuestions();
          fetchStats();
        } else {
          showSnackbar(response.error.message, "error");
        }
      } catch (error) {
        showSnackbar("Bulk delete failed", "error");
      }
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/questions/export", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `questions_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSnackbar("Questions exported successfully");
      } else {
        showSnackbar("Export failed", "error");
      }
    } catch (error) {
      showSnackbar("Export failed", "error");
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "success";
      case "medium":
        return "warning";
      case "hard":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Question Bank Management
        </Typography>

        {/* Statistics Cards */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Questions
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalQuestions || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Active Questions
                  </Typography>
                  <Typography variant="h4">
                    {stats?.activeQuestions || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Topics
                  </Typography>
                  <Typography variant="h4">
                    {stats.topicStats?.length || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    New This Month
                  </Typography>
                  <Typography variant="h4">
                    {stats?.recentQuestionCount || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Difficulty Distribution */}
        {stats && (
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Difficulty Distribution</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography color="success.main" variant="h5">
                        {stats?.difficultyStats?.easy || 0}
                      </Typography>
                      <Typography color="textSecondary">Easy</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography color="warning.main" variant="h5">
                        {stats?.difficultyStats?.medium || 0}
                      </Typography>
                      <Typography color="textSecondary">Medium</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography color="error.main" variant="h5">
                        {stats?.difficultyStats?.hard || 0}
                      </Typography>
                      <Typography color="textSecondary">Hard</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>

      {/* Toolbar */}
      <Paper sx={{ mb: 2 }}>
        <Toolbar>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Topic</InputLabel>
                <Select
                  value={topicFilter}
                  onChange={handleTopicFilter}
                  label="Topic"
                >
                  <MenuItem value="">All Topics</MenuItem>
                  {topics.map((topic) => (
                    <MenuItem key={topic} value={topic}>
                      {topic}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={difficultyFilter}
                  onChange={handleDifficultyFilter}
                  label="Difficulty"
                >
                  <MenuItem value="">All Difficulties</MenuItem>
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog("create")}
                >
                  Add Question
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Upload />}
                  onClick={() => {
                    /* TODO: Implement CSV import */
                  }}
                >
                  Import
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExport}
                >
                  Export
                </Button>
                <IconButton onClick={fetchQuestions}>
                  <Refresh />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </Toolbar>

        {/* Bulk Actions */}
        {selectedQuestions.length > 0 && (
          <Toolbar
            sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}
          >
            <Typography sx={{ flex: "1 1 100%" }}>
              {selectedQuestions.length} selected
            </Typography>
            <Button
              color="inherit"
              startIcon={<Delete />}
              onClick={handleBulkDelete}
            >
              Delete Selected
            </Button>
          </Toolbar>
        )}
      </Paper>

      {/* Questions Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedQuestions.length > 0 &&
                      selectedQuestions.length < (questions || []).length
                    }
                    checked={
                      (questions || []).length > 0 &&
                      selectedQuestions.length === (questions || []).length
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Question</TableCell>
                <TableCell>Topic</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Correct Answer</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (questions || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No questions found
                  </TableCell>
                </TableRow>
              ) : (
                (questions || []).map((question) => (
                  <TableRow key={question._id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedQuestions.includes(question._id)}
                        onChange={() => handleSelectQuestion(question._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 300 }}>
                        {(question.questionText || "").length > 100
                          ? `${question.questionText.substring(0, 100)}...`
                          : question.questionText}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={question.topic} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={question.difficulty}
                        color={getDifficultyColor(question.difficulty)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{question.correctAnswer}</TableCell>
                    <TableCell>
                      {question.createdBy?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {new Date(question.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, question._id)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalQuestions}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const question = questions.find((q) => q._id === menuQuestionId);
            handleOpenDialog("view", question);
          }}
        >
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const question = questions.find((q) => q._id === menuQuestionId);
            handleOpenDialog("edit", question);
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Question</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => handleDeleteQuestion(menuQuestionId)}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Question</ListItemText>
        </MenuItem>
      </Menu>

      {/* Question Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "create"
            ? "Add New Question"
            : dialogMode === "edit"
            ? "Edit Question"
            : "Question Details"}
        </DialogTitle>
        <form onSubmit={handleSubmit(handleSubmitQuestion)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="questionText"
                  control={control}
                  rules={{ required: "Question text is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Question Text"
                      multiline
                      rows={3}
                      error={!!errors.questionText}
                      helperText={errors.questionText?.message}
                      disabled={dialogMode === "view"}
                    />
                  )}
                />
              </Grid>

              {/* Options */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Answer Options
                </Typography>
                {fields.map((field, index) => (
                  <Controller
                    key={field.id}
                    name={`options.${index}`}
                    control={control}
                    rules={{ required: `Option ${index + 1} is required` }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label={`Option ${index + 1}`}
                        margin="normal"
                        error={!!errors.options?.[index]}
                        helperText={errors.options?.[index]?.message}
                        disabled={dialogMode === "view"}
                      />
                    )}
                  />
                ))}
              </Grid>

              {/* Correct Answer */}
              <Grid item xs={12}>
                <Controller
                  name="correctAnswer"
                  control={control}
                  rules={{ required: "Correct answer is required" }}
                  render={({ field }) => (
                    <FormControl fullWidth disabled={dialogMode === "view"}>
                      <FormLabel>Correct Answer</FormLabel>
                      <RadioGroup {...field}>
                        {watchedOptions.map((option, index) => (
                          <FormControlLabel
                            key={index}
                            value={option}
                            control={<Radio />}
                            label={option || `Option ${index + 1}`}
                            disabled={!option || dialogMode === "view"}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="topic"
                  control={control}
                  rules={{ required: "Topic is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Topic"
                      error={!!errors.topic}
                      helperText={errors.topic?.message}
                      disabled={dialogMode === "view"}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="difficulty"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth disabled={dialogMode === "view"}>
                      <InputLabel>Difficulty</InputLabel>
                      <Select {...field} label="Difficulty">
                        <MenuItem value="easy">Easy</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="hard">Hard</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="explanation"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Explanation (Optional)"
                      multiline
                      rows={2}
                      disabled={dialogMode === "view"}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            {dialogMode !== "view" && (
              <Button type="submit" variant="contained">
                {dialogMode === "create"
                  ? "Create Question"
                  : "Update Question"}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuestionBank;
