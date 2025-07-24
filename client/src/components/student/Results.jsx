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
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  Schedule,
  CheckCircle,
  Cancel,
  Visibility,
  Search,
  FilterList,
  Download,
  Share,
  Close,
} from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import { studentService } from "../../services/studentService";
import {
  formatDate,
  formatDuration,
  calculatePercentage,
  debounce,
} from "../../utils";

const StudentResults = () => {
  const location = useLocation();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalResults, setTotalResults] = useState(0);

  // Filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Success message from exam submission
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || null
  );

  useEffect(() => {
    fetchResults();
  }, [page, rowsPerPage, searchTerm, filterStatus, sortBy, sortOrder]);

  useEffect(() => {
    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await studentService.getResults(page + 1, rowsPerPage, {
        search: searchTerm,
        status: filterStatus,
        sortBy,
        sortOrder,
      });

      if (response.success) {
        setResults(response.data.results || []);
        setTotalResults(response.data.total || 0);
      } else {
        setError(response.error.message);
      }
    } catch (err) {
      setError("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (resultId) => {
    try {
      const response = await studentService.getExamResult(resultId);
      if (response.success) {
        setSelectedResult(response.data);
        setDetailDialogOpen(true);
      } else {
        setError(response.error.message);
      }
    } catch (err) {
      setError("Failed to load exam details");
    }
  };

  const handleSearchChange = debounce((value) => {
    setSearchTerm(value);
    setPage(0);
  }, 300);

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "success";
    if (percentage >= 60) return "warning";
    return "error";
  };

  const getScoreIcon = (percentage) => {
    if (percentage >= 60) return <TrendingUp />;
    return <TrendingDown />;
  };

  const calculateStats = () => {
    if (results.length === 0)
      return { average: 0, highest: 0, lowest: 0, passed: 0 };

    const scores = results.map((r) => r.percentage);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passed = results.filter((r) => r.percentage >= 60).length;

    return { average, highest, lowest, passed };
  };

  const stats = calculateStats();

  if (loading && results.length === 0) {
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
            My Results
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your exam results and performance analytics
          </Typography>
        </Box>

        {/* Success Message */}
        {successMessage && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => setSuccessMessage(null)}
          >
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar sx={{ bgcolor: "primary.main", mx: "auto", mb: 2 }}>
                  <Assessment />
                </Avatar>
                <Typography variant="h4" component="div" color="primary">
                  {results.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Exams
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar sx={{ bgcolor: "success.main", mx: "auto", mb: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Typography variant="h4" component="div" color="success.main">
                  {Math.round(stats.average)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar sx={{ bgcolor: "warning.main", mx: "auto", mb: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Typography variant="h4" component="div" color="warning.main">
                  {stats.passed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Passed Exams
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar sx={{ bgcolor: "info.main", mx: "auto", mb: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Typography variant="h4" component="div" color="info.main">
                  {stats.highest}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Highest Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search exams..."
                variant="outlined"
                size="small"
                onChange={(e) => handleSearchChange(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Filter by Status"
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Results</MenuItem>
                  <MenuItem value="passed">Passed (≥60%)</MenuItem>
                  <MenuItem value="failed">Failed (&lt;60%)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="submittedAt">Date</MenuItem>
                  <MenuItem value="percentage">Score</MenuItem>
                  <MenuItem value="examTitle">Exam Name</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                startIcon={<FilterList />}
              >
                {sortOrder === "asc" ? "Asc" : "Desc"}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Results Table */}
        <Paper elevation={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Exam</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {result.examTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {result.questionsCount} questions
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(result.submittedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDuration(result.timeSpent)} /{" "}
                        {formatDuration(result.examDuration)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">
                            {result.score}/{result.totalQuestions}
                          </Typography>
                        </Box>
                        <Box sx={{ width: "100%", mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={result.percentage}
                            color={getScoreColor(result.percentage)}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography
                            variant="body2"
                            color={`${getScoreColor(result.percentage)}.main`}
                          >
                            {result.percentage}%
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getScoreIcon(result.percentage)}
                        label={result.percentage >= 60 ? "Passed" : "Failed"}
                        color={getScoreColor(result.percentage)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(result._id)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {results.length === 0 && !loading && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No results found.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Complete some exams to see your results here.
              </Typography>
            </Box>
          )}

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalResults}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>

        {/* Result Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">
                {selectedResult?.examTitle} - Detailed Results
              </Typography>
              <IconButton onClick={() => setDetailDialogOpen(false)}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedResult && (
              <Box>
                {/* Summary */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Score
                    </Typography>
                    <Typography variant="h6">
                      {selectedResult.score}/{selectedResult.totalQuestions} (
                      {selectedResult.percentage}%)
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Time Spent
                    </Typography>
                    <Typography variant="h6">
                      {formatDuration(selectedResult.timeSpent)}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Question-by-Question Analysis */}
                <Typography variant="h6" gutterBottom>
                  Question Analysis
                </Typography>
                <List>
                  {selectedResult.questionAnalysis?.map((question, index) => (
                    <React.Fragment key={question.questionId}>
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
                              <Typography variant="subtitle2">
                                Question {index + 1}
                              </Typography>
                              <Chip
                                icon={
                                  question.isCorrect ? (
                                    <CheckCircle />
                                  ) : (
                                    <Cancel />
                                  )
                                }
                                label={
                                  question.isCorrect ? "Correct" : "Incorrect"
                                }
                                color={question.isCorrect ? "success" : "error"}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {question.questionText}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Your answer:{" "}
                                <strong>
                                  {question.selectedAnswer || "Not answered"}
                                </strong>
                              </Typography>
                              {!question.isCorrect && (
                                <Typography
                                  variant="body2"
                                  color="success.main"
                                >
                                  Correct answer:{" "}
                                  <strong>{question.correctAnswer}</strong>
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < selectedResult.questionAnalysis.length - 1 && (
                        <Divider />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default StudentResults;
