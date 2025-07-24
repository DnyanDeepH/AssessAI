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
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  FilterList,
  MoreVert,
  PersonAdd,
  Upload,
  Download,
  Refresh,
  Visibility,
  Block,
  CheckCircle,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { adminService } from "../../services/adminService";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create"); // create, edit, view
  const [currentUser, setCurrentUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUserId, setMenuUserId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    studentCount: 0,
    recentUserCount: 0,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUsers(
        page + 1,
        rowsPerPage,
        searchTerm,
        roleFilter
      );
      if (response.success) {
        setUsers(response.data?.users || []);
        setTotalUsers(response.data?.pagination?.totalUsers || 0);
      } else {
        // Set empty data on error to prevent crashes
        setUsers([]);
        setTotalUsers(0);
        showSnackbar(
          response.error?.message || "Failed to fetch users",
          "error"
        );
      }
    } catch (error) {
      // Set empty data on error to prevent crashes
      setUsers([]);
      setTotalUsers(0);
      showSnackbar("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user statistics
  const fetchStats = async () => {
    try {
      const response = await adminService.getUserStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [page, rowsPerPage, searchTerm, roleFilter, statusFilter]);

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

  const handleRoleFilter = (event) => {
    setRoleFilter(event.target.value);
    setPage(0);
  };

  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedUsers((users || []).map((user) => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleMenuOpen = (event, userId) => {
    setAnchorEl(event.currentTarget);
    setMenuUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUserId(null);
  };

  const handleOpenDialog = (mode, user = null) => {
    setDialogMode(mode);
    setCurrentUser(user);
    setOpenDialog(true);
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.profile?.phone || "",
        dateOfBirth: user.profile?.dateOfBirth
          ? new Date(user.profile.dateOfBirth).toISOString().split("T")[0]
          : "",
        isActive: user.isActive,
      });
    } else {
      reset({
        name: "",
        email: "",
        password: "",
        role: "student",
        phone: "",
        dateOfBirth: "",
        isActive: true,
      });
    }
    handleMenuClose();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentUser(null);
    reset();
  };

  const handleSubmitUser = async (data) => {
    try {
      let response;
      if (dialogMode === "create") {
        response = await adminService.createUser(data);
      } else if (dialogMode === "edit") {
        response = await adminService.updateUser(currentUser._id, data);
      }

      if (response.success) {
        showSnackbar(
          `User ${dialogMode === "create" ? "created" : "updated"} successfully`
        );
        fetchUsers();
        fetchStats();
        handleCloseDialog();
      } else {
        showSnackbar(response.error.message, "error");
      }
    } catch (error) {
      showSnackbar("Operation failed", "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await adminService.deleteUser(userId);
        if (response.success) {
          showSnackbar("User deleted successfully");
          fetchUsers();
          fetchStats();
        } else {
          showSnackbar(response.error.message, "error");
        }
      } catch (error) {
        showSnackbar("Failed to delete user", "error");
      }
    }
    handleMenuClose();
  };

  const handleBulkDelete = async () => {
    if (
      selectedUsers.length > 0 &&
      window.confirm(
        `Are you sure you want to delete ${selectedUsers.length} users?`
      )
    ) {
      try {
        const response = await adminService.bulkDeleteUsers({
          userIds: selectedUsers,
        });
        if (response.success) {
          showSnackbar(
            `${response.data.deletedCount} users deleted successfully`
          );
          setSelectedUsers([]);
          fetchUsers();
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
      const response = await fetch("/api/admin/users/export", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSnackbar("Users exported successfully");
      } else {
        showSnackbar("Export failed", "error");
      }
    } catch (error) {
      showSnackbar("Export failed", "error");
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Management
        </Typography>

        {/* Statistics Cards */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">{stats?.totalUsers || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Active Users
                  </Typography>
                  <Typography variant="h4">
                    {stats?.activeUsers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Students
                  </Typography>
                  <Typography variant="h4">
                    {stats?.studentCount || 0}
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
                    {stats?.recentUserCount || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
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
                placeholder="Search users..."
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
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={handleRoleFilter}
                  label="Role"
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
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
                  Add User
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
                <IconButton onClick={fetchUsers}>
                  <Refresh />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </Toolbar>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <Toolbar
            sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}
          >
            <Typography sx={{ flex: "1 1 100%" }}>
              {selectedUsers.length} selected
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

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedUsers.length > 0 &&
                      selectedUsers.length < (users || []).length
                    }
                    checked={
                      (users || []).length > 0 &&
                      selectedUsers.length === (users || []).length
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Login</TableCell>
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
              ) : (users || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                (users || []).map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleSelectUser(user._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor:
                              user.role === "admin"
                                ? "error.main"
                                : "primary.main",
                          }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">{user.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={user.role === "admin" ? "error" : "primary"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? "Active" : "Inactive"}
                        color={user.isActive ? "success" : "default"}
                        size="small"
                        icon={user.isActive ? <CheckCircle /> : <Block />}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, user._id)}
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
          count={totalUsers}
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
            const user = users.find((u) => u._id === menuUserId);
            handleOpenDialog("view", user);
          }}
        >
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const user = users.find((u) => u._id === menuUserId);
            handleOpenDialog("edit", user);
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => handleDeleteUser(menuUserId)}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>

      {/* User Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === "create"
            ? "Add New User"
            : dialogMode === "edit"
            ? "Edit User"
            : "User Details"}
        </DialogTitle>
        <form onSubmit={handleSubmit(handleSubmitUser)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: "Name is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Full Name"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      disabled={dialogMode === "view"}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: "Invalid email address",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      disabled={dialogMode === "view"}
                    />
                  )}
                />
              </Grid>
              {dialogMode === "create" && (
                <Grid item xs={12} md={6}>
                  <Controller
                    name="password"
                    control={control}
                    rules={{
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Password"
                        type="password"
                        error={!!errors.password}
                        helperText={errors.password?.message}
                      />
                    )}
                  />
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth disabled={dialogMode === "view"}>
                      <InputLabel>Role</InputLabel>
                      <Select {...field} label="Role">
                        <MenuItem value="student">Student</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone Number"
                      disabled={dialogMode === "view"}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      disabled={dialogMode === "view"}
                    />
                  )}
                />
              </Grid>
              {dialogMode !== "create" && (
                <Grid item xs={12}>
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        component="fieldset"
                        disabled={dialogMode === "view"}
                      >
                        <Checkbox
                          {...field}
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                        Active User
                      </FormControl>
                    )}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            {dialogMode !== "view" && (
              <Button type="submit" variant="contained">
                {dialogMode === "create" ? "Create User" : "Update User"}
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

export default UserManagement;
