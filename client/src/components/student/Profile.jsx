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
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from "@mui/material";
import {
  Person,
  Edit,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  Lock,
  Email,
  Phone,
  CalendarToday,
  School,
  Assessment,
  TrendingUp,
  Schedule,
  PhotoCamera,
} from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import { studentService } from "../../services/studentService";
import { isValidEmail, validatePassword, formatDate } from "../../utils";

const StudentProfile = () => {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileStats, setProfileStats] = useState(null);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
    setValue: setProfileValue,
  } = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.profile?.phone || "",
      dateOfBirth: user?.profile?.dateOfBirth
        ? user.profile.dateOfBirth.split("T")[0]
        : "",
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword,
  } = useForm();

  const newPassword = watchPassword("newPassword");

  useEffect(() => {
    fetchProfileStats();
  }, []);

  useEffect(() => {
    // Update form values when user data changes
    if (user) {
      setProfileValue("name", user.name || "");
      setProfileValue("email", user.email || "");
      setProfileValue("phone", user.profile?.phone || "");
      setProfileValue(
        "dateOfBirth",
        user.profile?.dateOfBirth ? user.profile.dateOfBirth.split("T")[0] : ""
      );
    }
  }, [user, setProfileValue]);

  const fetchProfileStats = async () => {
    try {
      const response = await studentService.getDashboard();
      if (response.success) {
        setProfileStats(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile stats:", err);
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const response = await studentService.updateProfile(data);
      if (response.success) {
        setSuccess("Profile updated successfully!");
        setEditMode(false);

        // Update auth context with new user data
        const updatedUser = { ...user, ...response.data.user };
        // Note: In a real app, you might want to refresh the token or update the context properly

        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(response.error.message);
      }
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const response = await studentService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (response.success) {
        setSuccess("Password changed successfully!");
        setPasswordDialogOpen(false);
        resetPassword();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(response.error.message);
      }
    } catch (err) {
      setError("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    resetProfile({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.profile?.phone || "",
      dateOfBirth: user?.profile?.dateOfBirth
        ? user.profile.dateOfBirth.split("T")[0]
        : "",
    });
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            My Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account settings and view your academic progress
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
          {/* Profile Card */}
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: "center" }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: "auto",
                    mb: 2,
                    bgcolor: "primary.main",
                    fontSize: "3rem",
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </Avatar>

                <Typography variant="h5" gutterBottom>
                  {user?.name}
                </Typography>

                <Chip
                  label={user?.role?.toUpperCase()}
                  color="primary"
                  size="small"
                  sx={{ mb: 2 }}
                />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Member since {formatDate(user?.createdAt)}
                </Typography>

                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  size="small"
                  sx={{ mt: 2 }}
                  disabled
                >
                  Change Photo
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {profileStats && (
              <Card elevation={2} sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Stats
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Assessment color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Completed Exams"
                        secondary={profileStats.completedExamsCount || 0}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <TrendingUp color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Average Score"
                        secondary={
                          profileStats.averageScore
                            ? `${profileStats.averageScore}%`
                            : "N/A"
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Schedule color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Upcoming Exams"
                        secondary={profileStats.upcomingExamsCount || 0}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                sx={{ borderBottom: 1, borderColor: "divider" }}
              >
                <Tab label="Personal Information" />
                <Tab label="Account Settings" />
              </Tabs>

              {/* Personal Information Tab */}
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Typography variant="h6">Personal Information</Typography>
                    {!editMode ? (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => setEditMode(true)}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleProfileSubmit(onProfileSubmit)}
                          disabled={loading}
                        >
                          {loading ? <CircularProgress size={20} /> : "Save"}
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          disabled={!editMode}
                          {...registerProfile("name", {
                            required: "Name is required",
                            minLength: {
                              value: 2,
                              message: "Name must be at least 2 characters",
                            },
                          })}
                          error={!!profileErrors.name}
                          helperText={profileErrors.name?.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email Address"
                          type="email"
                          disabled={!editMode}
                          {...registerProfile("email", {
                            required: "Email is required",
                            validate: (value) =>
                              isValidEmail(value) ||
                              "Please enter a valid email address",
                          })}
                          error={!!profileErrors.email}
                          helperText={profileErrors.email?.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Email />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          disabled={!editMode}
                          {...registerProfile("phone")}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Phone />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Date of Birth"
                          type="date"
                          disabled={!editMode}
                          {...registerProfile("dateOfBirth")}
                          InputLabelProps={{
                            shrink: true,
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarToday />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                  </form>
                </Box>
              </TabPanel>

              {/* Account Settings Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Account Settings
                  </Typography>

                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Lock />
                      </ListItemIcon>
                      <ListItemText
                        primary="Password"
                        secondary="Change your account password"
                      />
                      <Button
                        variant="outlined"
                        onClick={() => setPasswordDialogOpen(true)}
                      >
                        Change Password
                      </Button>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <Email />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email Notifications"
                        secondary="Manage your email preferences"
                      />
                      <Button variant="outlined" disabled>
                        Configure
                      </Button>
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemIcon>
                        <School />
                      </ListItemIcon>
                      <ListItemText
                        primary="Account Type"
                        secondary={`Current role: ${user?.role?.toUpperCase()}`}
                      />
                    </ListItem>
                  </List>
                </Box>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>

        {/* Change Password Dialog */}
        <Dialog
          open={passwordDialogOpen}
          onClose={() => setPasswordDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type={showCurrentPassword ? "text" : "password"}
                    {...registerPassword("currentPassword", {
                      required: "Current password is required",
                    })}
                    error={!!passwordErrors.currentPassword}
                    helperText={passwordErrors.currentPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            edge="end"
                          >
                            {showCurrentPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type={showNewPassword ? "text" : "password"}
                    {...registerPassword("newPassword", {
                      required: "New password is required",
                      validate: (value) => {
                        const validation = validatePassword(value);
                        return validation.isValid || validation.message;
                      },
                    })}
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                          >
                            {showNewPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type={showConfirmPassword ? "text" : "password"}
                    {...registerPassword("confirmPassword", {
                      required: "Please confirm your new password",
                      validate: (value) =>
                        value === newPassword || "Passwords do not match",
                    })}
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            edge="end"
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handlePasswordSubmit(onPasswordSubmit)}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : "Change Password"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default StudentProfile;
