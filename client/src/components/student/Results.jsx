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
                background: "linear-gradient(45deg, #ff5722 30%, #ff9800 90%)",
              }}
            >
              <Assessment />
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: "bold",
                  background:
                    "linear-gradient(45deg, #ff5722 30%, #ff9800 90%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 1,
                }}
              >
                My Results
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                }}
              >
                View your exam results and performance analytics
              </Typography>
            </Box>
          </Box>
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
            <Card
              elevation={0}
              sx={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: "rgba(33, 150, 243, 0.1)",
                    color: "#2196f3",
                    mx: "auto",
                    mb: 2,
                    width: 56,
                    height: 56,
                  }}
                >
                  <Assessment sx={{ fontSize: 28 }} />
                </Avatar>
                <Typography
                  variant="h3"
                  component="div"
                  sx={{
                    fontWeight: "bold",
                    color: "#2196f3",
                    mb: 1,
                  }}
                >
                  {results.length}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 500,
                  }}
                >
                  Total Exams
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: "rgba(76, 175, 80, 0.1)",
                    color: "#4caf50",
                    mx: "auto",
                    mb: 2,
                    width: 56,
                    height: 56,
                  }}
                >
                  <TrendingUp sx={{ fontSize: 28 }} />
                </Avatar>
                <Typography
                  variant="h3"
                  component="div"
                  sx={{
                    fontWeight: "bold",
                    color: "#4caf50",
                    mb: 1,
                  }}
                >
                  {Math.round(stats.average)}%
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 500,
                  }}
                >
                  Average Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: "rgba(255, 193, 7, 0.1)",
                    color: "#ff9800",
                    mx: "auto",
                    mb: 2,
                    width: 56,
                    height: 56,
                  }}
                >
                  <CheckCircle sx={{ fontSize: 28 }} />
                </Avatar>
                <Typography
                  variant="h3"
                  component="div"
                  sx={{
                    fontWeight: "bold",
                    color: "#ff9800",
                    mb: 1,
                  }}
                >
                  {stats.passed}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 500,
                  }}
                >
                  Passed Exams
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
                backdropFilter: "blur(10px)",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                },
              }}
            >
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: "rgba(255, 87, 34, 0.1)",
                    color: "#ff5722",
                    mx: "auto",
                    mb: 2,
                    width: 56,
                    height: 56,
                  }}
                >
                  <TrendingUp sx={{ fontSize: 28 }} />
                </Avatar>
                <Typography
                  variant="h3"
                  component="div"
                  sx={{
                    fontWeight: "bold",
                    color: "#ff5722",
                    mb: 1,
                  }}
                >
                  {stats.highest}%
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 500,
                  }}
                >
                  Highest Score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Card
          elevation={0}
          sx={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
            backdropFilter: "blur(10px)",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: "bold",
                background: "linear-gradient(45deg, #ff5722 30%, #ff9800 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Search & Filter
            </Typography>
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
                        <Search sx={{ color: "#ff5722" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      borderRadius: 2,
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ff5722",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ff5722",
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl
                  fullWidth
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      borderRadius: 2,
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ff5722",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ff5722",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      "&.Mui-focused": {
                        color: "#ff5722",
                      },
                    },
                  }}
                >
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
                    <MenuItem value="passed">Passed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl
                  fullWidth
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      borderRadius: 2,
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ff5722",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ff5722",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      "&.Mui-focused": {
                        color: "#ff5722",
                      },
                    },
                  }}
                >
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="newest">Newest First</MenuItem>
                    <MenuItem value="oldest">Oldest First</MenuItem>
                    <MenuItem value="highest">Highest Score</MenuItem>
                    <MenuItem value="lowest">Lowest Score</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                    setSortBy("newest");
                    setPage(0);
                  }}
                  sx={{
                    borderColor: "#ff5722",
                    color: "#ff5722",
                    backgroundColor: "rgba(255, 87, 34, 0.05)",
                    borderRadius: 2,
                    "&:hover": {
                      borderColor: "#ff5722",
                      backgroundColor: "rgba(255, 87, 34, 0.1)",
                    },
                  }}
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Results Table */}
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
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      background:
                        "linear-gradient(45deg, #ff5722 30%, #ff9800 90%)",
                      "& th": {
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "0.875rem",
                      },
                    }}
                  >
                    <TableCell>Exam</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow
                      key={result._id}
                      sx={{
                        "&:hover": {
                          backgroundColor: "rgba(255, 87, 34, 0.05)",
                        },
                        "&:nth-of-type(even)": {
                          backgroundColor: "rgba(255, 255, 255, 0.7)",
                        },
                        "&:nth-of-type(odd)": {
                          backgroundColor: "rgba(255, 255, 255, 0.5)",
                        },
                      }}
                    >
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: "rgba(255, 87, 34, 0.1)",
                              color: "#ff5722",
                              width: 32,
                              height: 32,
                              fontSize: "0.875rem",
                            }}
                          >
                            {index + 1}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: "bold",
                                color: "text.primary",
                              }}
                            >
                              {result.examTitle}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                fontSize: "0.75rem",
                              }}
                            >
                              {result.questionsCount} questions
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 500,
                          }}
                        >
                          {formatDate(result.submittedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 500,
                          }}
                        >
                          {formatDuration(result.timeSpent)} /{" "}
                          {formatDuration(result.examDuration)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box sx={{ minWidth: 35 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                fontSize: "0.75rem",
                              }}
                            >
                              {result.score}/{result.totalQuestions}
                            </Typography>
                          </Box>
                          <Box sx={{ width: "100%", mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={result.percentage}
                              color={getScoreColor(result.percentage)}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: "rgba(0,0,0,0.1)",
                              }}
                            />
                          </Box>
                          <Box sx={{ minWidth: 45 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: `${getScoreColor(
                                  result.percentage
                                )}.main`,
                                fontWeight: "bold",
                              }}
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
                          sx={{
                            fontWeight: "bold",
                            "& .MuiChip-icon": {
                              fontSize: "1rem",
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(result._id)}
                            sx={{
                              color: "#ff5722",
                              backgroundColor: "rgba(255, 87, 34, 0.1)",
                              "&:hover": {
                                backgroundColor: "rgba(255, 87, 34, 0.2)",
                              },
                            }}
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
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "rgba(255, 87, 34, 0.1)",
                    color: "#ff5722",
                    width: 64,
                    height: 64,
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  <Assessment sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography
                  variant="h6"
                  sx={{
                    color: "text.primary",
                    mb: 1,
                    fontWeight: "bold",
                  }}
                >
                  No results found
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    maxWidth: 400,
                    mx: "auto",
                  }}
                >
                  Complete some exams to see your results here. Your performance
                  analytics will appear once you start taking exams.
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                p: 2,
                borderTop: "1px solid rgba(255,255,255,0.2)",
                backgroundColor: "rgba(255,255,255,0.5)",
              }}
            >
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
                sx={{
                  "& .MuiTablePagination-toolbar": {
                    color: "text.primary",
                  },
                  "& .MuiTablePagination-selectIcon": {
                    color: "#ff5722",
                  },
                  "& .MuiTablePagination-actions button": {
                    color: "#ff5722",
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Result Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
              backdropFilter: "blur(10px)",
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(45deg, #ff5722 30%, #ff9800 90%)",
              color: "white",
              p: 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "white",
                  }}
                >
                  <Assessment />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {selectedResult?.examTitle} - Detailed Results
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Comprehensive performance analysis
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={() => setDetailDialogOpen(false)}
                sx={{
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            {selectedResult && (
              <Box>
                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Card
                      elevation={0}
                      sx={{
                        background: "rgba(76, 175, 80, 0.1)",
                        border: "1px solid rgba(76, 175, 80, 0.2)",
                        textAlign: "center",
                        p: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Score
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ color: "#4caf50", fontWeight: "bold" }}
                      >
                        {selectedResult.score}/{selectedResult.totalQuestions}
                      </Typography>
                      <Typography variant="h6" sx={{ color: "#4caf50" }}>
                        ({selectedResult.percentage}%)
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card
                      elevation={0}
                      sx={{
                        background: "rgba(33, 150, 243, 0.1)",
                        border: "1px solid rgba(33, 150, 243, 0.2)",
                        textAlign: "center",
                        p: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ color: "#2196f3", fontWeight: "bold" }}
                      >
                        {formatDuration(selectedResult.timeSpent)}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card
                      elevation={0}
                      sx={{
                        background: "rgba(255, 193, 7, 0.1)",
                        border: "1px solid rgba(255, 193, 7, 0.2)",
                        textAlign: "center",
                        p: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Submitted
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: "#ff9800", fontWeight: "bold" }}
                      >
                        {formatDate(selectedResult.submittedAt)}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card
                      elevation={0}
                      sx={{
                        background:
                          selectedResult.percentage >= 60
                            ? "rgba(76, 175, 80, 0.1)"
                            : "rgba(244, 67, 54, 0.1)",
                        border:
                          selectedResult.percentage >= 60
                            ? "1px solid rgba(76, 175, 80, 0.2)"
                            : "1px solid rgba(244, 67, 54, 0.2)",
                        textAlign: "center",
                        p: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        label={
                          selectedResult.percentage >= 60 ? "Passed" : "Failed"
                        }
                        color={
                          selectedResult.percentage >= 60 ? "success" : "error"
                        }
                        sx={{ fontWeight: "bold", mt: 1 }}
                      />
                    </Card>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Question-by-Question Analysis */}
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontWeight: "bold",
                    background:
                      "linear-gradient(45deg, #ff5722 30%, #ff9800 90%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Question Analysis
                </Typography>
                <List
                  sx={{ bgcolor: "rgba(255, 255, 255, 0.5)", borderRadius: 2 }}
                >
                  {selectedResult.questionAnalysis?.map((question, index) => (
                    <React.Fragment key={question.questionId}>
                      <ListItem sx={{ py: 2 }}>
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
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Avatar
                                  sx={{
                                    bgcolor: question.isCorrect
                                      ? "#4caf50"
                                      : "#f44336",
                                    width: 24,
                                    height: 24,
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {index + 1}
                                </Avatar>
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  Question {index + 1}
                                </Typography>
                              </Box>
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
                                sx={{ fontWeight: "bold" }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{ mb: 1, fontWeight: 500 }}
                              >
                                {question.questionText}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "text.secondary",
                                  mb: 1,
                                  p: 1,
                                  bgcolor: "rgba(0,0,0,0.05)",
                                  borderRadius: 1,
                                }}
                              >
                                Your answer:{" "}
                                <strong>
                                  {question.selectedAnswer || "Not answered"}
                                </strong>
                              </Typography>
                              {!question.isCorrect && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "success.main",
                                    p: 1,
                                    bgcolor: "rgba(76, 175, 80, 0.1)",
                                    borderRadius: 1,
                                    fontWeight: 500,
                                  }}
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
          <DialogActions
            sx={{
              p: 3,
              background: "rgba(255, 255, 255, 0.7)",
              borderTop: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <Button
              onClick={() => setDetailDialogOpen(false)}
              variant="contained"
              sx={{
                background: "linear-gradient(45deg, #ff5722 30%, #ff9800 90%)",
                color: "white",
                fontWeight: "bold",
                px: 4,
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #e64a19 30%, #f57c00 90%)",
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default StudentResults;
