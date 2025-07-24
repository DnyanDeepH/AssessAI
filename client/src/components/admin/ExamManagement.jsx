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
  Toolbar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  MoreVert,
  Refresh,
  Visibility,
  Assignment,
  Schedule,
  People,
  Quiz,
  CheckCircle,
  AccessTime,
  PlayArrow,
  Analytics,
  PersonAdd,
  Security,
  Close,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { adminService } from "../../services/adminService";
import SessionAnalytics from "./SessionAnalytics";

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalExams, setTotalExams] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [currentExam, setCurrentExam] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuExamId, setMenuExamId] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      durationInMinutes: 60,
      startTime: "",
      endTime: "",
    },
  });

  // Fetch exams
  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await adminService.getExams(
        page + 1,
        rowsPerPage,
        searchTerm,
        statusFilter
      );
      if (response.success) {
        setExams(response.data.exams);
        setTotalExams(response.data.pagination.totalExams);
      } else {
        showSnackbar(response.error.message, "error");
      }
    } catch (error) {
      showSnackbar("Failed to fetch exams", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [page, rowsPerPage, searchTerm, statusFilter]);

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

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleMenuOpen = (event, examId) => {
    setAnchorEl(event.currentTarget);
    setMenuExamId(examId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuExamId(null);
  };

  const handleOpenDialog = (mode, exam = null) => {
    setDialogMode(mode);
    setCurrentExam(exam);
    setOpenDialog(true);

    if (exam) {
      const startTime = new Date(exam.startTime);
      const endTime = new Date(exam.endTime);

      reset({
        title: exam.title,
        description: exam.description || "",
        durationInMinutes: exam.durationInMinutes,
        startTime: startTime.toISOString().slice(0, 16),
        endTime: endTime.toISOString().slice(0, 16),
      });
    } else {
      reset({
        title: "",
        description: "",
        durationInMinutes: 60,
        startTime: "",
        endTime: "",
      });
    }
    handleMenuClose();
  };

  const handleOpenAnalytics = (examId) => {
    setSelectedExamId(examId);
    setShowAnalytics(true);
    handleMenuClose();
  };

  const handleCloseAnalytics = () => {
    setShowAnalytics(false);
    setSelectedExamId(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentExam(null);
    reset();
  };

  const handleSubmitExam = async (data) => {
    try {
      let response;
      if (dialogMode === "create") {
        response = await adminService.createExam(data);
      } else if (dialogMode === "edit") {
        response = await adminService.updateExam(currentExam._id, data);
      }

      if (response.success) {
        showSnackbar(
          `Exam ${dialogMode === "create" ? "created" : "updated"} successfully`
        );
        fetchExams();
        handleCloseDialog();
      } else {
        showSnackbar(response.error.message, "error");
      }
    } catch (error) {
      showSnackbar("Operation failed", "error");
    }
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      try {
        const response = await adminService.deleteExam(examId);
        if (response.success) {
          showSnackbar("Exam deleted successfully");
          fetchExams();
        } else {
          showSnackbar(response.error.message, "error");
        }
      } catch (error) {
        showSnackbar("Failed to delete exam", "error");
      }
    }
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "info";
      case "active":
        return "success";
      case "completed":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "upcoming":
        return <Schedule />;
      case "active":
        return <PlayArrow />;
      case "completed":
        return <CheckCircle />;
      default:
        return <Assignment />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Exam Management
        </Typography>
      </Box>

      {/* Toolbar */}
      <Paper sx={{ mb: 2 }}>
        <Toolbar>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search exams..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog("create")}
                >
                  Create Exam
                </Button>
                <IconButton onClick={fetchExams}>
                  <Refresh />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </Toolbar>
      </Paper>

      {/* Exams Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Exam</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Questions</TableCell>
                <TableCell>Assigned</TableCell>
                <TableCell>Submissions</TableCell>
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
              ) : (exams || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No exams found
                  </TableCell>
                </TableRow>
              ) : (
                (exams || []).map((exam) => (
                  <TableRow key={exam._id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {exam.title}
                        </Typography>
                        {exam.description && (
                          <Typography variant="body2" color="text.secondary">
                            {(exam.description || "").length > 50
                              ? `${exam.description.substring(0, 50)}...`
                              : exam.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<AccessTime />}
                        label={`${exam.durationInMinutes} min`}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(exam.startTime).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        to {new Date(exam.endTime).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(exam.status)}
                        label={exam.status}
                        color={getStatusColor(exam.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<Quiz />}
                        label={exam.questions?.length || 0}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<People />}
                        label={exam.assignedTo?.length || 0}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<Analytics />}
                        label={exam.submissionCount || 0}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, exam._id)}
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
          count={totalExams}
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
            const exam = exams.find((e) => e._id === menuExamId);
            handleOpenDialog("view", exam);
          }}
        >
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const exam = exams.find((e) => e._id === menuExamId);
            handleOpenDialog("edit", exam);
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Exam</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleOpenAnalytics(menuExamId)}>
          <ListItemIcon>
            <Security fontSize="small" />
          </ListItemIcon>
          <ListItemText>Session Analytics</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => handleDeleteExam(menuExamId)}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Exam</ListItemText>
        </MenuItem>
      </Menu>

      {/* Exam Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "create"
            ? "Create New Exam"
            : dialogMode === "edit"
            ? "Edit Exam"
            : "Exam Details"}
        </DialogTitle>

        <form onSubmit={handleSubmit(handleSubmitExam)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="title"
                  control={control}
                  rules={{ required: "Title is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Exam Title"
                      error={!!errors.title}
                      helperText={errors.title?.message}
                      disabled={dialogMode === "view"}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                      disabled={dialogMode === "view"}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="durationInMinutes"
                  control={control}
                  rules={{ required: "Duration is required", min: 1 }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Duration (minutes)"
                      type="number"
                      error={!!errors.durationInMinutes}
                      helperText={errors.durationInMinutes?.message}
                      disabled={dialogMode === "view"}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="startTime"
                  control={control}
                  rules={{ required: "Start time is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Start Time"
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.startTime}
                      helperText={errors.startTime?.message}
                      disabled={dialogMode === "view"}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="endTime"
                  control={control}
                  rules={{ required: "End time is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="End Time"
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.endTime}
                      helperText={errors.endTime?.message}
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
                {dialogMode === "create" ? "Create Exam" : "Update Exam"}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>

      {/* Session Analytics Dialog */}
      <Dialog
        open={showAnalytics}
        onClose={handleCloseAnalytics}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Session Analytics
          <IconButton
            aria-label="close"
            onClick={handleCloseAnalytics}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedExamId && <SessionAnalytics examId={selectedExamId} />}
        </DialogContent>
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

export default ExamManagement;
